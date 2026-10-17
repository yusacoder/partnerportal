-- =========================================================
-- Eternal Production Partner Portal - Admin Hesabı Tanımlama Komutu
-- =========================================================
-- Kullanımı:
-- 1. Supabase Dashboard -> SQL Editor alanına gidin.
-- 2. Aşağıdaki e-posta adresini kendi admin hesabınızın e-postası ile değiştirin:
--    Örnek: SELECT public.grant_admin_role('admin@eternalproduction.com');
-- =========================================================

-- Admin yetkisi vermek istediğiniz e-posta adresini aşağıya yazın:
SELECT public.grant_admin_role('BURAYA_ADMIN_EPOSTA_ADRESINIZI_YAZIN');
