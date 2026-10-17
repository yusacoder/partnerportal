# Eternal Production - Partner Portal & Yönetim Paneli

Bu proje, Eternal Production partnerleri ve yöneticileri (admin) için geliştirilmiş modern, performanslı ve güvenli bir web portalıdır. React, TypeScript, Vite, Tailwind CSS ve Supabase kullanılarak inşa edilmiştir.

**Canlı Adres:** [https://partner.eternalproduction.net/](https://partner.eternalproduction.net/)
**Yönetici Paneli:** [https://partner.eternalproduction.net/admin](https://partner.eternalproduction.net/admin)

---

## 📋 İçindekiler
1. [Proje Hakkında](#proje-hakkında)
2. [Gereksinimler](#gereksinimler)
3. [Proje Kurulumu ve Çalıştırılması](#proje-kurulumu-ve-çalıştırılması)
4. [Supabase Bağlantısı ve Veritabanı Kurulumu](#supabase-bağlantısı-ve-veritabanı-kurulumu)
5. [Güvenli Admin Hesabı Oluşturma Rehberi](#güvenli-admin-hesabı-oluşturma-rehberi)
6. [Admin Girişi Yapma ve Kullanım](#admin-girişi-yapma-ve-kullanım)
7. [İş Ortağı (Partner) Ekleme ve Güvenli Davet Gönderme](#iş-ortağı-partner-ekleme-ve-güvenli-davet-gönderme)
8. [Güvenlik Mimarisi ve RLS Politikaları](#güvenlik-mimarisi-ve-rls-politikaları)
9. [Vercel Deployment (Yayınlama) Rehberi](#vercel-deployment-yayınlama-rehberi)
10. [Testler ve Derleme](#testler-ve-derleme)

---

## 🚀 Proje Hakkında

Eternal Production Partner Portal; iş ortaklarının hesap durumlarını takip ettikleri, duyuruları inceledikleri ve destek talepleri açabildikleri **Partner Paneli** ile yöneticilerin tüm partnerleri yönettikleri, güvenli davet bağlantıları oluşturdukları, talepleri yanıtladıkları ve sistem denetim kayıtlarını (audit log) takip ettikleri **Admin Paneli** bileşenlerinden oluşur.

---

## 🛠️ Gereksinimler

- **Node.js**: `v18.0.0` veya üzeri
- **npm**: `v9.0.0` veya üzeri
- **Supabase Hesabı**: Veritabanı ve Auth işlemleri için active Supabase projesi.

---

## 📦 Proje Kurulumu ve Çalıştırılması

1. **Projeyi klonlayın / indirin ve proje dizinine gidin:**
   ```bash
   cd eternal-production-partner-portal
   ```

2. **Bağımlılıkları yükleyin:**
   ```bash
   npm install
   ```

3. **Çevre Değişkenlerini Hazırlayın (.env):**
   Kök dizinde `.env` isimli dosya oluşturun ve Supabase bilgilerinizi ekleyin:
   ```env
   VITE_SUPABASE_URL=https://<proje-id>.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_anon_key
   ```
   > ⚠️ **Önemli Güvenlik Uyarısı:**
   > Supabase `Secret Key` veya `service_role` anahtarını **asla** frontend kodlarına, `.env` dosyasına veya GitHub deposuna eklemeyin. İstemci tarafında yalnızca `VITE_SUPABASE_ANON_KEY` (Publishable Key) kullanılmalıdır.

4. **Geliştirme Sunucusunu Başlatın:**
   ```bash
   npm run dev
   ```

---

## 🔌 Supabase Bağlantısı ve Veritabanı Kurulumu

Veritabanı tablolarını, indeksleri, RPC fonksiyonlarını ve Row Level Security (RLS) politikalarını tek adımda kurmak için:

1. [Supabase Dashboard](https://supabase.com/dashboard) panelinize giriş yapın.
2. Sol menüden **SQL Editor** sekmesine gidin.
3. Repodaki `supabase/schema.sql` dosyasının içeriğini kopyalayıp SQL Editor alanına yapıştırın ve **Run** butonuna basarak çalıştırın.

Bu işlem aşağıdaki yapıları otomatik oluşturur:
- Tablolar: `user_roles`, `partners`, `partner_status`, `partner_status_history`, `announcements`, `announcement_reads`, `support_tickets`, `support_messages`, `support_internal_notes`, `app_settings`, `audit_logs`.
- Saklı Prosedürler & Fonksiyonlar: `is_admin()`, `grant_admin_role()`, `get_partner_auth_email_by_username()`, `generate_ticket_number()`.
- Tüm tablolar için **Row Level Security (RLS)** politikaları.

---

## 🛡️ Güvenli Admin Hesabı Oluşturma Rehberi

Admin yetkisi vermek hassas bir işlem olduğundan istemci (frontend) tarafından veya kullanıcının kendisi tarafından değiştirilebilen `user_metadata` alanına bakılarak verilmez. Admin rolü yalnızca güvenilir sunucu tarafındaki işlemle (`app_metadata` ve RLS korumalı `user_roles` tablosu) tanımlanır.

### Adım Adım İlk Admin Hesabını Oluşturma:

#### 1. Yöntem: Supabase Auth Üzerinden Kullanıcı Oluşturma + SQL ile Yetkilendirme
1. Supabase Dashboard ➔ **Authentication** ➔ **Users** sekmesine gidin.
2. **Add User** ➔ **Create User** butonuna tıklayın.
3. Kendi yönetici e-posta adresinizi ve şifrenizi girerek kullanıcıyı oluşturun.
4. **SQL Editor** sekmesine gidin ve aşağıdaki SQL komutunu kendi e-posta adresinizle çalıştırın:
   ```sql
   SELECT public.grant_admin_role('admin@eternalproduction.com');
   ```

#### 2. Yöntem: Doğrudan SQL ile Kullanıcı Kaydı ve Yetkilendirme
Eğer kullanıcınızı doğrudan SQL Editor ile oluşturup admin yapmak isterseniz, `supabase/grant_admin.sql` dosyasındaki şablonu kullanabilirsiniz:

```sql
-- Kullanıcıya sunucu tarafında güvenli şekilde admin yetkisi verme
SELECT public.grant_admin_role('kendi_epostaniz@domain.com');
```

**Neden Bu Yöntem Güvenlidir?**
- `grant_admin_role` fonksiyonu Supabase Auth tablosundaki `raw_app_meta_data` alanına `{"role": "admin"}` enjekte eder. İstemci JavaScript SDK'sı `app_metadata` alanını değiştiremez.
- Aynı zamanda RLS korumalı `user_roles` tablosuna `admin` kaydı işler. Normal kullanıcıların `user_roles` tablosuna yazma veya kendilerini admin yapma yetkisi RLS kuralları ile engellenmiştir.
- `service_role` anahtarını veya şifreleri kod içinde tutmanız gerekmez.

---

## 🔑 Admin Girişi Yapma ve Kullanım

1. Tarayıcınızda `/partner/login` sayfasına gidin (veya doğrudan `/admin` rotasını ziyaret edin).
2. Admin e-posta adresiniz ve belirlediğiniz şifreniz ile giriş yapın.
3. Kimlik doğrulama sistemi kullanıcınızın admin rolüne (`app_metadata.role` veya `user_roles`) sahip olduğunu algıladığında sizi otomatik olarak **Yönetici Paneline (`/admin`)** yönlendirecektir.
4. Admin panelinden:
   - Genel sistem durumunu ve bekleyen biletleri görüntüleyebilirsiniz.
   - İş ortaklarını listeleyebilir, durumlarını (Normal, Şüpheli, Riskli, Askıda) değiştirebilir veya hesaplarını pasife alabilirsiniz.
   - Tüm iş ortaklarına veya belirli ortaklara özel duyurular yayınlayabilirsiniz.
   - Destek taleplerini yanıtlayabilir ve yalnızca yöneticilerin görebileceği **iç notlar (internal notes)** ekleyebilirsiniz.
   - Denetim kayıtlarını (Audit Logs) inceleyebilirsiniz.

---

## 🤝 İş Ortağı (Partner) Ekleme ve Güvenli Davet Gönderme

Yöneticiler, şifre belirleme sorumluluğunu partnerin kendisine bırakan güvenli bir davet bağlantısı sistemi üzerinden yeni partner ekler:

1. **Admin Paneline Gidin:** `/admin/partners` sayfasını açın.
2. **Yeni Partner Tanımla:** Sağ üstteki **"Yeni Partner Tanımla"** butonuna tıklayın.
3. **Bilgileri Girin:**
   - **Kullanıcı Adı:** Örneğin `partner_ahmet` (Benzersiz olmalıdır).
   - **Görünen Ad / Firma:** Örneğin `Ahmet Yılmaz Ajansı`.
4. **Davet Bağlantısını Kopyalayın:**
   Sistem arka planda partner kaydını oluşturur ve 7 gün geçerli benzersiz bir `invite_token` üretir.
   Ekranda beliren güvenli davet bağlantısını (Örn: `https://partner.eternalproduction.net/partner/invite?token=abc-123-...`) kopyalayın.
5. **Davet Bağlantısını Partnere İletin:**
   Partner bu bağlantıya tıkladığında `/partner/invite` sayfasına yönlendirilir ve ilk şifresini kendisi belirleyerek hesabını aktifleştirir.

---

## 🔒 Güvenlik Mimarisi ve RLS Politikaları

Sistem, yetkisiz erişimleri hem ön yüzde (Frontend) hem de veritabanı katmanında (Backend/Supabase RLS) çift katmanlı korur:

1. **Ön Yüz Koruması (Frontend Auth Guard):**
   - `/admin` ve tüm alt rotaları `ProtectedAdminRoute` bileşeni ile korunur. Rolü `admin` olmayan kullanıcılar giriş ekranına yönlendirilir.
2. **Veritabanı Katmanı Koruması (Row Level Security - RLS):**
   - **Yönetici İç Notları (`support_internal_notes`):** Yalnızca admin kullanıcıları okuyabilir ve yazabilir. Partnerlerin bu tabloya 0 erişimi vardır.
   - **Denetim Kayıtları (`audit_logs`):** Yalnızca admin kullanıcıları okuyabilir.
   - **Partner Verileri (`partners`, `partner_status`):** Partnerler yalnızca kendi verilerini okuyabilir; adminler tüm verileri yönetebilir.
   - **Yetki Değişikliği Engeli (`user_roles`):** Normal kullanıcıların `user_roles` tablosuna müdahale etmesi RLS politikaları ile imkansız hale getirilmiştir.

---

## 🌐 Vercel Deployment (Yayınlama) Rehberi

1. GitHub deponuzu Vercel'e bağlayın.
2. **Environment Variables** bölümüne aşağıdaki değişkenleri tanımlayın:
   - `VITE_SUPABASE_URL` ➔ `https://<proje-id>.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` ➔ `sb_publishable_anon_key`
3. Derleme komutu: `npm run build`
4. Çıktı dizini: `dist`
5. Yayınlama sonrasında SPA rotalarının doğru çalışması için `vercel.json` rewrite kuralları projede hazırdır.

---

## 🧪 Testler ve Derleme

### Birim Testlerini Çalıştırma
```bash
npm test
```

### Üretim Derlemesi Oluşturma
```bash
npm run build
```
