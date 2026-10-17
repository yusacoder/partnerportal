-- =========================================================
-- Eternal Production Partner Portal - Admin Hesabı Tanımlama Komutu
-- =========================================================
-- Bu SQL dosyası, grant_admin_role fonksiyonunu oluşturur/günceller ve
-- belirtilen e-posta adresine güvenli bir şekilde admin yetkisi verir.
--
-- Kullanımı:
-- 1. Supabase Dashboard -> SQL Editor alanına gidin.
-- 2. Bu dosyadaki SQL kodunu yapıştırıp çalıştırın (Run).
-- 3. En alttaki e-posta adresini yetkilendirmek istediğiniz hesaba göre güncelleyebilirsiniz.
--    Örnek: SELECT public.grant_admin_role('destek@eternalproduction.net');
-- =========================================================

-- 1. Güvenli Admin Yetkisi Verme Fonksiyonunun Tanımlanması
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

-- 2. İstemci Rollerinden Çağrılmayı Engelle (Yetkisiz Kullanımı Önler)
REVOKE EXECUTE ON FUNCTION public.grant_admin_role(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_admin_role(TEXT) TO service_role, postgres;

-- 3. Admin yetkisi verilecek hesabı çalıştırın:
-- Admin yetkisi vermek istediğiniz e-posta adresini aşağıya yazın:
SELECT public.grant_admin_role('destek@eternalproduction.net');
