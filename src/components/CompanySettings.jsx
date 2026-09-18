import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, 
  CreditCard, 
  ShieldCheck, 
  Sparkles, 
  Check, 
  Save, 
  Users, 
  UserPlus, 
  Edit2, 
  Trash2, 
  X, 
  Lock, 
  UserCheck, 
  Shield, 
  KeyRound,
  Upload,
  Image as ImageIcon 
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CompanySettings() {
  const { session, updateProfile, companyUsers, addUser, updateUser, deleteUser } = useAuth();

  // Company Profile states
  const [companyName, setCompanyName] = useState(session?.companyName || '');
  const [companyCode, setCompanyCode] = useState(session?.companyCode || '');
  const [address, setAddress] = useState(session?.address || '');
  const [phone, setPhone] = useState(session?.phone || '');
  const [email, setEmail] = useState(session?.email || '');
  const [bankName, setBankName] = useState(session?.bankInfo?.bankName || 'BCA');
  const [accountNumber, setAccountNumber] = useState(session?.bankInfo?.accountNumber || '');
  const [accountHolder, setAccountHolder] = useState(session?.bankInfo?.accountHolder || '');
  const [signatureName, setSignatureName] = useState(session?.signatureName || session?.userName || '');
  const [signatureTitle, setSignatureTitle] = useState(session?.signatureTitle || 'Owner / Direktur');
  const [signatureUrl, setSignatureUrl] = useState(session?.signatureUrl || '');
  const [stampUrl, setStampUrl] = useState(session?.stampUrl || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // User Management Modal states
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userError, setUserError] = useState('');
  const [userForm, setUserForm] = useState({
    name: '',
    username: '',
    password: '',
    role: 'Staff Administrasi',
    email: '',
    status: 'Aktif'
  });

  // File to Base64 helper
  const handleImageUpload = (e, setter) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Ukuran file maksimal 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setter(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    updateProfile({
      companyName,
      companyCode: companyCode.toUpperCase().trim(),
      address,
      phone,
      email,
      bankInfo: {
        bankName,
        accountNumber,
        accountHolder
      },
      signatureName,
      signatureTitle,
      signatureUrl,
      stampUrl
    });

    setSavedSuccess(true);
    confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 } });
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // User CRUD Handlers
  const handleOpenAddUser = () => {
    setEditingUser(null);
    setUserError('');
    setUserForm({
      name: '',
      username: '',
      password: '',
      role: 'Staff Administrasi',
      email: '',
      status: 'Aktif'
    });
    setUserModalOpen(true);
  };

  const handleOpenEditUser = (u) => {
    setEditingUser(u);
    setUserError('');
    setUserForm({
      name: u.name || '',
      username: u.username || '',
      password: u.password || '',
      role: u.role || 'Staff Administrasi',
      email: u.email || '',
      status: u.status || 'Aktif'
    });
    setUserModalOpen(true);
  };

  const handleDeleteUser = (u) => {
    if (confirm(`Apakah Anda yakin ingin menghapus user login "${u.username}" (${u.name})?`)) {
      try {
        deleteUser(u.id);
      } catch (err) {
        alert(err.message || 'Gagal menghapus user');
      }
    }
  };

  const handleUserFormSubmit = (e) => {
    e.preventDefault();
    setUserError('');

    if (!userForm.name.trim() || !userForm.username.trim() || !userForm.password.trim()) {
      setUserError('Nama Lengkap, Username, dan Password wajib diisi.');
      return;
    }

    try {
      if (editingUser) {
        updateUser(editingUser.id, userForm);
      } else {
        addUser(userForm);
        confetti({ particleCount: 50, spread: 50, origin: { y: 0.7 } });
      }
      setUserModalOpen(false);
    } catch (err) {
      setUserError(err.message || 'Gagal menyimpan user');
    }
  };

  return (
    <div className="max-w-4xl space-y-8 pb-12">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-brand-600" />
          Pengaturan Profil Perusahaan & Pengguna
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Kelola data legalitas, rekening kop surat tagihan, dan daftar pengguna yang berwenang login.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          Perubahan profil perusahaan berhasil disimpan!
        </div>
      )}

      {/* Form Profil Perusahaan */}
      <form onSubmit={handleProfileSubmit} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6 text-xs">
        
        {/* Identitas Perusahaan & Kode */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            Identitas Legal & Format Penomoran
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Nama Perusahaan Resmi</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 font-medium text-slate-900"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Kode Akronim Dokumen
              </label>
              <input
                type="text"
                value={companyCode}
                onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                placeholder="Contoh: HCM"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold text-brand-700 focus:ring-2 focus:ring-brand-500"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Format: INV-<strong>{companyCode || 'KODE'}</strong>-{new Date().getFullYear()}-000001
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nomor Telepon Kantor / WA</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Resmi Perusahaan</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Alamat Kantor Lengkap</label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Informasi Rekening Bank */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-brand-600" />
            Rekening Bank Tujuan Pembayaran (Kop Invoice)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Bank</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="BCA / Mandiri / BNI"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nomor Rekening</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="1234567890"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Atas Nama (A/N)</label>
              <input
                type="text"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                placeholder="Nama pemilik rekening"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Tanda Tangan Digital Dokumen */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            Penandatangan Dokumen Resmi
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Penandatangan</label>
              <input
                type="text"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                placeholder="Nama Lengkap"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Jabatan</label>
              <input
                type="text"
                value={signatureTitle}
                onChange={(e) => setSignatureTitle(e.target.value)}
                placeholder="Direktur Utama / Finance Manager"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Upload Tanda Tangan & Stempel PNG */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Upload TTD */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 text-xs flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-brand-600" />
                  Tanda Tangan Digital (PNG Transparan)
                </span>
                {signatureUrl && (
                  <button
                    type="button"
                    onClick={() => setSignatureUrl('')}
                    className="text-[10px] text-red-600 hover:underline font-semibold"
                  >
                    Hapus
                  </button>
                )}
              </div>

              {signatureUrl ? (
                <div className="h-24 bg-white rounded-lg border border-slate-200 p-2 flex items-center justify-center">
                  <img src={signatureUrl} alt="Signature Preview" className="h-full object-contain" />
                </div>
              ) : (
                <label className="h-24 bg-white hover:bg-slate-100/70 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer transition p-2 text-center">
                  <Upload className="w-5 h-5 text-slate-400 mb-1" />
                  <span className="text-[11px] font-medium text-slate-600">Pilih File Tanda Tangan</span>
                  <span className="text-[9px] text-slate-400">PNG transparan direkomendasikan (Maks 2MB)</span>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, setSignatureUrl)}
                  />
                </label>
              )}
            </div>

            {/* Upload Stempel Perusahaan */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 text-xs flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-brand-600" />
                  Stempel Resmi Perusahaan (PNG Transparan)
                </span>
                {stampUrl && (
                  <button
                    type="button"
                    onClick={() => setStampUrl('')}
                    className="text-[10px] text-red-600 hover:underline font-semibold"
                  >
                    Hapus
                  </button>
                )}
              </div>

              {stampUrl ? (
                <div className="h-24 bg-white rounded-lg border border-slate-200 p-2 flex items-center justify-center">
                  <img src={stampUrl} alt="Stamp Preview" className="h-full object-contain" />
                </div>
              ) : (
                <label className="h-24 bg-white hover:bg-slate-100/70 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer transition p-2 text-center">
                  <Upload className="w-5 h-5 text-slate-400 mb-1" />
                  <span className="text-[11px] font-medium text-slate-600">Pilih File Stempel Resmi</span>
                  <span className="text-[9px] text-slate-400">PNG bulat/oval transparan (Maks 2MB)</span>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, setStampUrl)}
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md shadow-brand-500/20 transition"
          >
            <Save className="w-4 h-4" />
            Simpan Perubahan Profil
          </button>
        </div>

      </form>

      {/* --- SECTION BARU: CRUD PENGGUNA / USER MANAGEMENT --- */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-600" />
              Manajemen Pengguna (CRUD User)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola akun pengguna yang berwenang login dan mengakses tagihan perusahaan <strong>{session?.companyName}</strong>.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAddUser}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-sm transition self-start sm:self-auto shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            Tambah User Baru
          </button>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Nama Lengkap</th>
                <th className="py-3 px-4">Username Login</th>
                <th className="py-3 px-4">Role / Hak Akses</th>
                <th className="py-3 px-4">Password</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {companyUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Belum ada data pengguna terdaftar.
                  </td>
                </tr>
              ) : (
                companyUsers.map((u) => {
                  const isCurrent = session?.userId === u.id || session?.username?.toLowerCase() === u.username?.toLowerCase();
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition">
                      
                      {/* Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              {u.name}
                              {isCurrent && (
                                <span className="bg-brand-50 text-brand-700 border border-brand-200 text-[9px] px-1.5 py-0.2 rounded font-semibold">
                                  Anda
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">{u.email || '-'}</div>
                          </div>
                        </div>
                      </td>

                      {/* Username */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                        @{u.username}
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                          <Shield className="w-3 h-3 text-slate-400" />
                          {u.role || 'Staff'}
                        </span>
                      </td>

                      {/* Password */}
                      <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                        ••••••••
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.status === 'Aktif' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'Aktif' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {u.status || 'Aktif'}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditUser(u)}
                            title="Edit User"
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={isCurrent}
                            onClick={() => handleDeleteUser(u)}
                            title={isCurrent ? 'Tidak bisa menghapus akun Anda sendiri yang sedang aktif' : 'Hapus User'}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* MODAL TAMBAH / EDIT USER */}
      {userModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-brand-600 text-white">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingUser ? 'Edit Akun Pengguna' : 'Tambah Pengguna Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Perusahaan: <strong>{session?.companyName}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUserModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUserFormSubmit} className="p-6 space-y-4 text-xs">
              
              {userError && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                  {userError}
                </div>
              )}

              {/* Nama Lengkap */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  placeholder="Nama lengkap user"
                  value={userForm.name}
                  onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 font-medium"
                />
              </div>

              {/* Username Login */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Username Login (tidak case sensitif) *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-mono">
                    @
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="username"
                    value={userForm.username}
                    onChange={(e) => setUserForm(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/\s+/g, '') }))}
                    className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Password Login *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Masukkan password akun"
                    value={userForm.password}
                    onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Role & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Role / Peran</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 bg-white"
                  >
                    <option value="Admin / Owner">Admin / Owner</option>
                    <option value="Bagian Keuangan (Finance)">Bagian Keuangan</option>
                    <option value="Staff Administrasi">Staff Administrasi</option>
                    <option value="Operator">Operator</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Akun</label>
                  <select
                    value={userForm.status}
                    onChange={(e) => setUserForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 bg-white font-medium"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email (Opsional)</label>
                <input
                  type="email"
                  placeholder="user@perusahaan.com"
                  value={userForm.email}
                  onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold shadow-md shadow-brand-500/20"
                >
                  {editingUser ? 'Simpan Perubahan' : 'Tambah User'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
