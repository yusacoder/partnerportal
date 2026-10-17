-- =========================================================
-- Eternal Production Partner Portal - Admin Hesabı Tanımlama Komutu
-- =========================================================
-- Bu SQL dosyası, grant_admin_role ve get_partner_auth_email_by_username
-- fonksiyonlarını oluşturur/günceller ve belirtilen e-posta adresine
-- güvenli bir şekilde admin yetkisi verir.
--
-- Kullanımı:
-- 1. Supabase Dashboard -> SQL Editor alanına gidin.
-- 2. Bu dosyadaki SQL kodunu yapıştırıp çalıştırın (Run).
-- 3. En alttaki e-posta adresini yetkilendirmek istediğiniz hesaba göre güncelleyebilirsiniz.
--    Örnek: SELECT public.grant_admin_role('destek@eternalproduction.net');
-- =========================================================

-- 1. Partner Kullanıcı Adından veya E-postadan Auth Hesabı Sorgulama Fonksiyonu
CREATE OR REPLACE FUNCTION public.get_partner_auth_email_by_username(p_username TEXT)
RETURNS TABLE (email TEXT, is_active BOOLEAN) AS $$
BEGIN
  -- 1. Partnerler tablosunda kullanıcı adına göre ara
  RETURN QUERY
  SELECT
    au.email::text,
    p.is_active
  FROM public.partners p
  JOIN auth.users au ON au.id = p.auth_user_id
  WHERE LOWER(p.username) = LOWER(TRIM(p_username))
  LIMIT 1;

  IF FOUND THEN
    RETURN;
  END IF;

  -- 2. Eğer p_username bir e-posta adresi ise ('@' içeriyorsa), auth.users tablosundan doğrudan kontrol et
  IF POSITION('@' IN p_username) > 0 THEN
    RETURN QUERY
    SELECT
      au.email::text,
      true AS is_active
    FROM auth.users au
    WHERE LOWER(au.email) = LOWER(TRIM(p_username))
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- 2. Güvenli Admin Yetkisi Verme Fonksiyonunun Tanımlanması
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

-- 3. İstemci Rollerinden Çağrılmayı Engelle (Yetkisiz Kullanımı Önler)
REVOKE EXECUTE ON FUNCTION public.grant_admin_role(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_admin_role(TEXT) TO service_role, postgres;

-- 4. Admin yetkisi verilecek hesabı çalıştırın:
SELECT public.grant_admin_role('destek@eternalproduction.net');
