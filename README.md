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
10. [RLS Politikalarının Kurulması ve Doğrulanması](#10-rls-politikalarının-kurulması-ve-doğrulanması)
11. [İlk Admin Hesabının Güvenli Biçimde Hazırlanması](#11-i̇lk-admin-hesabının-güvenli-biçimde-hazırlanması)
12. [Admin Rolünün Nasıl Kontrol Edileceği](#12-admin-rolünün-nasıl-kontrol-edileceği)
13. [Partner Hesaplarının Oluşturulması ve Davet Akışı](#13-partner-hesaplarının-oluşturulması-ve-davet-akışı)
14. [Yerel Geliştirme Sunucusunu Çalıştırma](#14-yerel-geliştirme-sunucusunu-çalıştırma)
15. [Test, Lint, TypeScript Kontrolü ve Build Komutları](#15-test-lint-typescript-kontrolü-ve-build-komutları)
16. [Vercel'e Dağıtım](#16-vercel-e-dağıtım)
17. [Supabase Auth Yönlendirme Ayarları](#17-supabase-auth-yönlendirme-ayarları)
18. [Yaygın Hatalar ve Çözümleri](#18-yaygın-hatalar-ve-çözümleri)
19. [Güvenlik Uyarıları ve Sırların Korunması](#19-güvenlik-uyarıları-ve-sırların-korunması)
20. [Yeni Geliştiriciler İçin Proje Klasör Yapısı](#20-yeni-geliştiriciler-için-proje-klasör-yapısı)
21. [Migration Geri Alma ve Yedekleme Prosedürü](#21-migration-geri-alma-ve-yedekleme-prosedürü)
22. [Bilinen Sınırlamalar ve Henüz Doğrulanamayan Noktalar](#22-bilinen-sınırlamalar-ve-henüz-doğrulanamayan-noktalar)
23. [Sürüm Notları ve Yapılan Değişiklikler](#23-sürüm-notları-ve-yapılan-değişiklikler)

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
- **Backend / Database:** Supabase (PostgreSQL, Row Level Security, Auth, RPC Functions).
- **Test ve Doğrulama:** Vitest 3.0, Testing Library, TypeScript (`tsc --noEmit`), Zod.
- **Deployment:** Vercel (SPA rewrites ile `vercel.json` yapılandırması).

---

## 3. Gereksinimler

- **Node.js**: `v18.0.0` veya üzeri
- **npm**: `v9.0.0` veya üzeri
- **Supabase Hesabı**: Veritabanı ve Kimlik Doğrulama (Auth) projesi.

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

> 💡 **Önemli Not:** Yeni bir migration uygulandıktan sonra PostgREST API şema önbelleğini yenilemek için SQL Editor'de `NOTIFY pgrst, 'reload schema';` komutunu çalıştırın.

---

## 10. RLS Politikalarının Kurulması ve Doğrulanması

Her tablo için Row Level Security (RLS) etkinleştirilmiştir:
- `user_roles`: Kullanıcılar kendi rollerini okuyabilir; yalnızca admin değiştirebilir.
- `partners`: Partnerler yalnızca kendi profillerini görebilir ve güncelleyebilir; adminler tümünü yönetir.
- `support_internal_notes`: Yalnızca `public.is_admin()` olan kullanıcılar okuyabilir ve yazabilir.
- `audit_logs`: Yalnızca admin okuyabilir.

RLS politikalarını Supabase Dashboard -> **Authentication -> Policies** sekmesinden doğrulayabilirsiniz.

---

## 11. İlk Admin Hesabının Güvenli Biçimde Hazırlanması

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

## 12. Admin Rolünün Nasıl Kontrol Edileceği

Sistemde admin yetkisi iki aşamalı doğrulanır:
1. `auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'`
2. `public.user_roles` tablosunda `user_id = auth.uid()` ve `role = 'admin'`

Frontend tarafında `AuthContext.tsx` her iki kaynağı da denetleyerek güvenli rol atamasını gerçekleştirir. İstemcinin değiştirebildiği `user_metadata` kesinlikle dikkate alınmaz.

---

## 13. Partner Hesaplarının Oluşturulması ve Doğrudan Giriş Akışı

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

## 14. Yerel Geliştirme Sunucusunu Çalıştırma

```bash
npm run dev
```
Uygulama `http://localhost:5173` adresinde çalışacaktır.

---

## 15. Test, Lint, TypeScript Kontrolü ve Build Komutları

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

## 16. Vercel'e Dağıtım

1. GitHub deponuzu Vercel projenize bağlayın.
2. **Environment Variables** bölümünde tanımlayın:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. `vercel.json` SPA yönlendirmeleri projede yapılandırılmıştır.

---

## 17. Supabase Auth Yönlendirme Ayarları

Supabase Dashboard -> **Authentication -> URL Configuration** sayfasında:
- **Site URL:** `https://partner.eternalproduction.net`
- **Redirect URLs:** `https://partner.eternalproduction.net/**`, `http://localhost:5173/**`

---

## 18. Yaygın Hatalar ve Çözümleri

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

## 19. Güvenlik Uyarıları ve Sırların Korunması

- Git deponuza asla gizli API anahtarları eklemeyin.
- Supabase `service_role` anahtarını sadece sunucu taraflı güvenli scriptlerde kullanın.
- İstemci kodunda hassas verileri veya yetkisiz kullanıcı bilgilerini loglamayın.

---

## 20. Yeni Geliştiriciler İçin Proje Klasör Yapısı

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
│   ├── migrations/      # Sıralı veritabanı migration dosyaları
│   ├── grant_admin.sql  # Güvenli admin yetkilendirme SQL komutu
│   └── schema.sql       # Ana veritabanı şeması ve RLS politikaları
├── package.json
├── tsconfig.json
├── vercel.json
└── vite.config.ts
```

---

## 21. Migration Geri Alma ve Yedekleme Prosedürü

- Supabase Dashboard -> **Database -> Backups** alanından günlük veritabanı yedeklerini indirebilirsiniz.
- Bir migration işlemini geri almak gerektiğinde, ilgili migration SQL dosyasında tanımlanan politikaları `DROP POLICY ... ON ...` ve fonksiyonları `DROP FUNCTION ...` şeklinde ters sıralamayla çalığtırabilirsiniz.

---

## 22. Bilinen Sınırlamalar ve Henüz Doğrulanamayan Noktalar

- Canlı Supabase veritabanına erişim yetkisi olmadan yerel ortamda ortam değişkenleri tanımlanmadığı sürece Supabase Auth işlemleri sahte modda test edilir.
- Canlı ortama SQL migration uygulanması Supabase Dashboard üzerinden yetkili veritabanı yöneticisi tarafından gerçekleştirilmelidir.

---

## 23. Sürüm Notları ve Yapılan Değişiklikler

### v2.0.0 (Son Güncelleme - Doğrudan Kullanıcı Oluşturma Mimarisi)
- Davet bağlantısı ve davet tokenı kabul etme akışı tamamen kaldırıldı.
- Partner kullanıcılarının yalnızca admin panelinden doğrudan oluşturulması sağlandı.
- Admin, yeni partner oluştururken kullanıcı adı, firma adı, başlangıç şifresi ve hesap durumunu (aktif/pasif) belirleyebilir.
- Şifreler sunucu tarafında (`admin_create_partner_user` RPC) `crypt/bcrypt` ile hash'lenerek `auth.users` tablosunda saklanır; düz metin olarak veritabanında saklanmaz veya loglanmaz.
- E-posta girmek zorunlu değildir; gölge auth e-postaları sunucu tarafında oluşturulur.
- Pasif veya askıya alınmış hesapların girişi hem veritabanı RPC seviyesinde hem de AuthContext oturum kontrolünde engellenmiştir.
- `20250224000000_admin_direct_user_creation.sql` migration dosyası eklendi.
- Vitest test kapsamı genişletilerek 26 teste çıkarıldı; `npm test` ve `npm run build` ile tüm testler ve üretim derlemesi başarıyla doğrulandı.

### v1.0.1
- `grant_admin.sql` dosyasındaki git birleştirme işaretleri temizlendi.
- Admin giriş akışı tamamen düzeltildi; `public.partners` kaydı olmadan sorunsuz giriş sağlandı.
- `get_partner_auth_email_by_username`, `get_partner_by_invite_token` ve `claim_partner_invite` RPC fonksiyonları eklendi.
- `partners` RLS politikalarındaki güvenlik açıkları giderildi.
- Vite paket boyutları `manualChunks` ile optimize edildi.
- Vitest test kapsamı genişletilerek 19 birim/entegrasyon testi eklendi ve tamamı doğrulandı.
