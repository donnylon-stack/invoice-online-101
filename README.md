# 🚀 Invoice Online 101 (PWA SaaS)

Aplikasi SaaS frontend modern untuk pembuatan dan pengelolaan **Faktur Invoice** & **Surat Penawaran Harga (Quotation)** secara instan, otomatis, dan dapat diinstal di perangkat (PWA - Progressive Web App).

---

## 🌟 Fitur Utama

1. **Autentikasi Perusahaan & Akun Sederhana:**
   - **Nama Perusahaan** (misal: *PT Artha Tri Hanjaya* atau *PT Sukses Mekar Abadi*)
   - **Nama User** (PIC / Akuntan)
   - **Password**
   - Disertai live preview akronim kode perusahaan otomatis saat mengetik.

2. **Smart Acronym & Numbering Generator:**
   - Menghasilkan kode akronim dari huruf awal nama perusahaan:
     - `PT Artha Tri Hanjaya` $\rightarrow$ **PATH** $\rightarrow$ `INV-PATH-2026-000001` & `QUO-PATH-2026-000001`
     - `PT Sukses Mekar Abadi` $\rightarrow$ **PSMA** $\rightarrow$ `INV-PSMA-2026-000001` & `QUO-PSMA-2026-000001`
   - Running counter sequence 6 digit (`000001`, `000002`, dst.) per tahun dan per perusahaan.
   - Dapat di-override atau disesuaikan di menu Pengaturan Profil Perusahaan.

3. **Manajemen Invoice & Penawaran:**
   - Tambah baris item dinamis (Deskripsi, Qty, Satuan, Harga, Diskon per item %).
   - Kalkulasi otomatis Subtotal, Diskon Faktur, PPN 11%, dan Grand Total.
   - Konversi teks angka ke **Terbilang Rupiah** otomatis.
   - **1-Click Convert Quotation to Invoice**: Ubah status penawaran yang disetujui langsung menjadi faktur invoice resmi tanpa perlu input ulang.
   - Toggle status Lunas (`PAID`) dengan animasi selebrasi confetti.

4. **Tampilan Cetak & Ekspor PDF Standar A4:**
   - Format surat resmi dilengkapi kop surat, logo perusahaan, nomor dokumen, rincian pembayaran rekening bank, dan tanda tangan digital.
   - Watermark dinamis: **LUNAS / PAID**, **DISETUJUI**, atau **DRAFT**.
   - Fitur Cetak / Simpan PDF langsung via browser (`window.print()`).
   - Tombol kirim ringkasan penagihan via WhatsApp link.

5. **PWA (Progressive Web App):**
   - Offline-ready dengan Service Worker & Workbox caching.
   - Web App Manifest dengan icon aplikasi resmi.
   - Tombol "Install App" langsung muncul di navbar pada browser pendukung (Chrome/Edge/Android/Desktop).

---

## 🛠️ Tech Stack

- **Framework:** React 18
- **Build Tool:** Vite 5
- **Styling:** Tailwind CSS 3 + Plus Jakarta Sans Typography
- **Icons:** Lucide React
- **PWA:** `vite-plugin-pwa` + Workbox
- **UX Effects:** `canvas-confetti`
- **Storage:** LocalStorage persistence (State terjaga aman)

---

## 💻 Menjalankan di Lokal

1. **Jalankan Development Server:**
   ```bash
   cd "D:\Web Project\invoice-online-101"
   npm run dev
   ```
   Akses di browser: `http://localhost:5173/`

2. **Build Versi Produksi:**
   ```bash
   npm run build
   ```
