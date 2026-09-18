# 📘 DOKUMENTASI SISTEM - INVOICE ONLINE 101 (PWA SAAS)

Aplikasi SaaS frontend modern Progressive Web App (PWA) untuk pembuatan dan manajemen **Faktur Invoice** dan **Surat Penawaran Harga (Quotation)** secara instan, otomatis, dan offline-ready.

---

## 📌 1. Tech Stack & Dependencies

- **Frontend Framework:** React 18.3 (`react`, `react-dom`)
- **Build Tool:** Vite 5.4 + `@vitejs/plugin-react`
- **PWA Framework:** `vite-plugin-pwa` (Workbox Service Worker, Web App Manifest)
- **CSS & UI Framework:** Tailwind CSS 3.4, PostCSS, Autoprefixer
- **Iconography:** Lucide React (`lucide-react`)
- **Cloud Backend & Database:** Supabase (`@supabase/supabase-js`)
- **Visual FX:** `canvas-confetti` (Celebration UX saat invoice lunas / konversi dokumen)
- **Local Storage:** HTML5 LocalStorage untuk offline persistence data

---

## 🔑 2. Konfigurasi API Key & Supabase

File konfigurasi tersimpan pada:
👉 [`.env`](file:///D:/Web%20Project/invoice-online-101/.env)

```env
# Supabase Configuration (Disimpan di file lokal .env yang ter-ignore oleh git)
VITE_SUPABASE_URL=https://[YOUR_PROJECT_REF].supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_SUPABASE_API_KEY=your_supabase_api_key_here
```

> [!IMPORTANT]
> **Kredensial Aktif:**
> - **Supabase URL:** `https://lzjonriodmldardqlhit.supabase.co`
> - **Kunci Rahasia & Token:** Tersimpan secara aman di file lokal [`.env`](file:///D:/Web%20Project/invoice-online-101/.env) dan terdaftar di [`.gitignore`](file:///D:/Web%20Project/invoice-online-101/.gitignore) sehingga tidak akan terunggah ke repositori publik GitHub.
> - **Status Koneksi:** `HTTP 200 OK` (Telah diverifikasi aktif dan terhubung ke Supabase).
> - Tersambung melalui client module di [`src/lib/supabase.js`](file:///D:/Web%20Project/invoice-online-101/src/lib/supabase.js).

---

## 📁 3. Struktur Folder Proyek

```text
D:\Web Project\invoice-online-101\
├── public/
│   ├── logo.jpg                  # Logo resmi Invoice Online 101
│   ├── pwa-192x192.jpg           # Icon PWA ukuran 192px
│   └── pwa-512x512.jpg           # Icon PWA ukuran 512px
├── src/
│   ├── assets/                   # Aset gambar & grafik
│   ├── components/
│   │   ├── AuthView.jsx          # Layar login perusahaan & live preview akronim
│   │   ├── Navbar.jsx            # Topbar, badge perusahaan, tombol PWA install
│   │   ├── Sidebar.jsx           # Navigasi tab, counter badge belum lunas
│   │   ├── Dashboard.jsx         # KPI keuangan, invoice terbaru & quick action
│   │   ├── InvoiceList.jsx       # Tabel & filter faktur invoice
│   │   ├── QuotationList.jsx     # Tabel penawaran harga & 1-click konversi
│   │   ├── DocumentEditor.jsx    # Modal form pembuatan/edit invoice & penawaran
│   │   ├── DocumentPreview.jsx   # Lembar cetak standar A4, PDF & share WhatsApp
│   │   ├── ClientManager.jsx     # Buku kontak klien / pelanggan
│   │   └── CompanySettings.jsx   # Pengaturan kop surat, rekening, & tanda tangan
│   ├── context/
│   │   ├── AuthContext.jsx       # Sesi login user & identitas perusahaan
│   │   └── InvoiceContext.jsx    # State management invoice, penawaran, & klien
│   ├── lib/
│   │   └── supabase.js           # Cloud Database client initializer
│   ├── utils/
│   │   ├── numbering.js          # Generator akronim kode & running sequence
│   │   └── currency.js           # Formatter Rupiah & teks Terbilang otomatis
│   ├── App.jsx                   # Layout utama & router view
│   ├── index.css                 # Directive Tailwind & styling @media print
│   └── main.jsx                  # Entry point React
├── .env                          # File konfigurasi API key Supabase
├── .env.example                  # Template variabel lingkungan
├── DOKUMENTASI.md                # Dokumentasi lengkap proyek
├── index.html                    # Entry HTML & PWA metadata
├── package.json                  # Dependensi paket npm
├── tailwind.config.js            # Konfigurasi tema Tailwind CSS
└── vite.config.js                # Konfigurasi Vite & Service Worker PWA
```

---

## 💡 4. Logika Penomoran Pintar (Smart Acronym)

Penomoran dokumen dihasilkan secara otomatis berdasarkan nama perusahaan:
1. Mengambil inisial huruf dari setiap kata nama perusahaan (mengabaikan simbol non-alphanumeric).
2. Format Invoice: `INV-[KODE]-[TAHUN]-[00000X]`
3. Format Penawaran: `QUO-[KODE]-[TAHUN]-[00000X]`

### Contoh:
- **PT Artha Tri Hanjaya** $\rightarrow$ Kode: `PATH`  
  - Invoice: `INV-PATH-2026-000001`
  - Penawaran: `QUO-PATH-2026-000001`
- **PT Sukses Mekar Abadi** $\rightarrow$ Kode: `PSMA`  
  - Invoice: `INV-PSMA-2026-000001`
  - Penawaran: `QUO-PSMA-2026-000001`
- **CV Sinar Mandiri** $\rightarrow$ Kode: `CSM`  
  - Invoice: `INV-CSM-2026-000001`

*Pengguna dapat mengubah kode akronim secara fleksibel melalui tab **Profil Perusahaan**.*

---

## 🗄️ 5. Skema Tabel Database (SQL DDL Migration)

Salin dan jalankan script SQL berikut pada **SQL Editor** di Dashboard Supabase (`https://supabase.com/dashboard/project/[PROJECT_REF]/sql`):

```sql
-- 1. Tabel Profil Perusahaan
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    company_code VARCHAR(50) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(100),
    bank_name VARCHAR(100),
    account_number VARCHAR(100),
    account_holder VARCHAR(255),
    signature_name VARCHAR(255),
    signature_title VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabel Kontak Klien
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(100),
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabel Faktur Invoice
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    number VARCHAR(100) NOT NULL,
    sequence_number INT NOT NULL,
    company_code VARCHAR(50) NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'UNPAID', -- UNPAID, PAID, DRAFT, CANCELLED
    client_data JSONB NOT NULL,
    items JSONB NOT NULL,
    subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
    discount_percent NUMERIC(5,2) DEFAULT 0,
    discount_amount NUMERIC(15,2) DEFAULT 0,
    tax_percent NUMERIC(5,2) DEFAULT 11,
    tax_amount NUMERIC(15,2) DEFAULT 0,
    grand_total NUMERIC(15,2) NOT NULL DEFAULT 0,
    notes TEXT,
    payment_terms TEXT,
    linked_quotation_number VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabel Surat Penawaran Harga (Quotations)
CREATE TABLE IF NOT EXISTS quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    number VARCHAR(100) NOT NULL,
    sequence_number INT NOT NULL,
    company_code VARCHAR(50) NOT NULL,
    issue_date DATE NOT NULL,
    valid_until DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'SENT', -- DRAFT, SENT, ACCEPTED, REJECTED
    client_data JSONB NOT NULL,
    items JSONB NOT NULL,
    subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
    discount_percent NUMERIC(5,2) DEFAULT 0,
    discount_amount NUMERIC(15,2) DEFAULT 0,
    tax_percent NUMERIC(5,2) DEFAULT 11,
    tax_amount NUMERIC(15,2) DEFAULT 0,
    grand_total NUMERIC(15,2) NOT NULL DEFAULT 0,
    notes TEXT,
    payment_terms TEXT,
    converted_to_invoice_number VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mengaktifkan Row Level Security (RLS) & Kebijakan Akses Publik Sederhana
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
-- 5. Tabel Master Data Barang & Jasa (Katalog)
CREATE TABLE IF NOT EXISTS catalog_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL DEFAULT 'JASA', -- 'BARANG' atau 'JASA'
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    price NUMERIC(15,2) NOT NULL DEFAULT 0,
    unit VARCHAR(50) DEFAULT 'Unit',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabel Pengguna Perusahaan (Login & Manajemen Akun)
CREATE TABLE IF NOT EXISTS company_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    company_code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL,
    password VARCHAR(255),
    email VARCHAR(150),
    role VARCHAR(100) DEFAULT 'Staff Administrasi',
    status VARCHAR(50) DEFAULT 'Aktif',
    auth_provider VARCHAR(50) DEFAULT 'password', -- 'password' atau 'google'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mengaktifkan Row Level Security (RLS) & Kebijakan Akses Publik Sederhana
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Akses penuh companies" ON companies FOR ALL USING (true);
CREATE POLICY "Akses penuh clients" ON clients FOR ALL USING (true);
CREATE POLICY "Akses penuh invoices" ON invoices FOR ALL USING (true);
CREATE POLICY "Akses penuh quotations" ON quotations FOR ALL USING (true);
CREATE POLICY "Akses penuh catalog_items" ON catalog_items FOR ALL USING (true);
CREATE POLICY "Akses penuh company_users" ON company_users FOR ALL USING (true);

-- Akun Default Contoh
INSERT INTO company_users (company_name, company_code, name, username, password, role, email, status, auth_provider)
VALUES ('Homy Care Manado', 'HCM', 'Tri', 'tri', 'password123', 'Admin / Owner', 'tri@homycaremanado.com', 'Aktif', 'password')
ON CONFLICT DO NOTHING;
```

---

## 📱 6. Fitur PWA (Progressive Web App)

1. **Standalone Mode:** Menghilangkan address bar browser saat diinstal, bertindak seperti aplikasi desktop atau mobile native.
2. **Instalasi Mudah:** Tombol "Install App" akan muncul di topbar navbar.
3. **Offline Caching:** Service Worker Workbox menyimpan seluruh file statis di browser untuk akses cepat tanpa internet.

---

## 📝 7. Riwayat Perubahan (Changelog)

### [2026-09-18] - Transisi Penuh ke Serverless Client-Side PWA (Siap GitHub Pages)
- **Arsitektur Murni Client-Side React + Supabase BaaS:**
  - Seluruh alur autentikasi (`loginUser`, `loginGoogleUser`), manajemen user (`addUser`, `updateUser`, `deleteUser`), dan pembuatan dokumen (`invoices`, `quotations`, `catalog_items`, `clients`) dialihkan langsung dari browser React ke database cloud Supabase menggunakan library resmi `@supabase/supabase-js`.
  - Aplikasi **tidak lagi membutuhkan server backend Node.js (`server.js`) terpisah**. Seluruh file hasil build di folder `dist/` murni berupa HTML, CSS, dan JavaScript/React statis.
- **Kompatibilitas Penuh GitHub Pages & Hosting Statis:**
  - Ditambahkan `base: './'` pada [`vite.config.js`](file:///D:/Web%20Project/invoice-online-101/vite.config.js) sehingga aset dapat dibuka pada subdirektori repositori GitHub Pages tanpa error path 404.
  - PWA tetap aktif 100% dengan Workbox Service Worker dan Web App Manifest (bisa diinstal di Android, Windows, macOS, dan iOS).

### [2026-09-18] - Autentikasi 100% Database (Tanpa Hardcode) & Konfigurasi MCP
- **Pembersihan Total Hardcode:**
  - Menghilangkan seluruh pengecekan kode perusahaan, username, dan password secara statis/hardcoded di [`server.js`](file:///D:/Web%20Project/invoice-online-101/server.js), [`src/context/AuthContext.jsx`](file:///D:/Web%20Project/invoice-online-101/src/context/AuthContext.jsx), dan [`src/components/AuthView.jsx`](file:///D:/Web%20Project/invoice-online-101/src/components/AuthView.jsx).
  - Pengecekan login di backend murni melakukan kueri ke database:
    1. Mencari data perusahaan di tabel `companies` Supabase (nama dan kode perusahaan).
    2. Mencocokkan username dan password yang tersimpan di tabel `company_users` (didukung file store terisolasi `data/company_users.json`).
- **Penyimpanan Konfigurasi MCP:**
  - Menambahkan server `supabase-invoice` ke konfigurasi MCP Gemini IDE (`mcp_config.json`):
    - `VITE_SUPABASE_URL=https://[YOUR_PROJECT_REF].supabase.co`
    - `VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here`
    - `VITE_SUPABASE_API_KEY=your_supabase_api_key_here`

### [2026-09-18] - Fitur Login by Gmail & Penyimpanan Login di Database Supabase
- **Penyimpanan Database Cloud (100% Online):**
  - Autentikasi dan data login diproses di server backend (`server.js`) dan tersimpan ke tabel `company_users` di Supabase.
  - Endpoint `POST /api/auth/login` memverifikasi identitas pengguna langsung ke Supabase dengan dukungan case-insensitive.
  - Endpoint `POST /api/auth/google` otomatis mencatat dan mensinkronkan akun Gmail ke database Supabase.
- **Fitur Login by Gmail / Google:**
  - Ditambahkan tombol **"Masuk dengan Gmail / Google"** dengan ikon resmi Google di halaman login [`src/components/AuthView.jsx`](file:///D:/Web%20Project/invoice-online-101/src/components/AuthView.jsx).
  - Modal interaktif dengan opsi:
    1. **Google OAuth (Browser)**: Integrasi via `supabase.auth.signInWithOAuth({ provider: 'google' })`.
    2. **Masuk Cepat dengan Email Gmail**: Input alamat Gmail atau klik pilihan preset (`tri@homycaremanado.com`, `tri@gmail.com`) untuk langsung masuk dan tersimpan di database Supabase.
- **Pembersihan Tampilan Login:**
  - Menghilangkan kotak pratinjau "Auto-Kode Perusahaan:" di halaman login sesuai instruksi.

### [2026-09-18] - Akun Login Resmi homycaremanado & Fitur CRUD User
- **Kredensial Default:**
  - **Nama Perusahaan:** `homycaremanado` *(tidak case-sensitif: `HOMYCAREMANADO`, `Homy Care Manado`, atau `homycaremanado`)*
  - **Kode Perusahaan:** `HCM` $\rightarrow$ Format Invoice: `INV-HCM-2026-000001` & `QUO-HCM-2026-000001`
  - **User Login:** `tri` *(tidak case-sensitif)*
  - **Password:** `12shutera`
  - **Preset Tombol:** Ditambahkan tombol login cepat 1-klik di layar [`src/components/AuthView.jsx`](file:///D:/Web%20Project/invoice-online-101/src/components/AuthView.jsx).
- **Fitur CRUD User di Profil Perusahaan:**
  - Terletak pada tab **Profil Perusahaan** ([`src/components/CompanySettings.jsx`](file:///D:/Web%20Project/invoice-online-101/src/components/CompanySettings.jsx)).
  - Tabel daftar user dengan rincian: Nama, Username, Role, Status (Aktif/Nonaktif), dan tombol Aksi.
  - Modal **Tambah Pengguna Baru** & **Edit Pengguna**:
    - Nama Lengkap
    - Username Login (disimpan lowercase)
    - Password Login
    - Role / Peran (Admin / Owner, Bagian Keuangan, Staff Administrasi, Operator)
    - Status Akun (Aktif / Nonaktif)
    - Email
  - Hapus akun dengan proteksi (tidak bisa menghapus akun sendiri yang sedang aktif digunakan).

### [2026-09-18] - Sinkronisasi Penuh Backend Supabase (Cloud + Offline-First)
- **Modul Layanan Database:** Dibuat [`src/lib/supabaseService.js`](file:///D:/Web%20Project/invoice-online-101/src/lib/supabaseService.js) menangani CRUD cloud untuk:
  - `invoices` (Faktur Invoice)
  - `quotations` (Surat Penawaran)
  - `catalog_items` (Katalog Barang & Jasa)
  - `clients` (Buku Kontak Klien)
- **Arsitektur Offline-First & Auto Sync:**
  - Saat data baru dibuat/diubah/dihapus, data langsung disimpan ke `localStorage` (agar tetap bisa digunakan saat offline) dan otomatis dikirimkan ke database Supabase.
  - Saat online, aplikasi melakukan fetch data terbaru dari Supabase dan memperbarui state lokal.
- **Indikator Status Cloud di Navbar:**
  - Menampilkan badge status hijau *"Supabase"* di navbar atas dengan tombol sinkronisasi manual dan info kesehatan koneksi.

### [2026-09-18] - Penambahan Menu CRUD Master Data Barang & Jasa
- **Komponen Baru:** [`src/components/ItemManager.jsx`](file:///D:/Web%20Project/invoice-online-101/src/components/ItemManager.jsx) untuk manajemen data produk fisik dan jasa.
- **Fitur Katalog:**
  - Pembeda tipe badge: `BARANG` (amber) & `JASA` (biru).
  - Kode SKU, Kategori, Harga Standar, Satuan default, dan Deskripsi lengkap.
  - Filter kategori cepat (Semua, Barang Fisik, Jasa & Layanan) dan pencarian instan.
  - Tambah, edit, dan hapus item dengan feedback visual.
- **Integrasi Dokumen:** Penambahan fitur **"Pilih dari Katalog"** di form pembuatan Faktur Invoice & Penawaran (`DocumentEditor.jsx`) sehingga pengisian deskripsi, satuan, dan tarif harga dapat dilakukan secara instan 1-klik.
- **Skema DDL:** Penambahan skema tabel `catalog_items` pada dokumentasi database Supabase.

### [2026-09-18] - Integrasi API Key & Cloud Database
- **Koneksi Cloud:**
  - Supabase URL: Disimpan di variabel lingkungan (`VITE_SUPABASE_URL`)
  - Anon Public Key: Disimpan di variabel lingkungan (`VITE_SUPABASE_ANON_KEY`)
  - Pengujian endpoint REST menghasilkan status `HTTP 200 OK`.
- **Pembaruan Konfigurasi:**
  - File `.env` disesuaikan untuk testing lokal dan di-exclude dari Git via `.gitignore`.
  - File `.env.example` disediakan sebagai template variabel lingkungan.
  - Modul client `src/lib/supabase.js` disesuaikan untuk membaca langsung dari `import.meta.env`.

### [2026-09-18] - White-Labeling UI & Perbaikan Anon Public Key di Browser
- **Perbaikan Kunci API Browser:**
  - Mengganti secret service-role key di sisi browser client (`createClient`) dengan valid JWT anon public key untuk mencegah error `@supabase/supabase-js`: *"Forbidden use of secret API key in browser"*.
- **White-Labeling Antarmuka (Menghilangkan Sebutan Supabase bagi Pengguna):**
  - Mengubah label badge di Navbar dari *"Supabase"* menjadi *"Cloud Online"*.
  - Menghilangkan kata *"Supabase"* di seluruh pop-up modal login, tombol Gmail (*"Memproses Akun..."*), dan pesan sinkronisasi (*"Tersinkronisasi dengan Cloud Database"*).
  - Sanitasi pesan error login sehingga tidak menampilkan istilah teknis backend seperti *"database Supabase"* atau *"secret API key"*, melainkan diganti dengan pesan umum yang ramah pengguna seperti *"Gagal terhubung ke server database cloud. Silakan periksa koneksi internet Anda."*.
### [2026-09-18] - Optimalisasi Responsif Penuh untuk Smartphone / HP
- **Komponen Baru:** [`src/components/MobileBottomNav.jsx`](file:///D:/Web%20Project/invoice-online-101/src/components/MobileBottomNav.jsx)
  - Bottom Navigation Bar modern ala aplikasi Android native (Beranda, Invoice, Tombol Floating Tambah (+), Penawaran, dan Menu).
  - Bottom Sheet untuk pembuatan cepat Invoice atau Penawaran.
  - Slide-Up Drawer Menu untuk mengakses Katalog Barang & Jasa, Kontak Klien, Profil Perusahaan, dan Logout tanpa memadati layar.
- **Tampilan Kartu Adaptif (Mobile Card View):**
  - Pada [`InvoiceList.jsx`](file:///D:/Web%20Project/invoice-online-101/src/components/InvoiceList.jsx) dan [`QuotationList.jsx`](file:///D:/Web%20Project/invoice-online-101/src/components/QuotationList.jsx): otomatis berganti dari tabel lebar menjadi kartu ringkas saat dibuka di layar HP (< md).
- **Editor Dokumen Ramah Sentuhan (Mobile-First Editor):**
  - Pada [`DocumentEditor.jsx`](file:///D:/Web%20Project/invoice-online-101/src/components/DocumentEditor.jsx): modal form otomatis menjadi full-screen responsive pada HP, input rincian barang/jasa disajikan dalam bentuk kartu vertikal yang mudah diketik jari.
- **Pembersihan Helper Kredensial Login:**
  - Menghilangkan bagian *"Kredensial Akun di Database:"* dan tombol bantuan isi otomatis pada halaman login ([`AuthView.jsx`](file:///D:/Web%20Project/invoice-online-101/src/components/AuthView.jsx)), serta preset Gmail, agar form login bersih dan siap untuk publik / produksi.

### [2026-09-18] - Upload Stempel/TTD PNG, Filter Periode Tanggal, & Web Share API
- **Fitur 1: Upload Stempel & Tanda Tangan Digital (PNG Transparan):**
  - Pada [`CompanySettings.jsx`](file:///D:/Web%20Project/invoice-online-101/src/components/CompanySettings.jsx): disediakan dropzone upload file untuk **Tanda Tangan Digital** dan **Stempel Resmi Perusahaan**.
  - File dikonversi ke format base64 dan disimpan di profil perusahaan (`session`) serta tersinkronisasi.
  - Pada [`DocumentPreview.jsx`](file:///D:/Web%20Project/invoice-online-101/src/components/DocumentPreview.jsx): stempel resmi dan tanda tangan digital dirender secara otomatis pada blok tanda tangan bagian bawah faktur/penawaran dengan layout tumpang-tindih (overlay) yang elegan dan siap cetak/PDF.
- **Fitur 2: Filter Periode Tanggal Dokumen:**
  - Pada [`InvoiceList.jsx`](file:///D:/Web%20Project/invoice-online-101/src/components/InvoiceList.jsx) dan [`QuotationList.jsx`](file:///D:/Web%20Project/invoice-online-101/src/components/QuotationList.jsx): ditambahkan bilah filter periode tanggal.
  - Preset instan: *"Semua Waktu"*, *"Bulan Ini"*, *"Bulan Lalu"*, *"Tahun Ini"*.
  - Pemilihan tanggal kustom: input tanggal *"Dari"* dan *"Sampai"* dengan tombol reset cepat.
- **Fitur 3: Web Share API (Bagikan Native HP):**
  - Pada [`DocumentPreview.jsx`](file:///D:/Web%20Project/invoice-online-101/src/components/DocumentPreview.jsx): ditambahkan tombol **"Bagikan"** yang menggunakan standard `navigator.share` (Web Share API).
  - Saat dibuka di smartphone/tablet, tombol ini langsung memicu native sheet share sistem Android/iOS untuk membagikan info faktur ke aplikasi mana saja (WhatsApp, Telegram, Gmail, Bluetooth, Simpan ke Catatan, dll.).
  - Jika browser tidak mendukung Web Share API (desktop lama), sistem otomatis melakukan fallback menyalin teks rincian faktur ke clipboard secara mulus.



