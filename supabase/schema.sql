-- =========================================================
-- Eternal Production Partner Portal - Veritabanı Şeması & RLS Politikaları
-- =========================================================

-- pgcrypto eklentisinin aktif olduğundan emin ol (şifre hashleme crypt/gen_salt için)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. KULLANICI ROLLERİ TABLOSU
CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'partner',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. PARTNERLER TABLOSU
CREATE TABLE IF NOT EXISTS public.partners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    invite_token VARCHAR(255),
    invite_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. PARTNER DURUM TABLOSU
CREATE TABLE IF NOT EXISTS public.partner_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'Normal' NOT NULL,
    description TEXT DEFAULT '',
    required_action TEXT DEFAULT '',
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. PARTNER DURUM GEÇMİŞİ
CREATE TABLE IF NOT EXISTS public.partner_status_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL,
    previous_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    description TEXT DEFAULT '',
    changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. DUYURULAR TABLOSU
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'Genel duyuru' NOT NULL,
    priority VARCHAR(50) DEFAULT 'Normal' NOT NULL,
    publication_status VARCHAR(50) DEFAULT 'Yayında' NOT NULL,
    target_audience VARCHAR(50) DEFAULT 'all' NOT NULL,
    target_partner_ids TEXT[] DEFAULT '{}',
    published_at TIMESTAMPTZ DEFAULT now(),
    scheduled_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. DUYURU OKUMA KAYITLARI
CREATE TABLE IF NOT EXISTS public.announcement_reads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    announcement_id UUID REFERENCES public.announcements(id) ON DELETE CASCADE NOT NULL,
    partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL,
    read_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_announcement_partner_read UNIQUE (announcement_id, partner_id)
);

-- 7. DESTEK TALEPLERİ (TICKETS)
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL,
    subject VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(50) DEFAULT 'Normal' NOT NULL,
    status VARCHAR(50) DEFAULT 'Yeni' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. DESTEK MESAJLARI
CREATE TABLE IF NOT EXISTS public.support_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE NOT NULL,
    sender_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. DESTEK İÇ NOTLARI (Sadece Admin Görebilir)
CREATE TABLE IF NOT EXISTS public.support_internal_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE NOT NULL,
    admin_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. UYGULAMA AYARLARI
CREATE TABLE IF NOT EXISTS public.app_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 11. DENETİM KAYITLARI (AUDIT LOGS)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    actor_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =========================================================
-- YARDIMCI FONKSİYONLAR
-- =========================================================

-- Admin kontrol fonksiyonu (SECURITY DEFINER - Güvenilir Sunucu Tarafı Kontrolü)
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

-- Destek Talebi Numarası Üreten Fonksiyon
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
    date_part TEXT;
    seq_num INT;
    result TEXT;
BEGIN
    date_part := to_char(now(), 'YYYYMMDD');
    SELECT COUNT(*) + 1 INTO seq_num FROM public.support_tickets WHERE created_at::date = CURRENT_DATE;
    result := 'TCK-' || date_part || '-' || LPAD(seq_num::text, 4, '0');
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- Partner / Admin Kullanıcı Adından E-posta ve Aktiflik Sorgulama Fonksiyonu
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

-- Davet Kodu Doğrulama Fonksiyonu
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

-- Davet Onaylama ve Kullanıcı İlişkilendirme Fonksiyonu
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

-- Yönetici Tarafından Doğrudan Partner Kullanıcısı Oluşturma Fonksiyonu
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

