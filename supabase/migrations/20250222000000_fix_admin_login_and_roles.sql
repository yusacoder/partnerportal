-- =========================================================
-- Migration: Fix Admin Login, Roles & Security Policies
-- Timestamp: 20250222000000
-- Description: Ensures safe, idempotent admin authorization,
-- RLS policies on user_roles, and helper functions without
-- deleting existing database tables or partner data.
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. GRANT_ADMIN_ROLE() FONKSİYONU
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

-- 4. USER_ROLES RLS POLİTİKALARI
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

-- 5. VARSA DESTEK ADMIN HESABINA YETKİ VER
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = 'destek@eternalproduction.net') THEN
    PERFORM public.grant_admin_role('destek@eternalproduction.net');
  END IF;
END $$;
