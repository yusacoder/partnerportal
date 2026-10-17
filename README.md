# Eternal Production - Partner Portal & Yönetim Paneli

Bu proje, Eternal Production partnerleri ve yöneticileri (admin) için geliştirilmiş modern, performanslı ve güvenli bir web portalıdır. React, TypeScript, Vite, Tailwind CSS ve Supabase kullanılarak inşa edilmiştir.

---

## 📋 İçindekiler
1. [Proje Hakkında](#proje-hakkında)
2. [Özellikler](#özellikler)
3. [Gereksinimler](#gereksinimler)
4. [Kurulum Rehberi](#kurulum-rehberi)
5. [Projenin Çalıştırılması](#projenin-çalıştırılması)
6. [Supabase Bağlantısı ve Veritabanı Kurulumu](#supabase-bağlantısı-ve-veritabanı-kurulumu)
   - [Çevre Değişkenleri (.env)](#çevre-değişkenleri-env)
   - [Veritabanı Tablo Şeması (SQL)](#veritabanı-tablo-şeması-sql)
7. [Sitenin Çalışma Mantığı ve Sayfalar](#sitenin-çalışma-mantığı-ve-sayfalar)
8. [Testler ve Derleme](#testler-ve-derleme)

---

## 🚀 Proje Hakkında

Eternal Production Partner Portal, iş ortaklarının durumlarını takip edebildikleri, duyuruları inceleyebildikleri ve destek talepleri (ticket) oluşturabildikleri partner panelinin yanı sıra; yöneticilerin partnerleri yönetebildiği, yeni partner davet edebildiği, destek taleplerini yanıtlayabildiği ve denetim kayıtlarını (audit log) inceleyebildiği admin panelini barındırır.

---

## ✨ Özellikler

### 👤 Partner Paneli
- **Giriş ve Davet Bağlantısı:** Özel davet bağlantıları veya e-posta/şifre ile güvenli giriş.
- **Gösterge Paneli (Dashboard):** Aktif durum bilgisi, son duyurular ve açık destek talepleri.
- **Durum Geçmişi (Status):** Partner durumunun (Normal, Uyarı, Askıda, vb.) güncel hali ve geçmiş değişiklik kayıtları.
- **Duyurular (Announcements):** Tüm partnerlere veya belirli bir partnere özel duyuruların takibi, detay inceleme ve okundu olarak işaretleme.
- **Destek Sistemi (Support Tickets):** Yeni destek talebi oluşturma, var olan taleplere mesaj gönderme ve durum takibi.
- **İletişim & SSS:** Resmi iletişim kanalları, sosyal medya ve sıkça sorulan sorular.

### 🛡️ Admin Paneli
- **Genel Bakış (Admin Dashboard):** Toplam partner, bekleyen bilet ve sistem istatistikleri.
- **Partner Yönetimi:** Yeni partner ekleme/davet bağlantısı oluşturma, partner durumunu güncelleme (durum, açıklama, yapılması gereken aksiyon).
- **Duyuru Yönetimi:** Yeni duyuru yayınlama (tüm partnerler veya seçili partnerler), düzenleme ve öncelik belirleme.
- **Destek Talebi Yönetimi:** Gelen talepleri yanıtlama, durum güncelleme (Yeni, Yanıtlandı, Çözüldü vb.) ve dahili not (internal note) ekleme.
- **İletişim Ayarları:** İletişim bilgilerini ve SSS bağlantılarını dinamik güncelleme.
- **Denetim Kayıtları (Audit Logs):** Admin tarafından gerçekleştirilen kritik işlemlerin tarihçe takibi.

---

## 🛠️ Gereksinimler

Projenin çalışması için bilgisayarınızda aşağıdaki yazılımların kurulu olması gerekir:
- **Node.js**: `v18.0.0` veya üzeri
- **npm**: `v9.0.0` veya üzeri

---

## 📦 Kurulum Rehberi

1. **Projeyi indirin / klonlayın ve proje kök dizinine gidin:**
   ```bash
   cd eternal-production-partner-portal
   ```

2. **Bağımlılıkları yükleyin:**
   ```bash
   npm install
   ```

---

## ⚡ Projenin Çalıştırılması

Geliştirme sunucusunu (Development Server) başlatmak için:
```bash
npm run dev
```
Komutu çalıştırdıktan sonra tarayıcınızda `http://localhost:5173` (veya terminalde belirtilen port) adresine giderek siteyi görüntüleyebilirsiniz.

---

## 🔌 Supabase Bağlantısı ve Veritabanı Kurulumu

Proje, kimlik doğrulama (Authentication) ve veritabanı (Database) işlemleri için **Supabase** altyapısını kullanır.

### Çevre Değişkenleri (.env)

Projenin kök dizininde `.env` isimli bir dosya oluşturun ve Supabase projenizden alacağınız bilgileri aşağıdaki gibi ekleyin:

```env
VITE_SUPABASE_URL=https://sizin-supabase-proje-id.supabase.co
VITE_SUPABASE_ANON_KEY=sizin-supabase-anon-keyiniz
```

> **Not:** `.env` dosyasını oluşturduktan sonra `npm run dev` sunucusunu yeniden başlatmanız gerekebilir.

---

### Veritabanı Tablo Şeması (SQL)

Supabase dashboard'unda **SQL Editor** sekmesine giderek aşağıdaki SQL komutlarını çalıştırıp tabloları ve fonksiyonları oluşturun:

```sql
-- 1. Partnerler Tablosu
CREATE TABLE public.partners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    invite_token VARCHAR(255),
    invite_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Partner Durum Tablosu
CREATE TABLE public.partner_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'Normal' NOT NULL,
    description TEXT DEFAULT '',
    required_action TEXT DEFAULT '',
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Partner Durum Geçmişi
CREATE TABLE public.partner_status_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL,
    previous_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    description TEXT DEFAULT '',
    changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Duyurular Tablosu
CREATE TABLE public.announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'Genel' NOT NULL,
    priority VARCHAR(50) DEFAULT 'Normal' NOT NULL,
    publication_status VARCHAR(50) DEFAULT 'Yayında' NOT NULL,
    target_audience VARCHAR(50) DEFAULT 'all' NOT NULL,
    target_partner_ids TEXT[] DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    published_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Duyuru Okuma Kayıtları
CREATE TABLE public.announcement_reads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    announcement_id UUID REFERENCES public.announcements(id) ON DELETE CASCADE NOT NULL,
    partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL,
    read_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_announcement_partner_read UNIQUE (announcement_id, partner_id)
);

-- 6. Destek Talepleri (Tickets)
CREATE TABLE public.support_tickets (
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

-- 7. Destek Mesajları
CREATE TABLE public.support_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE NOT NULL,
    sender_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Destek İç Notları (Sadece Admin Görebilir)
CREATE TABLE public.support_internal_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE NOT NULL,
    admin_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Uygulama Ayarları (İletişim vs.)
CREATE TABLE public.app_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Denetim Kayıtları (Audit Logs)
CREATE TABLE public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    actor_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Destek Talebi Numarası Üreten Fonksiyon
CREATE OR REPLACE FUNCTION generate_ticket_number()
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
$$ LANGUAGE plpgsql;
```

---

## 🎯 Sitenin Çalışma Mantığı ve Sayfalar

### 🔑 Kullanıcı Rolleri
1. **Partner:** Giriş yaptıktan sonra `/partner/dashboard` rotasına yönlendirilir. Kendi durumunu, duyuruları görebilir ve destek talebi açabilir.
2. **Admin:** Supabase Auth kullanıcısının `app_metadata` veya `user_metadata` alanında `role: 'admin'` yetkisi tanımlandığında admin rotalarına (`/admin/...`) erişim sağlar.

### 🗺️ Rota Yapısı
- `/partner/login` - Partner/Admin Giriş Ekranı
- `/partner/invite` - Davet Bağlantısı ile Hesap Oluşturma
- `/partner/dashboard` - Partner Ana Sayfası
- `/partner/status` - Partner Durum Detayları ve Geçmişi
- `/partner/announcements` - Duyurular Listesi
- `/partner/announcements/:id` - Duyuru Detayı
- `/partner/support` - Destek Talepleri
- `/partner/support/new` - Yeni Destek Talebi Açma
- `/partner/support/:id` - Destek Talebi Mesajlaşma Detayı
- `/partner/contact` - İletişim Bilgileri & SSS
- `/admin` - Admin Gösterge Paneli
- `/admin/partners` - Partner Listesi & Yeni Davet Oluşturma
- `/admin/partners/:id` - Partner Detayı & Durum Değiştirme
- `/admin/announcements` - Duyuru Oluşturma & Yayınlama
- `/admin/support` - Destek Taleplerini Yönetme & Yanıtlama
- `/admin/settings` - Sistem ve İletişim Ayarları
- `/admin/audit-logs` - İşlem Geçmişi (Audit Log)

---

## 🧪 Testler ve Derleme

### Testleri Çalıştırma
Vitest ve React Testing Library ile yazılmış birim (unit) testlerini çalıştırmak için:
```bash
npm test
```

### Üretim Derlemesi (Production Build)
Projeyi yayına hazırlamak ve derlemek için:
```bash
npm run build
```
Derleme çıktıları `dist/` klasörüne oluşturulacaktır. Derlenen projeyi yerel ortamda önizlemek için:
```bash
npm run preview
```
