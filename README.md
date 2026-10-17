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
  - Güvenli davet bağlantısı (`invite_token`) ile şifre belirleme bağlantısı üretme.
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
# Supabase Proje URL Adresi (Örn: https://xyz.supabase.co)
VITE_SUPABASE_URL=https://<sizin-proje-id>.supabase.co

# Supabase Anonim / Publishable API Anahtarı (İstemci tarafında güvenle kullanılır)
VITE_SUPABASE_ANON_KEY=sb_publishable_anon_key
```

> ⚠️ **KRİTİK GÜVENLİK UYARISI:** Supabase `service_role` veya veritabanı gizli şifresini **asla** `.env` dosyasına veya istemciye (frontend) gidecek kodlara koymayın. Tüm ayrıcalıklı veritabanı işlemleri `SECURITY DEFINER` yetkili Supabase RPC fonksiyonları üzerinden güvenle yürütülür.

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
2. `supabase/migrations/20250222000001_fix_partner_invite_flow.sql`

---

## 10. RLS Politikalarının Kurulması ve Doğrulanması

Her tablo için Row Level Security (RLS) etkinleştirilmiştir:
- `user_roles`: Kullanıcılar kendi rollerini okuyabilir; yalnızca admin değiştirebilir.
- `partners`: Partnerler yalnızca kendi profillerini görebilir ve güncelleyebilir; adminler tümünü yönetir. Unauthenticated kullanıcıların token doğrulama/kabul işlemleri RLS engeline takılmamak için `SECURITY DEFINER` RPC'ler (`get_partner_by_invite_token` ve `claim_partner_invite`) üzerinden gerçekleşir.
- `support_internal_notes`: Yalnızca `public.is_admin()` olan kullanıcılar okuyabilir ve yazabilir.
- `audit_logs`: Yalnızca admin okuyabilir.

---

## 11. İlk Admin Hesabının Güvenli Biçimde Hazırlanması

Admin rolü vermek için `supabase/grant_admin.sql` dosyasını kullanın.

1. Supabase Auth üzerinde admin kullanıcınızı (`destek@eternalproduction.net`) oluşturun.
2. SQL Editor'de `supabase/grant_admin.sql` dosyasını yapıştırıp çalıştırın:
   ```sql
   SELECT public.grant_admin_role('destek@eternalproduction.net');
   ```

---

## 12. Admin Rolünün Nasıl Kontrol Edileceği

Sistemde admin yetkisi iki aşamalı doğrulanır:
1. `auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'`
2. `public.user_roles` tablosında `user_id = auth.uid()` ve `role = 'admin'`

---

## 13. Partner Hesaplarının Oluşturulması ve Davet Akışı

### Davet Oluşturma (Admin Tarafı):
1. Admin `/admin/partners` sayfasına gider.
2. **"Yeni Partner Tanımla"** butonuna tıklar, benzersiz bir kullanıcı adı (örn: `partner_ahmet`) ve firma adını girer.
3. Sistem benzersiz bir UUID `invite_token` üretir ve davet bağlantısını sunar:
   `https://partner.eternalproduction.net/partner/invite?token=<UUID>`
4. Davet bağlantısı kopyalanıp partner ile paylaşılır.

### Davet Kabul Etme (Partner Tarafı):
1. Partner kendisine iletilen davet bağlantısını açar.
2. URL üzerindeki `token` parametresi otomatik okunur.
3. Partner ilk şifresini belirler (en az 8 karakter).
4. `claimInviteAndSetPassword` metodu çalışır:
   - `get_partner_by_invite_token` RPC fonksiyonu ile token sorgulanır.
   - Supabase Auth üzerinde partner için gölge e-posta (`<username>@partner.eternal.internal`) ile kimlik hesabı oluşturulur.
   - `claim_partner_invite` RPC fonksiyonu ile veritabanında `partners.auth_user_id` güncellenir, `invite_token` temizlenir ve `user_roles` tablosuna `partner` rolü atomik olarak yazılır.
   - Oturum açılır ve partner paneline yönlendirilir.

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