-- Güvenlik: admin_create_partner_user izinleri
REVOKE EXECUTE ON FUNCTION public.admin_create_partner_user(TEXT, TEXT, TEXT, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_create_partner_user(TEXT, TEXT, TEXT, BOOLEAN) TO authenticated, service_role;

-- GÜVENLİ ADMIN YETKİSİ VERME FONKSİYONU
CREATE OR REPLACE FUNCTION public.grant_admin_role(target_email TEXT)
RETURNS VOID AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Normal kullanıcıların client / RPC üzerinden kendilerine veya başkalarına admin yetkisi vermesini engelle
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

  -- 1. app_metadata alanını güncelle (Supabase Auth güvenli metadata)
  UPDATE auth.users
  SET raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
  WHERE id = target_user_id;

  -- 2. user_roles tablosuna ekle / güncelle
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- Güvenlik: Normal (anonim ve varsayılan authenticated) kullanıcıların RPC ile bu fonksiyonu çağırmasını engelle
REVOKE EXECUTE ON FUNCTION public.grant_admin_role(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_admin_role(TEXT) TO service_role, postgres;

-- =========================================================
-- ROW LEVEL SECURITY (RLS) POLİTİKALARI
-- =========================================================

-- 1. user_roles
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

-- 2. partners
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Partners view own profile or admin views all or invite token lookup" ON public.partners;
DROP POLICY IF EXISTS "Partners view own profile or admin views all" ON public.partners;
CREATE POLICY "Partners view own profile or admin views all"
ON public.partners FOR SELECT
USING (
  auth_user_id = auth.uid()
  OR public.is_admin()
);

DROP POLICY IF EXISTS "Only admins can insert partners" ON public.partners;
CREATE POLICY "Only admins can insert partners"
ON public.partners FOR INSERT
WITH CHECK (public.is_admin());

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

DROP POLICY IF EXISTS "Only admins can delete partners" ON public.partners;
CREATE POLICY "Only admins can delete partners"
ON public.partners FOR DELETE
USING (public.is_admin());

-- 3. partner_status
ALTER TABLE public.partner_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Partners view own status or admin views all" ON public.partner_status;
CREATE POLICY "Partners view own status or admin views all"
ON public.partner_status FOR SELECT
USING (
  public.is_admin()
  OR partner_id IN (SELECT id FROM public.partners WHERE auth_user_id = auth.uid())
);

DROP POLICY IF EXISTS "Only admins can modify partner status" ON public.partner_status;
CREATE POLICY "Only admins can modify partner status"
ON public.partner_status FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 4. partner_status_history
ALTER TABLE public.partner_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Partners view own status history or admin views all" ON public.partner_status_history;
CREATE POLICY "Partners view own status history or admin views all"
ON public.partner_status_history FOR SELECT
USING (
  public.is_admin()
  OR partner_id IN (SELECT id FROM public.partners WHERE auth_user_id = auth.uid())
);

DROP POLICY IF EXISTS "Only admins can modify partner status history" ON public.partner_status_history;
CREATE POLICY "Only admins can modify partner status history"
ON public.partner_status_history FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 5. announcements
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View published announcements or admin views all" ON public.announcements;
CREATE POLICY "View published announcements or admin views all"
ON public.announcements FOR SELECT
USING (
  public.is_admin()
  OR (
    publication_status = 'Yayında'
    AND (
      target_audience = 'all'
      OR EXISTS (
        SELECT 1 FROM public.partners
        WHERE auth_user_id = auth.uid()
          AND id::text = ANY(target_partner_ids)
      )
    )
  )
);

DROP POLICY IF EXISTS "Only admins can modify announcements" ON public.announcements;
CREATE POLICY "Only admins can modify announcements"
ON public.announcements FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 6. announcement_reads
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Partners view own reads or admin views all" ON public.announcement_reads;
CREATE POLICY "Partners view own reads or admin views all"
ON public.announcement_reads FOR SELECT
USING (
  public.is_admin()
  OR partner_id IN (SELECT id FROM public.partners WHERE auth_user_id = auth.uid())
);

DROP POLICY IF EXISTS "Partners mark own reads or admin modifies" ON public.announcement_reads;
CREATE POLICY "Partners mark own reads or admin modifies"
ON public.announcement_reads FOR ALL
USING (
  public.is_admin()
  OR partner_id IN (SELECT id FROM public.partners WHERE auth_user_id = auth.uid())
)
WITH CHECK (
  public.is_admin()
  OR partner_id IN (SELECT id FROM public.partners WHERE auth_user_id = auth.uid())
);

-- 7. support_tickets
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Partners view own tickets or admin views all" ON public.support_tickets;
CREATE POLICY "Partners view own tickets or admin views all"
ON public.support_tickets FOR SELECT
USING (
  public.is_admin()
  OR partner_id IN (SELECT id FROM public.partners WHERE auth_user_id = auth.uid())
);

DROP POLICY IF EXISTS "Partners create ticket for self or admin creates" ON public.support_tickets;
CREATE POLICY "Partners create ticket for self or admin creates"
ON public.support_tickets FOR INSERT
WITH CHECK (
  public.is_admin()
  OR partner_id IN (SELECT id FROM public.partners WHERE auth_user_id = auth.uid())
);

DROP POLICY IF EXISTS "Admins or partner update ticket" ON public.support_tickets;
CREATE POLICY "Admins or partner update ticket"
ON public.support_tickets FOR UPDATE
USING (
  public.is_admin()
  OR partner_id IN (SELECT id FROM public.partners WHERE auth_user_id = auth.uid())
)
WITH CHECK (
  public.is_admin()
  OR partner_id IN (SELECT id FROM public.partners WHERE auth_user_id = auth.uid())
);

-- 8. support_messages
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Partners view messages for own ticket or admin views all" ON public.support_messages;
CREATE POLICY "Partners view messages for own ticket or admin views all"
ON public.support_messages FOR SELECT
USING (
  public.is_admin()
  OR ticket_id IN (
    SELECT id FROM public.support_tickets
    WHERE partner_id IN (SELECT id FROM public.partners WHERE auth_user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Partners or admin insert messages for valid tickets" ON public.support_messages;
CREATE POLICY "Partners or admin insert messages for valid tickets"
ON public.support_messages FOR INSERT
WITH CHECK (
  public.is_admin()
  OR (
    sender_user_id = auth.uid()
    AND ticket_id IN (
      SELECT id FROM public.support_tickets
      WHERE partner_id IN (SELECT id FROM public.partners WHERE auth_user_id = auth.uid())
    )
  )
);

-- 9. support_internal_notes (Yalnızca Admin)
ALTER TABLE public.support_internal_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only admins can access internal notes" ON public.support_internal_notes;
CREATE POLICY "Only admins can access internal notes"
ON public.support_internal_notes FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 10. app_settings
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can read app settings" ON public.app_settings;
CREATE POLICY "Anyone authenticated can read app settings"
ON public.app_settings FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Only admins can modify app settings" ON public.app_settings;
CREATE POLICY "Only admins can modify app settings"
ON public.app_settings FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 11. audit_logs (Yalnızca Admin Okuyabilir)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Only admins can view audit logs"
ON public.audit_logs FOR SELECT
USING (public.is_admin());

DROP POLICY IF EXISTS "Authenticated users or admin can write audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users or admin can write audit logs"
ON public.audit_logs FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
