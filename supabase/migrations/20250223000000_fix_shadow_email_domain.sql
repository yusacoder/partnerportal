-- =========================================================
-- Migration: Fix Partner Shadow Email Domain Format
-- Timestamp: 20250223000000
-- Description: Updates shadow email domain format from `.internal`
-- to `.net` (`@partner.eternalproduction.net`) to comply with Supabase Auth
-- email TLD and format validation rules, while preserving username-based logins.
-- =========================================================

-- Ensure get_partner_auth_email_by_username function exists and searches linked auth emails
CREATE OR REPLACE FUNCTION public.get_partner_auth_email_by_username(p_username TEXT)
RETURNS TABLE (email TEXT, is_active BOOLEAN) AS $$
DECLARE
  v_email TEXT;
  v_is_active BOOLEAN;
BEGIN
  IF p_username IS NULL OR TRIM(p_username) = '' THEN
    RETURN;
  END IF;

  -- 1. partners tablosunda kullanıcı adını ara (Auth kullanıcısı ile ilişkilendirilmiş)
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