---

## 17. Supabase Auth Yönlendirme Ayarları

Supabase Dashboard -> **Authentication -> URL Configuration** sayfasında:
- **Site URL:** `https://partner.eternalproduction.net`
- **Redirect URLs:** `https://partner.eternalproduction.net/**`, `http://localhost:5173/**`

---

## 18. Yaygın Hatalar ve Sorun Giderme (Troubleshooting)

### 🔴 "Geçersiz veya kullanılmış davet bağlantısı" Hatası ve Çözümü:
- **Nedenler:**
  1. Davet tokenı daha önce bir işlem sırasında tüketilmiş / `invite_token` veritabanında `NULL` yapılmış olabilir.
  2. Davet linki kopyalanırken token karakterleri eksik kopyalanmış veya boşluk içeriyor olabilir.
  3. `get_partner_by_invite_token` veya `claim_partner_invite` RPC fonksiyonları veritabanında güncellenmemiş olabilir.
- **Çözüm / Sorun Giderme Adımları:**
  - `supabase/migrations/20250222000001_fix_partner_invite_flow.sql` dosyasını Supabase SQL Editor üzerinden çalıştırarak RPC fonksiyonlarını güncelleyin.
  - Admin panelinden partner için yeni bir davet oluşturun veya veritabanında partner kaydının `invite_token` alanını yeni bir UUID ile güncelleyin.
  - Davet linkinin tam olarak `?token=<UUID>` formatında açıldığını kontrol edin.

### 🔴 "Davet bağlantısının süresi dolmuş" Hatası:
- Davetlerin varsayılan geçerlilik süresi 7 gündür (`invite_expires_at`). Süresi dolan davetler için admin panelinden yeni partner/davet tanımlanmalıdır.

### 🔴 "Hesabınız pasif duruma getirilmiştir" Hatası:
- Partner kaydının `is_active` değeri `false` yapılmışsa giriş veya davet kabul işlemi engellenir. Admin panelindeki **Partner Yönetimi** sayfasından hesabın aktiflik durumunu değiştirin.

---

## 19. Güvenlik Uyarıları ve Sırların Korunması

- Git deponuza asla gizli API anahtarları eklemeyin.
- Supabase `service_role` anahtarını istemci (frontend) kodlarına veya `.env` dosyasına asla eklemeyin.
- İstemci kodunda hassas verileri, şifreleri veya davet tokenlarını console loglarına yazdırmayın.

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
- Bir migration işlemini geri almak gerektiğinde, ilgili migration SQL dosyasında tanımlanan fonksiyonları `DROP FUNCTION IF EXISTS ...` komutuyla kaldırabilir veya önceki sürüme dönebilirsiniz.

---

## 22. Bilinen Sınırlamalar ve Henüz Doğrulanamayan Noktalar

- Canlı Supabase veritabanına erişim yetkisi olmadan yerel ortamda ortam değişkenleri tanımlanmadığı sürece Supabase Auth işlemleri sahte modda test edilir.
- Canlı ortama SQL migration uygulanması Supabase Dashboard üzerinden yetkili veritabanı yöneticisi tarafından gerçekleştirilmelidir.

---

## 23. Sürüm Notları ve Yapılan Değişiklikler

### v1.0.2 (Son Güncelleme)
- Partner davet oluşturma ve davet kabul akışındaki tüm hatalar giderildi.
- `get_partner_by_invite_token` ve `claim_partner_invite` RPC fonksiyonları atomik doğrulama ve tüketim için güncellendi.
- Geçersiz token, kullanılmış token, süresi dolmuş token ve pasif kullanıcı durumları için Türkçe hata mesajları ayrıştırıldı.
- `claimInviteAndSetPassword` metodu atomik hâle getirildi, yarım kalmış kayıt riski engellendi.
- 9 yeni test eklenerek toplam 28 test başarıyla geçti.
- `README.md` davet akışı, ortam değişkenleri ve sorun giderme adımlarıyla güncellendi.
