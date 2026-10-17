-- =========================================================
-- Migration: Fix Admin Login, Roles & Security Policies
-- Timestamp: 20250222000000
-- Description: Ensures safe, idempotent admin authorization,
-- RLS policies, helper functions, and invite token SECURITY DEFINER RPCs
-- without deleting existing database tables or partner data.
-- =========================================================

-- 1. KULLANICI ROLLERİ TABLOSU
CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'partner',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. IS_ADMIN() KONTROL FONKSİYONU (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- 3. GET_PARTNER_AUTH_EMAIL_BY_USERNAME FONKSİYONU
CREATE OR REPLACE FUNCTION public.get_partner_auth_email_by_username(p_username TEXT)
RETURNS TABLE (email TEXT, is_active BOOLEAN) AS $$
DECLARE
  v_email TEXT;
  v_is_active BOOLEAN;
BEGIN
  IF p_username IS NULL OR TRIM(p_username) = '' THEN
    RETURN;
  END IF;

  -- 1. partners tablosunda kullanıcı adını ara
  SELECT
    au.email::text,
    p.is_active
  INTO v_email, v_is_active
  FROM public.partners p
  JOIN auth.users au ON au.id = p.auth_user_id
  WHERE LOWER(p.username) = LOWER(TRIM(p_username))
  LIMIT 1;

  IF v_email IS NOT NULL THEN
    RETURN QUERY SELECT v_email, v_is_active;
    RETURN;
  END IF;

  -- 2. partners tablosunda bulunamazsa auth.users tablosunda e-posta veya e-posta ön ekini ara (Admin hesapları için)
  SELECT
    au.email::text,
    true AS is_active
  INTO v_email, v_is_active
  FROM auth.users au
  WHERE (
    LOWER(au.email) = LOWER(TRIM(p_username))
    OR LOWER(split_part(au.email, '@', 1)) = LOWER(TRIM(p_username))
  )
  AND (
    (au.raw_app_meta_data ->> 'role') = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = au.id AND ur.role = 'admin'
    )
  )
  LIMIT 1;

  IF v_email IS NOT NULL THEN
    RETURN QUERY SELECT v_email, v_is_active;
    RETURN;
  END IF;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- 4. DAVET KODU DOĞRULAMA VE ONAYLAMA FONKSİYONLARI
CREATE OR REPLACE FUNCTION public.get_partner_by_invite_token(p_token TEXT)
RETURNS TABLE (
  id UUID,
  username VARCHAR,
  display_name VARCHAR,
  is_active BOOLEAN,
  invite_expires_at TIMESTAMPTZ
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
    p.invite_expires_at
  FROM public.partners p
  WHERE p.invite_token = TRIM(p_token)
    AND (p.invite_expires_at IS NULL OR p.invite_expires_at > now())
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

CREATE OR REPLACE FUNCTION public.claim_partner_invite(p_token TEXT, p_auth_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_partner_id UUID;
BEGIN
  IF p_token IS NULL OR TRIM(p_token) = '' OR p_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Geçersiz parametreler.';
  END IF;

  SELECT p.id INTO v_partner_id
  FROM public.partners p
  WHERE p.invite_token = TRIM(p_token)
    AND (p.invite_expires_at IS NULL OR p.invite_expires_at > now());

  IF v_partner_id IS NULL THEN
    RAISE EXCEPTION 'Geçersiz veya süresi dolmuş davet kodu.';
  END IF;

  -- 1. Partner kaydını güncelle
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

-- 5. GRANT_ADMIN_ROLE() FONKSİYONU
CREATE OR REPLACE FUNCTION public.grant_admin_role(target_email TEXT)
RETURNS VOID AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Normal kullanıcıların client / RPC üzerinden yetki yükseltmesini engelle
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Yetkisiz erişim: Bu işlemi gerçekleştirme yetkiniz yok.';
  END IF;

  IF target_email IS NULL OR TRIM(target_email) = '' THEN
    RAISE EXCEPTION 'Geçersiz e-posta adresi.';
  END IF;

  SELECT id INTO target_user_id
  FROM auth.users
  WHERE LOWER(email) = LOWER(TRIM(target_email));

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Kullanıcı bulunamadı: %', target_email;
  END IF;

  -- raw_app_meta_data güncelleme
  UPDATE auth.users
  SET raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
  WHERE id = target_user_id;

  -- user_roles tablosuna ekle / güncelle
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- Fonksiyona erişim izinlerini kısıtla
REVOKE EXECUTE ON FUNCTION public.grant_admin_role(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_admin_role(TEXT) TO service_role, postgres;

-- 6. USER_ROLES VE PARTNERS RLS POLİTİKALARI
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own role or admin views all" ON public.user_roles;
CREATE POLICY "Users can view own role or admin views all"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Only admins can modify user_roles" ON public.user_roles;
CREATE POLICY "Only admins can modify user_roles"
ON public.user_roles FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Partners view own profile or admin views all or invite token lookup" ON public.partners;
DROP POLICY IF EXISTS "Partners view own profile or admin views all" ON public.partners;
CREATE POLICY "Partners view own profile or admin views all"
ON public.partners FOR SELECT
USING (
  auth_user_id = auth.uid()
  OR public.is_admin()
);

DROP POLICY IF EXISTS "Admins or partner setting auth_user_id on invite claim can update partner" ON public.partners;
DROP POLICY IF EXISTS "Admins or partner updates own record" ON public.partners;
CREATE POLICY "Admins or partner updates own record"
ON public.partners FOR UPDATE
USING (
  public.is_admin()
  OR (auth_user_id = auth.uid())
)
WITH CHECK (
  public.is_admin()
  OR (auth_user_id = auth.uid())
);

-- 7. VARSA DESTEK ADMIN HESABINA YETKİ VER
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = 'destek@eternalproduction.net') THEN
    PERFORM public.grant_admin_role('destek@eternalproduction.net');
  END IF;
END $$;
