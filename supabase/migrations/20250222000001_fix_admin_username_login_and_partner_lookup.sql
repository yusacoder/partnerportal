-- =========================================================
-- Migration: Fix Admin Username Login & Partner Lookup
-- Timestamp: 20250222000001
-- Description: Updates get_partner_auth_email_by_username function to check
-- auth.users and user_roles for admin accounts if no partner record is found
-- in public.partners. Enables seamless admin logins using email prefix or username.
-- =========================================================

CREATE OR REPLACE FUNCTION public.get_partner_auth_email_by_username(p_username TEXT)
RETURNS TABLE (email TEXT, is_active BOOLEAN) AS $$
DECLARE
  v_clean_username TEXT := LOWER(TRIM(p_username));
BEGIN
  -- 1. Öncelikli olarak partners tablosunda arama yap
  RETURN QUERY
  SELECT
    au.email::text,
    p.is_active
  FROM public.partners p
  JOIN auth.users au ON au.id = p.auth_user_id
  WHERE LOWER(p.username) = v_clean_username
  LIMIT 1;

  IF FOUND THEN
    RETURN;
  END IF;

  -- 2. Partner kaydı bulunamadıysa admin hesaplarını auth.users / user_roles üzerinden kontrol et
  RETURN QUERY
  SELECT
    au.email::text,
    true AS is_active
  FROM auth.users au
  LEFT JOIN public.user_roles ur ON ur.user_id = au.id
  WHERE (ur.role = 'admin' OR (au.raw_app_meta_data->>'role') = 'admin')
    AND (
      LOWER(au.email) = v_clean_username
      OR LOWER(split_part(au.email, '@', 1)) = v_clean_username
      OR LOWER(au.raw_user_meta_data->>'username') = v_clean_username
    )
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;
