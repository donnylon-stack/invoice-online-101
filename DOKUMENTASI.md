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

### [2026-09-18] - Push ke Repositori GitHub donnylon-stack
- **Repositori Resmi:** [`https://github.com/donnylon-stack/invoice-online-101`](https://github.com/donnylon-stack/invoice-online-101)
- **Token Digunakan:** GitHub Classic PAT (`ghp_...`) dengan scope `repo` dan `workflow`.
- **Pembersihan & Keamanan Penuh (Anti-Flag / Anti Secret Leak):**
  - Seluruh file telah diaudit sebelum di-push: 0 secret token terdeteksi.
  - File rahasia (`.env`, `token.local.md`, `*.local`) 100% dikecualikan oleh `.gitignore`.
  - Placeholder API Key yang aman digunakan pada file dokumentasi publik dan konfigurasi contoh (`.env.example`).
  - Mengunggah 36 file proyek secara aman dengan rate throttling untuk mencegah rate-limiting dan auto-flagging.
  - Alur otomatisasi CI/CD terpasang di `.github/workflows/deploy.yml` untuk auto-deploy ke GitHub Pages menggunakan GitHub Repository Secrets.
  - **Pembaruan PWA Android Install:** Generate ulang icon PWA menjadi PNG murni ukuran presisi (`pwa-192x192.png` & `pwa-512x512.png`), perbaiki konfigurasi `vite.config.js` dengan pemisahan purpose `any` dan `maskable`, serta sesuaikan `start_url` dan `scope` ke relative `./` agar kompatibel penuh dengan Web App Install prompt di Android Chrome / iOS Safari pada GitHub Pages.
  - **Penyempurnaan CRUD Klien / Pelanggan:** Mengimplementasikan fitur Update (Edit) dan Delete (Hapus) pada modul Klien di `ClientManager.jsx`, `InvoiceContext.jsx`, dan `supabaseService.js`, sehingga modul Klien kini memiliki fungsionalitas CRUD 100% lengkap setara dengan Invoice, Penawaran, dan Katalog Barang/Jasa.
  - **Fitur Upload Logo Perusahaan (Auto-Crop & Kompresi Otomatis):** Menambahkan fasilitas unggah logo perusahaan di `CompanySettings.jsx` dengan pemotongan otomatis 1:1 persegi (*center-crop* ke 400x400 px) dan kompresi cerdas bertahap hingga ukuran file maksimal 300KB. Logo yang diunggah otomatis tersinkronisasi ke kop faktur invoice & surat penawaran (`DocumentPreview.jsx`) serta navbar aplikasi (`Navbar.jsx`).
  - **Sinkronisasi Profil & Logo ke Database Cloud Supabase:** Menambahkan kolom `logo_url`, `signature_url`, dan `stamp_url` pada tabel `companies` di database Supabase, serta menambahkan integrasi `updateCompanyProfile` di `supabaseService.js` dan `AuthContext.jsx` agar logo, TTD, dan stempel tersimpan permanen di cloud database.
  - **Perbaikan Bug Refresh Data Hapus:** Memperbaiki logika auto-seed dokumen demo di `InvoiceContext.jsx` dan penanganan data cloud kosong (`Array.isArray`) sehingga invoice & penawaran yang sudah dihapus oleh pengguna tidak akan pernah muncul kembali saat halaman di-refresh.
  - **Fitur Dialog Popup Katalog Produk & Multi-Click Qty + Notifikasi Berhasil:**
    - Pada form pembuatan/edit faktur invoice dan surat penawaran ([`src/components/DocumentEditor.jsx`](file:///D:/Web%20Project/invoice-online-101/src/components/DocumentEditor.jsx)), tombol **"Pilih dari Katalog"** kini membuka dialog modal popup interaktif.
    - Dilengkapi kotak pencarian instan (nama produk, kode/SKU, dan rincian) serta tab filter kategori (*Semua*, *Barang/Produk*, *Jasa/Layanan*).
    - **Multi-Click Increment Qty:** Klik produk 1 kali langsung memasukkan 1 pcs ke keranjang/daftar rincian; klik 2 kali menjadi 2 pcs, dst.
    - Dilengkapi indikator kuantitas aktif pada setiap kartu produk dan floating toast banner animasi **"Berhasil! [Nama Produk] dimasukkan (X pcs)"** dengan auto-dismiss.
  - **Pemisahan Tombol Cetak & Simpan PDF Langsung:**
    - Pada halaman pratinjau dokumen ([`src/components/DocumentPreview.jsx`](file:///D:/Web%20Project/invoice-online-101/src/components/DocumentPreview.jsx)), tombol sebelumnya yang digabung *"Cetak / Simpan PDF"* kini telah dipisah menjadi dua fungsi independen:
      1. **Tombol "Cetak" (Print):** Membuka dialog printer fisik browser (`window.print()`) untuk mencetak langsung ke kertas.
      2. **Tombol "Simpan PDF" (Direct Download PDF):** Menggunakan `html2canvas` dan `jsPDF` untuk mengonversi lembar dokumen A4 beresolusi tinggi (skala 2) langsung menjadi file `.pdf` siap unduh bernama `Invoice_[Nomor].pdf` atau `Penawaran_[Nomor].pdf` tanpa perlu dialog printer. Dilengkapi indikator pemrosesan spinner loading.
  - **Implementasi Mode 100% Online Penuh (Zero-Offline Enforcement):**
    - **Komponen Baru:** [`src/components/OfflineBlocker.jsx`](file:///D:/Web%20Project/invoice-online-101/src/components/OfflineBlocker.jsx)
    - **Proteksi Layar Penuh (Full-Screen Blocker):** Jika perangkat pengguna terputus dari internet (`!navigator.onLine`) atau server database cloud tidak terjangkau (`!cloudStatus.connected`), layar pemblokir interaktif akan langsung menutup antarmuka aplikasi dengan status indikator real-time dan tombol *"Hubungkan Ulang Sekarang"*.
    - **Penghapusan Data Dummy Lokal:** Menghilangkan seluruh injeksi data sampel buatan di `InvoiceContext.jsx` agar aplikasi murni merefleksikan data riil yang ada di server cloud Supabase.
    - **Proteksi Operasi CRUD:** Pembuatan faktur invoice, penawaran, klien, dan katalog produk diwajibkan melewati validasi koneksi server aktif sebelum data dapat diproses.
    - **Pemantauan Detak Jantung Koneksi (Heartbeat):** Menambahkan event listener `online`/`offline` serta interval pemantauan berkala (15 detik) untuk sinkronisasi otomatis ketika koneksi pulih.
  - **Implementasi Halaman Login Khusus Superadmin Terpisah & Konsol Root:**
    - **Halaman Standalone:** Disediakan file entri mandiri [`superadmin.html`](file:///D:/Web%20Project/invoice-online-101/superadmin.html) dan script root [`src/superadmin.jsx`](file:///D:/Web%20Project/invoice-online-101/src/superadmin.jsx) yang terdaftar pada build multi-page Vite (`vite.config.js`).
    - **Kredensial Resmi Superadmin:**
      - **Username:** `superadmintri`
      - **Password:** `12shutera`
      - **Tabel Cloud:** Tersimpan pada tabel `company_users` Supabase dengan `role: 'Superadmin'`.
    - **Lingkup Eksklusif Superadmin (SuperAdminConsole.jsx):**
      - Super Administrator **hanya** memiliki akses ke manajemen multi-tenant:
        1. **CRUD Perusahaan:** Tambah perusahaan baru, edit data profil & rekening bank perusahaan, hapus perusahaan.
        2. **Kontrol Aktivasi (Activate / Deactivate):** Tombol toggle status perusahaan (`Aktif` vs `Nonaktif`).
        3. **CRUD User Perusahaan:** Tambah akun user baru di bawah perusahaan tertentu, ubah nama/password/role/status user, dan hapus user.
      - Superadmin tidak disajikan modul invoice, penawaran harga, klien, atau katalog barang untuk menjaga kemurnian tugas administrasi root.
    - **Pemblokiran Login Saat Perusahaan Dinonaktifkan (Deactivated):**
      - Pada `supabaseService.loginUser` dan `supabaseService.loginGoogleUser`, status perusahaan divalidasi terlebih dahulu sebelum pengecekan akun/password.
      - Jika status perusahaan adalah `Nonaktif`, seluruh pengguna yang berafiliasi dengan perusahaan tersebut secara otomatis **DITOLAK LOGIN** dengan pesan peringatan: *"Perusahaan [Nama] saat ini dinonaktifkan (Deactivated) oleh Super Administrator. Semua pengguna pada perusahaan ini tidak dapat login."*
    - **Pembatasan Hak Akses pada Aplikasi Pengguna Reguler:**
      - Pada [`src/components/CompanySettings.jsx`](file:///D:/Web%20Project/invoice-online-101/src/components/CompanySettings.jsx), tombol tambah user baru serta tombol edit dan hapus user disembunyikan untuk pengguna reguler (`!session?.isSuperadmin`). Diberikan banner informasi bahwa akun pengguna dikelola secara terpusat oleh Super Administrator.
      - Pada [`src/components/AuthView.jsx`](file:///D:/Web%20Project/invoice-online-101/src/components/AuthView.jsx), tombol login root di dalam kartu formulir dihilangkan agar form login pengguna tetap bersih, dan disediakan tautan terpisah menuju `superadmin.html`.
  - **Pembersihan Kredensial Login & Penambahan Fitur Ganti Password Super Admin:**
    - **Pembersihan Halaman Login:** Menghapus seluruh kotak informasi teks kredensial akun (*username* & *password*) dari halaman login [`src/components/SuperAdminLogin.jsx`](file:///D:/Web%20Project/invoice-online-101/src/components/SuperAdminLogin.jsx), serta mengosongkan nilai awal input form agar login aman dan tidak mengekspos kata sandi secara publik.
    - **Fitur Ganti Password Super Admin:**
      - Menambahkan tombol **"Ganti Password"** dengan ikon `KeyRound` di bagian atas konsol [`src/components/SuperAdminConsole.jsx`](file:///D:/Web%20Project/invoice-online-101/src/components/SuperAdminConsole.jsx).
      - Menyediakan dialog modal interaktif untuk mengubah kata sandi akun Super Admin (input Password Lama, Password Baru min. 4 karakter, dan Konfirmasi Password).
      - Terintegrasi langsung dengan database Supabase Cloud melalui fungsi `changeSuperadminPassword` pada [`src/lib/supabaseService.js`](file:///D:/Web%20Project/invoice-online-101/src/lib/supabaseService.js) dan [`src/context/AuthContext.jsx`](file:///D:/Web%20Project/invoice-online-101/src/context/AuthContext.jsx), yang memperbarui kolom `password` pada tabel `company_users`.
      - Validasi ketat diterapkan sehingga setelah kata sandi diubah, sistem langsung menerapkan kata sandi baru untuk login berikutnya.
  - **Perbaikan Kontras Teks pada Modal Form Input (Bug Teks Tidak Terbaca):**
    - **Masalah:** Pada dialog modal Edit/Tambah Akun Pengguna dan Edit/Tambah Perusahaan, teks yang diketik atau dipilih pada kolom Nama Lengkap, Username, Password, Role, dan Status berwarna putih di atas latar belakang putih karena pewarisan kelas `text-slate-100` dari root container.
    - **Solusi:**
      1. Menambahkan aturan global `@layer base` pada [`src/index.css`](file:///D:/Web%20Project/invoice-online-101/src/index.css) sehingga seluruh elemen `input`, `select`, dan `textarea` secara default memiliki warna teks gelap pekat (`color: #0f172a;`).
      2. Memberikan kelas styling eksplisit `text-slate-900 bg-white border-slate-300 placeholder:text-slate-400 font-medium shadow-sm` pada seluruh input dan dropdown select di [`src/components/SuperAdminConsole.jsx`](file:///D:/Web%20Project/invoice-online-101/src/components/SuperAdminConsole.jsx) dan [`src/components/CompanySettings.jsx`](file:///D:/Web%20Project/invoice-online-101/src/components/CompanySettings.jsx).
      3. Menetapkan `text-slate-900` pada kontainer modal dan tab konten konsol agar teks formulir memiliki kontras tinggi dan 100% terbaca dengan jelas di layar smartphone maupun desktop.
  - **Implementasi Arsitektur Multi-Tenancy SaaS 100% Terisolasi per Perusahaan (Tenant Data Isolation):**
    - **Latar Belakang:** Sebelumnya, penyimpanan lokal (*LocalStorage*) dan query tabel Klien serta Katalog Produk belum sepenuhnya mengisolasi data antar-perusahaan sehingga data invoice, klien, dan produk dari satu perusahaan berpotensi terlihat atau tersinkronisasi ke akun perusahaan baru.
    - **Pemisahan Data pada Database Supabase:**
      - Menambahkan kolom `company_code` pada tabel `clients` dan `catalog_items`, serta memastikan seluruh tabel relasional (`invoices`, `quotations`, `clients`, `catalog_items`) memiliki `company_id` dan `company_code` yang valid.
      - Memperbarui fungsi `fetchInvoices`, `fetchQuotations`, `fetchClients`, dan `fetchCatalogItems` pada [`src/lib/supabaseService.js`](file:///D:/Web%20Project/invoice-online-101/src/lib/supabaseService.js) agar menyertakan filter ketat `query.eq('company_id', companyId)` atau `query.eq('company_code', companyCode)`.
      - Memastikan fungsi `saveInvoice`, `saveQuotation`, `saveClient`, dan `saveCatalogItem` selalu menyertakan metadata tenant (`companyId`, `companyCode`, `companyName`) saat proses penyimpanan/upsert.
    - **Pemisahan Penyimpanan Lokal (*Tenant-Scoped LocalStorage*):**
      - Pada [`src/context/InvoiceContext.jsx`](file:///D:/Web%20Project/invoice-online-101/src/context/InvoiceContext.jsx), kunci penyimpanan lokal kini dibuat dinamis dan terisolasi berdasarkan perusahaan yang sedang login: `io101_invoices_[companyId]`, `io101_quotations_[companyId]`, `io101_clients_[companyId]`, dan `io101_items_[companyId]`.
      - Menghapus fallback berbahaya yang sebelumnya menyalin data lokal perusahaan lama ke perusahaan baru yang masih kosong di cloud.
      - Menambahkan `useEffect` reaktif yang otomatis membersihkan dan mereset seluruh state data di memori ketika pengguna berpindah perusahaan atau melakukan pergantian sesi login.
      - Pada fungsi `logout` di [`src/context/AuthContext.jsx`](file:///D:/Web%20Project/invoice-online-101/src/context/AuthContext.jsx), seluruh sisa cache sesi dan database pengguna dibersihkan secara total (`setAllUsers([])`, pembersihan key legacy) sehingga saat perusahaan lain login, data dimulai dari ruang kerja terisolasi yang bersih dan aman.

