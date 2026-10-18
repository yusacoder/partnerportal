-- =========================================================
-- Eternal Production Partner Portal - Admin Direct User Creation Migration
-- Migration: 20250224000000_admin_direct_user_creation.sql
-- =========================================================

-- Ensure pgcrypto extension is active for password hashing (crypt / gen_salt)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. UPDATE get_partner_auth_email_by_username
CREATE OR REPLACE FUNCTION public.get_partner_auth_email_by_username(p_username TEXT)
RETURNS TABLE (email TEXT, is_active BOOLEAN) AS $$
DECLARE
  v_email TEXT;
  v_is_active BOOLEAN;
BEGIN
  IF p_username IS NULL OR TRIM(p_username) = '' THEN
    RETURN;
  END IF;

  -- 1. Search in partners table joined with auth.users
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

  -- 2. Fallback search in auth.users for Admin accounts
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, extensions;

-- 2. CREATE RPC FUNCTION FOR ADMIN DIRECT PARTNER CREATION
CREATE OR REPLACE FUNCTION public.admin_create_partner_user(
  p_username TEXT,
  p_display_name TEXT,
  p_password TEXT,
  p_is_active BOOLEAN DEFAULT true
)
RETURNS TABLE (
  partner_id UUID,
  auth_user_id UUID,
  username TEXT,
  display_name TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
DECLARE
  v_clean_username TEXT;
  v_clean_display_name TEXT;
  v_email TEXT;
  v_auth_user_id UUID;
  v_partner_id UUID;
  v_now TIMESTAMPTZ := now();
BEGIN
  -- Strict server-side authorization check
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Yetkisiz erişim: Bu işlemi gerçekleştirmek için yönetici yetkisi gereklidir.';
  END IF;

  -- Validate inputs
  v_clean_username := LOWER(TRIM(p_username));
  v_clean_display_name := TRIM(p_display_name);

  IF v_clean_username IS NULL OR v_clean_username = '' THEN
    RAISE EXCEPTION 'Kullanıcı adı boş bırakılamaz.';
  END IF;

  IF v_clean_display_name IS NULL OR v_clean_display_name = '' THEN
    RAISE EXCEPTION 'Firma / Görünen ad boş bırakılamaz.';
  END IF;

  IF p_password IS NULL OR length(p_password) < 6 THEN
    RAISE EXCEPTION 'Başlangıç şifresi en az 6 karakter uzunluğunda olmalıdır.';
  END IF;

  -- Check if username already exists in partners table
  IF EXISTS (SELECT 1 FROM public.partners WHERE LOWER(username) = v_clean_username) THEN
    RAISE EXCEPTION 'Bu kullanıcı adı (%) zaten kullanılmaktadır.', v_clean_username;
  END IF;

  -- Generate canonical shadow email for Supabase Auth
  v_email := v_clean_username || '@partner.eternalproduction.net';

  -- Check if auth user with this email already exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = v_email) THEN
    RAISE EXCEPTION 'Bu kullanıcı adı için tanımlı yetkilendirme hesabı zaten mevcut.';
  END IF;

  v_auth_user_id := gen_random_uuid();

  -- 1. Insert into auth.users with encrypted password
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_sso_user,
    created_at,
    updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_auth_user_id,
    'authenticated',
    'authenticated',
    v_email,
    crypt(p_password, gen_salt('bf')),
    v_now,
    '{"provider": "email", "providers": ["email"], "role": "partner"}'::jsonb,
    jsonb_build_object('username', v_clean_username, 'display_name', v_clean_display_name),
    false,
    v_now,
    v_now
  );

  -- 2. Insert into auth.identities
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    v_auth_user_id,
    v_auth_user_id,
    jsonb_build_object('sub', v_auth_user_id::text, 'email', v_email),
    'email',
    v_email,
    v_now,
    v_now,
    v_now
  );

  -- 3. Insert into user_roles
  INSERT INTO public.user_roles (user_id, role, created_at)
  VALUES (v_auth_user_id, 'partner', v_now)
  ON CONFLICT (user_id) DO UPDATE SET role = 'partner';

  -- 4. Insert into partners
  INSERT INTO public.partners (
    auth_user_id,
    username,
    display_name,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    v_auth_user_id,
    v_clean_username,
    v_clean_display_name,
    COALESCE(p_is_active, true),
    v_now,
    v_now
  )
  RETURNING id INTO v_partner_id;

  -- 5. Insert initial status
  INSERT INTO public.partner_status (
    partner_id,
    status,
    description,
    required_action,
    updated_by,
    updated_at
  ) VALUES (
    v_partner_id,
    'Normal',
    'Yeni partner hesabı doğrudan yönetici tarafından oluşturuldu.',
    '',
    auth.uid(),
    v_now
  );

  -- 6. Insert audit log
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO public.audit_logs (
      actor_user_id,
      action,
      entity_type,
      entity_id,
      metadata,
      created_at
    ) VALUES (
      auth.uid(),
      'ADMIN_CREATE_PARTNER',
      'partners',
      v_partner_id,
      jsonb_build_object('username', v_clean_username, 'is_active', COALESCE(p_is_active, true)),
      v_now
    );
  END IF;

  RETURN QUERY SELECT
    v_partner_id,
    v_auth_user_id,
    v_clean_username,
    v_clean_display_name,
    COALESCE(p_is_active, true),
    v_now;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, extensions;

-- Grant execution rights appropriately
GRANT EXECUTE ON FUNCTION public.admin_create_partner_user(TEXT, TEXT, TEXT, BOOLEAN) TO authenticated, service_role;
