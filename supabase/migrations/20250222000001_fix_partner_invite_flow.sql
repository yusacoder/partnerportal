-- =========================================================
-- Migration: Fix Partner Invite Flow & Atomicity
-- Timestamp: 20250222000001
-- Description: Updates get_partner_by_invite_token and claim_partner_invite
-- RPC functions to ensure accurate token status detection (valid, expired,
-- already used, or inactive) and atomic invite claiming without RLS errors.
-- =========================================================

-- 1. DAVET KODU DOĞRULAMA FONKSİYONU
CREATE OR REPLACE FUNCTION public.get_partner_by_invite_token(p_token TEXT)
RETURNS TABLE (
  id UUID,
  username VARCHAR,
  display_name VARCHAR,
  is_active BOOLEAN,
  invite_expires_at TIMESTAMPTZ,
  auth_user_id UUID
) AS $$
BEGIN
  IF p_token IS NULL OR TRIM(p_token) = '' THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.username,
    p.display_name,
    p.is_active,
    p.invite_expires_at,
    p.auth_user_id
  FROM public.partners p
  WHERE p.invite_token = TRIM(p_token)
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- 2. DAVET ONAYLAMA VE KULLANICI İLİŞKİLENDİRME FONKSİYONU
CREATE OR REPLACE FUNCTION public.claim_partner_invite(p_token TEXT, p_auth_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_partner_id UUID;
  v_expires_at TIMESTAMPTZ;
  v_is_active BOOLEAN;
  v_existing_auth UUID;
BEGIN
  IF p_token IS NULL OR TRIM(p_token) = '' OR p_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Geçersiz parametreler.';
  END IF;

  SELECT p.id, p.invite_expires_at, p.is_active, p.auth_user_id
  INTO v_partner_id, v_expires_at, v_is_active, v_existing_auth
  FROM public.partners p
  WHERE p.invite_token = TRIM(p_token);

  IF v_partner_id IS NULL THEN
    RAISE EXCEPTION 'Geçersiz veya kullanılmış davet bağlantısı.';
  END IF;

  IF v_existing_auth IS NOT NULL THEN
    RAISE EXCEPTION 'Bu davet bağlantısı daha önce kullanılmış.';
  END IF;

  IF NOT v_is_active THEN
    RAISE EXCEPTION 'Hesabınız pasif duruma getirilmiştir. Lütfen ajans ile iletişime geçin.';
  END IF;

  IF v_expires_at IS NOT NULL AND v_expires_at <= now() THEN
    RAISE EXCEPTION 'Davet bağlantısının süresi dolmuş.';
  END IF;

  -- 1. Partner kaydını güncelle (davet tokenını tüket ve auth_user_id bağla)
  UPDATE public.partners
  SET
    auth_user_id = p_auth_user_id,
    invite_token = NULL,
    invite_expires_at = NULL,
    updated_at = now()
  WHERE id = v_partner_id;

  -- 2. user_roles kaydını ekle / güncelle
  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_auth_user_id, 'partner')
  ON CONFLICT (user_id) DO UPDATE SET role = 'partner';

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- 3. RPC ERİŞİM İZİNLERİNİ VER
GRANT EXECUTE ON FUNCTION public.get_partner_by_invite_token(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.claim_partner_invite(TEXT, UUID) TO anon, authenticated, service_role;
