# Eternal Production - Partner Portal & Yönetim Paneli

Bu proje, Eternal Production partnerleri ve yöneticileri (admin) için geliştirilmiş modern, yüksek performanslı, güvenli ve ölçeklenebilir bir web portalıdır.

**Canlı Adres:** [https://partner.eternalproduction.net/](https://partner.eternalproduction.net/)
**Yönetici Paneli:** [https://partner.eternalproduction.net/admin](https://partner.eternalproduction.net/admin)

---

## 📋 İçindekiler
1. [Projenin Amacı ve Özellikleri](#1-projenin-amacı-ve-özellikleri)
2. [Kullanılan Teknolojiler](#2-kullanılan-teknolojiler)
3. [Gereksinimler](#3-gereksinimler)
4. [Yerel Kurulum](#4-yerel-kurulum)
5. [Bağımlılıkların Kurulması](#5-bağımlılıkların-kurulması)
6. [.env Dosyasının Oluşturulması](#6-env-dosyasının-oluşturulması)
7. [Gerekli Ortam Değişkenleri ve Açıklamaları](#7-gerekli-ortam-değişkenleri-ve-açıklamaları)
8. [Supabase Projesinin Hazırlanması](#8-supabase-projesinin-hazırlanması)
9. [Veritabanı Tabloları ve Migration Sırası](#9-veritabanı-tabloları-ve-migration-sırası)
10. [Uygulanması Gereken SQL Migration Dosyası ve İçeriği](#10-uygulanması-gereken-sql-migration-dosyası-ve-i̇çeriği)
11. [Supabase Edge Function Mimarisi ve Dağıtım Adımları](#11-supabase-edge-function-mimarisi-ve-dağıtım-adımları)
12. [RLS Politikalarının Kurulması ve Doğrulanması](#12-rls-politikalarının-kurulması-ve-doğrulanması)
13. [İlk Admin Hesabının Güvenli Biçimde Hazırlanması](#13-i̇lk-admin-hesabının-güvenli-biçimde-hazırlanması)
14. [Admin Rolünün Nasıl Kontrol Edileceği](#14-admin-rolünün-nasıl-kontrol-edileceği)
15. [Partner Hesaplarının Oluşturulması ve Doğrudan Giriş Akışı](#15-partner-hesaplarının-oluşturulması-ve-doğrudan-giriş-akışı)
16. [Yerel Geliştirme Sunucusunu Çalıştırma](#16-yerel-geliştirme-sunucusunu-çalıştırma)
17. [Test, Lint, TypeScript Kontrolü ve Build Komutları](#17-test-lint-typescript-kontrolü-ve-build-komutları)
18. [Vercel'e Dağıtım](#18-vercel-e-dağıtım)
19. [Supabase Auth Yönlendirme Ayarları](#19-supabase-auth-yönlendirme-ayarları)
20. [Yaygın Hatalar ve Çözümleri](#20-yaygın-hatalar-ve-çözümleri)
21. [Güvenlik Uyarıları ve Sırların Korunması](#21-güvenlik-uyarıları-ve-sırların-korunması)
22. [Yeni Geliştiriciler İçin Proje Klasör Yapısı](#22-yeni-geliştiriciler-i̇çin-proje-klasör-yapısı)
23. [Migration Geri Alma ve Yedekleme Prosedürü](#23-migration-geri-alma-ve-yedekleme-prosedürü)
24. [Bilinen Sınırlamalar ve Henüz Doğrulanamayan Noktalar](#24-bilinen-sınırlamalar-ve-henüz-doğrulanamayan-noktalar)
25. [Sürüm Notları ve Yapılan Değişiklikler](#25-sürüm-notları-ve-yapılan-değişiklikler)

---

## 1. Projenin Amacı ve Özellikleri

**Eternal Production Partner Portal**, ajans ile iş ortakları (partnerler) arasındaki iletişimi, destek süreçlerini, duyuruları ve partner durum takibini uçtan uca dijitalleştiren çift katmanlı bir platformdur.

### Temel Özellikler:
- **İki Farklı Erişim Rolü:** Partner ve Yönetici (Admin) panelleri.
- **Admin Yönetim Paneli:**
  - Tüm partner hesaplarının listelenmesi, filtrelenmesi, aktifleştirilmesi/durdurulması.
  - Doğrudan kullanıcı adı, başlangıç şifresi ve hesap durumu (aktif/pasif) belirleyerek partner kullanıcısı oluşturma.
  - Partner hesap statülerini (Normal, Şüpheli, Riskli, Askıda) değiştirme ve açıklama ekleme.
  - Bireysel veya toplu duyurular yayınlama.
  - Destek taleplerini yanıtlama ve partnerlerin göremediği **iç notlar (internal notes)** ekleme.
  - Sistem erişim ve işlem denetim kayıtlarını (`audit_logs`) görüntüleme.
- **Partner Paneli:**
  - Ajans değerlendirme durumunu ve durum geçmişini inceleme.
  - Kendisine yayınlanan duyuruları okuma ve okundu olarak işaretleme.
  - Yeni destek talebi oluşturma, ajans ile mesajlaşma ve bilet durumunu takip etme.
  - Ajans resmi iletişim ve sosyal medya kanallarına erişme.

---

## 2. Kullanılan Teknolojiler

- **Frontend:** React 19, TypeScript 5.7, Vite 6.2, React Router 7.3, Tailwind CSS 4.0, Lucide React (İkon seti).
- **Backend / Database:** Supabase (PostgreSQL, Row Level Security, Auth, RPC Functions, Edge Functions).
- **Test ve Doğrulama:** Vitest 3.0, Testing Library, TypeScript (`tsc --noEmit`), Zod.
- **Deployment:** Vercel (SPA rewrites ile `vercel.json` yapılandırması).

---

## 3. Gereksinimler

- **Node.js**: `v18.0.0` veya üzeri
- **npm**: `v9.0.0` veya üzeri
- **Supabase Hesabı**: Veritabanı, Edge Functions ve Auth projesi.

---

## 4. Yerel Kurulum

1. Repoyu bilgisayarınıza klonlayın:
   ```bash
   git clone https://github.com/yusacoder/partnerportal.git
   ```
2. Proje dizinine gidin:
   ```bash
   cd partnerportal
   ```

---

## 5. Bağımlılıkların Kurulması

Temiz bir bağımlılık kurulumu yapmak için şu komutu çalıştırın:
```bash
npm ci
```
veya alternatif olarak:
```bash
npm install
```

---

## 6. `.env` Dosyasının Oluşturulması

Kök dizinde `.env` isimli dosya oluşturun:
```bash
cp .env.example .env
```

---

## 7. Gerekli Ortam Değişkenleri ve Açıklamaları

`.env` dosyasında aşağıdaki iki değişken tanımlanmalıdır:

```env
# Supabase Proje URL Adresi
VITE_SUPABASE_URL=https://<sizin-proje-id>.supabase.co

# Supabase Anonim / Publishable API Anahtarı (İstemci için güvenlidir)
VITE_SUPABASE_ANON_KEY=sb_publishable_anon_key
```

> ⚠️ **KRİTİK GÜVENLİK UYARISI:** Supabase `service_role` veya veritabanı gizli şifresini **asla** `.env` dosyasına veya istemciye (frontend) gidecek kodlara koymayın.

---

## 8. Supabase Projesinin Hazırlanması

1. [Supabase Dashboard](https://supabase.com/dashboard) adresinden projenizi açın.
2. Left Sidebar -> **SQL Editor** alanına gidin.
3. Repodaki `supabase/schema.sql` içeriğini yapıştırıp çalıştırın (**Run**).

---

## 9. Veritabanı Tabloları ve Migration Sırası

Veritabanında oluşturulan tablolar ve sıralama:

1. `public.user_roles`: Kullanıcı yetkilerini tutar (`admin` / `partner`).
2. `public.partners`: Partner bilgilerini ve davet tokenlarını tutar.
3. `public.partner_status`: Partner güncel durumunu saklar.
4. `public.partner_status_history`: Durum değişiklik geçmişi.
5. `public.announcements`: Genel ve özel duyurular.
6. `public.announcement_reads`: Duyuru okundu bilgileri.
7. `public.support_tickets`: Destek talepleri.
8. `public.support_messages`: Destek bileti mesajlaşmaları.
9. `public.support_internal_notes`: Yalnızca adminlerin görebildiği iç notlar.
10. `public.app_settings`: Sistem ve iletişim ayarları.
11. `public.audit_logs`: Yöneticilerin denetim kayıtları.

Migration sırası:
1. `supabase/migrations/20250222000000_fix_admin_login_and_roles.sql`
2. `supabase/migrations/20250223000000_fix_shadow_email_domain.sql`
3. `supabase/migrations/20250224000000_admin_direct_user_creation.sql`

---

## 10. Uygulanması Gereken SQL Migration Dosyası ve İçeriği

**Tam Migration Dosya Yolu:** `supabase/migrations/20250224000000_admin_direct_user_creation.sql`

Bu migration dosyasını Supabase Dashboard -> **SQL Editor** ekranına yapıştırıp çalıştırın (**Run**):

```sql
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
REVOKE EXECUTE ON FUNCTION public.admin_create_partner_user(TEXT, TEXT, TEXT, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_create_partner_user(TEXT, TEXT, TEXT, BOOLEAN) TO authenticated, service_role;
```

> 💡 **Önemli Not:** Migration çalıştırıldıktan sonra PostgREST şema önbelleğini yenilemek için SQL Editor'de şu bildirimi çalıştırın:
```sql
NOTIFY pgrst, 'reload schema';
```

---

## 11. Supabase Edge Function Mimarisi ve Dağıtım Adımları

Projede alternatif/tamamlayıcı sunucu taraflı yetkilendirme olarak Supabase Edge Function mimarisi hazırlanmıştır.

**Edge Function Dosya Konumu:** `supabase/functions/admin-create-partner/index.ts`

### Edge Function Özellikleri:
- İstemciden (frontend) gelen HTTP POST isteğinde `Authorization: Bearer <token>` JWT başlığını doğrular.
- Sunucu tarafında `public.is_admin()` veya `user_roles` tablosundan isteği atan kullanıcının Admin yetkisi olup olmadığını kontrol eder.
- `service_role` anahtarını strictly sunucu ortamında saklar, asla istemci tarafına (frontend) sızdırmaz.
- Parolayı düz metin olarak veritabanında saklamaz; Supabase Auth GoTrue API üzerinden güvenli biçimde hash'ler.

### Edge Function Supabase CLI Dağıtım Adımları:

1. Supabase CLI ile giriş yapın:
   ```bash
   npx supabase login
   ```
2. Projenizi bağlayın:
   ```bash
   npx supabase link --project-ref <sizin-proje-id>
   ```
3. Gizli `service_role` anahtarını Edge Function ortamına tanımlayın:
   ```bash
   npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
4. Edge Function'ı canlı ortama dağıtın:
   ```bash
   npx supabase functions deploy admin-create-partner
   ```

---

## 12. RLS Politikalarının Kurulması ve Doğrulanması

Her tablo için Row Level Security (RLS) etkinleştirilmiştir:
- `user_roles`: Kullanıcılar kendi rollerini okuyabilir; yalnızca admin değiştirebilir.
- `partners`: Partnerler yalnızca kendi profillerini görebilir ve güncelleyebilir; adminler tümünü yönetir.
- `support_internal_notes`: Yalnızca `public.is_admin()` olan kullanıcılar okuyabilir ve yazabilir.
- `audit_logs`: Yalnızca admin okuyabilir.

RLS politikalarını Supabase Dashboard -> **Authentication -> Policies** sekmesinden doğrulayabilirsiniz.

---

## 13. İlk Admin Hesabının Güvenli Biçimde Hazırlanması

Admin rolü vermek için `supabase/grant_admin.sql` dosyasını kullanın.

1. Supabase Auth üzerinde admin kullanıcınızı (`destek@eternalproduction.net`) oluşturun.
2. SQL Editor'de `supabase/grant_admin.sql` dosyasını yapıştırıp çalıştırın:
   ```sql
   SELECT public.grant_admin_role('destek@eternalproduction.net');
   ```

Bu işlem:
- `auth.users.raw_app_meta_data` içine `{"role": "admin"}` ekler.
- `public.user_roles` tablosuna `admin` rolü yazar.
- Fonksiyon yetkisiz istemci (RPC) erişimine kapatılmıştır (`REVOKE EXECUTE ... FROM PUBLIC`).

---

## 14. Admin Rolünün Nasıl Kontrol Edileceği

Sistemde admin yetkisi iki aşamalı doğrulanır:
1. `auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'`
2. `public.user_roles` tablosunda `user_id = auth.uid()` ve `role = 'admin'`

Frontend tarafında `AuthContext.tsx` her iki kaynağı da denetleyerek güvenli rol atamasını gerçekleştirir. İstemcinin değiştirebildiği `user_metadata` kesinlikle dikkate alınmaz.

---

## 15. Partner Hesaplarının Oluşturulması ve Doğrudan Giriş Akışı

1. Admin `/admin/partners` sayfasına gider.
2. **"Yeni Partner Oluştur"** butonuna tıklar.
3. Kullanıcı adı, firma/görünen ad, başlangıç şifresi (en az 6 karakter) ve hesap durumunu (aktif/pasif) belirler.
4. Sunucu tarafındaki `admin_create_partner_user` RPC fonksiyonu çağrılarak:
   - Başlangıç şifresi `crypt(p_password, gen_salt('bf'))` ile `auth.users` tablosunda güvenli biçimde hash'lenir.
   - Parolalar hiçbir zaman düz metin olarak saklanmaz veya loglanmaz.
   - `auth.identities`, `user_roles` (`partner`), `partners` ve `partner_status` kayıtları oluşturulur.
5. İşlem tamamlandığında admin için tek kullanımlık özet ve **"Giriş Bilgilerini Kopyala"** seçeneği sunulur.
6. Partner, kendisine iletilen kullanıcı adı ve şifre ile `/partner/login` adresinden doğrudan giriş yapar.

---

## 16. Yerel Geliştirme Sunucusunu Çalıştırma

```bash
npm run dev
```
Uygulama `http://localhost:5173` adresinde çalışacaktır.

---

## 17. Test, Lint, TypeScript Kontrolü ve Build Komutları

- **TypeScript Kontrolü (Lint):**
  ```bash
  npm run lint
  ```
- **Birim ve Entegrasyon Testleri:**
  ```bash
  npm test
  ```
- **Üretim Derlemesi (Build):**
  ```bash
  npm run build
  ```

---

## 18. Vercel'e Dağıtım

1. GitHub deponuzu Vercel projenize bağlayın.
2. **Environment Variables** bölümünde tanımlayın:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. `vercel.json` SPA yönlendirmeleri projede yapılandırılmıştır.

---

## 19. Supabase Auth Yönlendirme Ayarları

Supabase Dashboard -> **Authentication -> URL Configuration** sayfasında:
- **Site URL:** `https://partner.eternalproduction.net`
- **Redirect URLs:** `https://partner.eternalproduction.net/**`, `http://localhost:5173/**`

---

## 20. Yaygın Hatalar ve Çözümleri

### 🔴 Şema Önbelleğinde `admin_create_partner_user` Fonksiyonu Bulunamadı Hatası:
- **Sorun:** Partner oluştururken `Şema önbelleğinde public.admin_create_partner_user(...) fonksiyonu bulunamadı` veya PostgREST `PGRST202` hatası alınıyor.
- **Kök Neden:**
  1. `20250224000000_admin_direct_user_creation.sql` migration dosyası canlı Supabase veritabanında henüz uygulanmamıştır.
  2. Veya migration uygulandığı halde PostgREST API katmanı şema önbelleğini (schema cache) henüz güncellememiştir.
- **Çözüm:**
  1. Supabase Dashboard -> **SQL Editor** alanına gidin.
  2. `supabase/migrations/20250224000000_admin_direct_user_creation.sql` içeriğini yapıştırıp **Run** butonuna basarak çalıştırın.
  3. Şema önbelleğini derhal yenilemek için SQL Editor'de şu bildirimi çalıştırın:
     ```sql
     NOTIFY pgrst, 'reload schema';
     ```
  4. Veya Supabase Dashboard -> **Project Settings -> API** sayfasından **"Reload Schema Cache"** butonuna tıklayın.

### 🔴 Admin Giriş Sorunu ve Kök Nedeni:
- **Sorun:** Admin hesabı (`destek@eternalproduction.net`) ile giriş yapılmak istendiğinde "Giriş bilgileri hatalı veya hesap bulunamadı." hatası alınıyordu.
- **Kök Neden:** `public.partners` tablosunun boş olması nedeniyle, eğer kullanıcı ad olarak yalnızca e-posta ön ekini (`destek`) yazarsa, eski sistem partner tablosunda arama yapıyor ve bulamayınca varsayılan sanal e-postaya yönlendiriyordu. Ayrıca `grant_admin.sql` dosyasında kalmış olan git birleştirme işaretleri yüzünden fonksiyon çalıştırılamıyordu.
- **Çözüm:**
  1. `get_partner_auth_email_by_username` RPC fonksiyonu güncellenerek partner tablosunda bulunamayan durumlarda doğrudan `auth.users` üzerindeki admin hesaplarını eşleştirecek şekilde genişletildi.
  2. Admin kullanıcı adı veya e-postası doğrudan Supabase Auth ile doğrulandığından adminler için `partners` tablosunda kayıt oluşturma zorunluluğu kaldırıldı.
  3. `grant_admin.sql` temizlendi.

### 🔴 Partner Davet Kabulü Sanal E-posta Geçersizlik Hatası:
- **Sorun:** Partner daveti kabul edilirken `Email address "yusha@partner.eternal.internal" is invalid` hatası alınıyordu.
- **Kök Neden:** Supabase Auth (GoTrue) e-posta doğrulama kuralları geçersiz TLD uzantılarını (`.internal`) reddetmektedir.
- **Çözüm:**
  1. Shadow e-posta alan adı `@partner.eternalproduction.net` olarak güncellendi.
  2. Kullanıcı adı + şifre ile giriş yapısı korundu; partnerlerden gerçek e-posta istenmesi zorunluluğu getirilmedi.
  3. `20250223000000_fix_shadow_email_domain.sql` migration dosyası eklendi.

---

## 21. Güvenlik Uyarıları ve Sırların Korunması

- Git deponuza asla gizli API anahtarları eklemeyin.
- Supabase `service_role` anahtarını sadece sunucu taraflı güvenli scriptlerde veya Edge Function ortam değişkenlerinde kullanın.
- İstemci kodunda hassas verileri veya yetkisiz kullanıcı bilgilerini loglamayın.

---

## 22. Yeni Geliştiriciler İçin Proje Klasör Yapısı

```
.
├── src/
│   ├── components/      # Ortak UI bileşenleri (AdminLayout, PartnerLayout, StatusBadge vb.)
│   ├── context/         # AuthContext ve global durum yönetimi
│   ├── lib/             # Supabase istemci başlatıcı (supabase.ts)
│   ├── pages/           # Admin ve Partner sayfa bileşenleri
│   ├── services/        # API çağrıları (api.ts)
│   ├── test/            # Vitest birim ve entegrasyon testleri
│   ├── types/           # TypeScript arayüz ve tip tanımları
│   ├── App.tsx          # Rota ve korumalı yönlendirme katmanı
│   └── main.tsx         # React giriş noktası
├── supabase/
│   ├── functions/       # Supabase Edge Functions (admin-create-partner)
│   ├── migrations/      # Sıralı veritabanı migration dosyaları
│   ├── grant_admin.sql  # Güvenli admin yetkilendirme SQL komutu
│   └── schema.sql       # Ana veritabanı şeması ve RLS politikaları
├── package.json
├── tsconfig.json
├── vercel.json
└── vite.config.ts
```

---

## 23. Migration Geri Alma ve Yedekleme Prosedürü

- Supabase Dashboard -> **Database -> Backups** alanından günlük veritabanı yedeklerini indirebilirsiniz.
- Bir migration işlemini geri almak gerektiğinde, ilgili migration SQL dosyasında tanımlanan politikaları `DROP POLICY ... ON ...` ve fonksiyonları `DROP FUNCTION ...` şeklinde ters sıralamayla çalıştırabilirsiniz.

---

## 24. Bilinen Sınırlamalar ve Henüz Doğrulanamayan Noktalar

- Canlı Supabase veritabanına erişim yetkisi olmadan yerel ortamda ortam değişkenleri tanımlanmadığı sürece Supabase Auth işlemleri sahte modda test edilir.
- Canlı ortama SQL migration uygulanması Supabase Dashboard üzerinden yetkili veritabanı yöneticisi tarafından gerçekleştirilmelidir.

---

## 25. Sürüm Notları ve Yapılan Değişiklikler

### v2.0.0 (Son Güncelleme - Doğrudan Kullanıcı Oluşturma & Edge Function Mimarisi)
- Davet bağlantısı ve davet tokenı kabul etme akışı tamamen kaldırıldı.
- Partner kullanıcılarının yalnızca admin panelinden doğrudan oluşturulması sağlandı.
- Admin, yeni partner oluştururken kullanıcı adı, firma adı, başlangıç şifresi ve hesap durumunu (aktif/pasif) belirleyebilir.
- Şifreler sunucu tarafında (`admin_create_partner_user` RPC veya Edge Function) `crypt/bcrypt` ile hash'lenerek `auth.users` tablosunda saklanır; düz metin olarak veritabanında saklanmaz veya loglanmaz.
- E-posta girmek zorunlu değildir; gölge auth e-postaları sunucu tarafında oluşturulur.
- Supabase Edge Function (`supabase/functions/admin-create-partner/index.ts`) eklendi ve belgelendi.
- Pasif veya askıya alınmış hesapların girişi hem veritabanı RPC seviyesinde hem de AuthContext oturum kontrolünde engellenmiştir.
- `20250224000000_admin_direct_user_creation.sql` migration dosyası güncellendi ve README.md'ye tam içeriği eklendi.
- Vitest test kapsamı genişletilerek tüm testlerin (`npm test`) ve üretim derlemesinin (`npm run build`) başarıyla geçtiği doğrulandı.

### v1.0.1
- `grant_admin.sql` dosyasındaki git birleştirme işaretleri temizlendi.
- Admin giriş akışı tamamen düzeltildi; `public.partners` kaydı olmadan sorunsuz giriş sağlandı.
- `get_partner_auth_email_by_username`, `get_partner_by_invite_token` ve `claim_partner_invite` RPC fonksiyonları eklendi.
- `partners` RLS politikalarındaki güvenlik açıkları giderildi.
- Vite paket boyutları `manualChunks` ile optimize edildi.
- Vitest test kapsamı genişletilerek 19 birim/entegrasyon testi eklendi ve tamamı doğrulandı.
