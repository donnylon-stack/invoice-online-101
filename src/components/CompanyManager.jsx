import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { generateCompanyAcronym } from '../utils/numbering';
import { 
  Building2, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  ExternalLink, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard, 
  ShieldCheck, 
  Sparkles, 
  FileText, 
  Upload, 
  Crown, 
  ArrowRight,
  User,
  Lock,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CompanyManager({ onSelectCompany }) {
  const { 
    session, 
    companies, 
    createCompany, 
    updateCompany, 
    deleteCompany, 
    switchCompany,
    exitCompanySwitch,
    fetchCompaniesList 
  } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | null
  const [deleteModalCompany, setDeleteModalCompany] = useState(null);
  const [activeCompanyForEdit, setActiveCompanyForEdit] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    phone: '',
    email: '',
    address: '',
    bankName: 'BCA',
    accountNumber: '',
    accountHolder: '',
    signatureName: '',
    signatureTitle: 'Owner / Direktur',
    logoUrl: '/logo.jpg',
    adminUsername: '',
    adminPassword: ''
  });

  // Filtered companies based on search
  const filteredCompanies = (companies || []).filter(c => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const nameMatch = (c.company_name || c.name || '').toLowerCase().includes(q);
    const codeMatch = (c.company_code || c.code || '').toLowerCase().includes(q);
    const phoneMatch = (c.phone || '').toLowerCase().includes(q);
    const emailMatch = (c.email || '').toLowerCase().includes(q);
    const addrMatch = (c.address || '').toLowerCase().includes(q);
    return nameMatch || codeMatch || phoneMatch || emailMatch || addrMatch;
  });

  // Handle Logo Upload with 1:1 auto-crop and compression under 300KB
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Pilih file gambar valid (PNG, JPG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const minSide = Math.min(img.width, img.height);
        const startX = (img.width - minSide) / 2;
        const startY = (img.height - minSide) / 2;
        const targetSize = Math.min(minSide, 400);

        const canvas = document.createElement('canvas');
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(img, startX, startY, minSide, minSide, 0, 0, targetSize, targetSize);
        let quality = 0.90;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);

        setFormData(prev => ({ ...prev, logoUrl: dataUrl }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setModalMode('create');
    setActiveCompanyForEdit(null);
    setActionError('');
    setFormData({
      name: '',
      code: '',
      phone: '',
      email: '',
      address: '',
      bankName: 'BCA',
      accountNumber: '',
      accountHolder: '',
      signatureName: '',
      signatureTitle: 'Owner / Direktur',
      logoUrl: '/logo.jpg',
      adminUsername: '',
      adminPassword: ''
    });
  };

  // Open Edit Modal
  const handleOpenEdit = (comp) => {
    setModalMode('edit');
    setActiveCompanyForEdit(comp);
    setActionError('');
    setFormData({
      name: comp.company_name || comp.name || '',
      code: comp.company_code || comp.code || '',
      phone: comp.phone || '',
      email: comp.email || '',
      address: comp.address || '',
      bankName: comp.bank_name || comp.bankInfo?.bankName || 'BCA',
      accountNumber: comp.account_number || comp.bankInfo?.accountNumber || '',
      accountHolder: comp.account_holder || comp.bankInfo?.accountHolder || comp.company_name || comp.name || '',
      signatureName: comp.signature_name || comp.signatureName || '',
      signatureTitle: comp.signature_title || comp.signatureTitle || 'Owner / Direktur',
      logoUrl: comp.logo_url || comp.logoUrl || '/logo.jpg',
      adminUsername: '',
      adminPassword: ''
    });
  };

  // Name change handler: auto generate company code if not manually modified
  const handleNameChange = (val) => {
    setFormData(prev => {
      const autoCode = modalMode === 'create' ? generateCompanyAcronym(val) : prev.code;
      return {
        ...prev,
        name: val,
        code: prev.code && modalMode !== 'create' ? prev.code : autoCode,
        accountHolder: prev.accountHolder || val
      };
    });
  };

  // Submit Create or Edit Form
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setActionError('');
    if (!formData.name.trim()) {
      setActionError('Nama perusahaan wajib diisi.');
      return;
    }

    const compCode = (formData.code || generateCompanyAcronym(formData.name)).toUpperCase().trim();

    setIsSubmitting(true);
    try {
      if (modalMode === 'create') {
        await createCompany({
          company_name: formData.name.trim(),
          company_code: compCode,
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          address: formData.address.trim(),
          bank_name: formData.bankName,
          account_number: formData.accountNumber.trim(),
          account_holder: formData.accountHolder.trim() || formData.name.trim(),
          signature_name: formData.signatureName.trim(),
          signature_title: formData.signatureTitle.trim(),
          logo_url: formData.logoUrl,
          adminUsername: formData.adminUsername.trim(),
          adminPassword: formData.adminPassword.trim()
        });

        setActionSuccess(`Perusahaan "${formData.name}" berhasil didaftarkan!`);
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      } else if (modalMode === 'edit' && activeCompanyForEdit) {
        await updateCompany(activeCompanyForEdit.id, {
          company_name: formData.name.trim(),
          company_code: compCode,
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          address: formData.address.trim(),
          bank_name: formData.bankName,
          account_number: formData.accountNumber.trim(),
          account_holder: formData.accountHolder.trim(),
          signature_name: formData.signatureName.trim(),
          signature_title: formData.signatureTitle.trim(),
          logo_url: formData.logoUrl
        });

        setActionSuccess(`Profil perusahaan "${formData.name}" berhasil diperbarui!`);
      }

      setModalMode(null);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      console.error('Submit company error:', err);
      setActionError(err.message || 'Gagal menyimpan data perusahaan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Company Handler
  const handleConfirmDelete = async () => {
    if (!deleteModalCompany) return;
    setIsSubmitting(true);
    setActionError('');
    try {
      await deleteCompany(deleteModalCompany.id);
      setActionSuccess(`Perusahaan "${deleteModalCompany.company_name || deleteModalCompany.name}" berhasil dihapus.`);
      setDeleteModalCompany(null);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      setActionError(err.message || 'Gagal menghapus perusahaan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Switch Company Handler
  const handleSwitchToCompany = (comp) => {
    switchCompany(comp);
    if (onSelectCompany) {
      onSelectCompany(comp);
    }
    setActionSuccess(`Beralih ke konteks perusahaan: ${comp.company_name || comp.name}`);
    setTimeout(() => setActionSuccess(''), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Banner & Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-indigo-900/40">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-indigo-500/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold tracking-wide">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>SUPER ADMIN MASTER CONTROL</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              Kelola Perusahaan <span className="text-indigo-400 text-lg sm:text-2xl font-normal">({companies.length})</span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Daftarkan entitas bisnis baru, atur format kode penomoran invoice/quotation, dan kelola multi-tenant database cloud Supabase secara tersentral.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => fetchCompaniesList()}
              title="Segarkan Data dari Cloud"
              className="p-3 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-2xl text-xs font-semibold backdrop-blur-md transition border border-white/10 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh Cloud</span>
            </button>

            <button
              onClick={handleOpenCreate}
              className="py-3 px-5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 active:scale-95 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-indigo-500/30 flex items-center gap-2.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Perusahaan Baru</span>
            </button>
          </div>
        </div>

        {/* Status Mode Switched Indicator */}
        {session?.isSwitched && (
          <div className="mt-6 pt-5 border-t border-indigo-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-indigo-900/40 -mx-6 -mb-6 p-4 rounded-b-3xl">
            <div className="flex items-center gap-2 text-indigo-200">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Sedang Mengelola Workspace: <strong className="text-white font-bold">{session.companyName}</strong> (Kode: {session.companyCode})</span>
            </div>
            <button
              onClick={exitCompanySwitch}
              className="text-xs text-amber-300 hover:text-amber-200 font-bold underline flex items-center gap-1 self-start sm:self-auto"
            >
              <span>Keluar ke Mode HQ Pusat</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Alert Banners */}
      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-fadeIn">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* 2. Filter & Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari perusahaan berdasarkan nama, kode, email, atau telepon..."
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900 placeholder:text-slate-400 transition"
          />
        </div>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="px-3 py-2 text-xs text-slate-500 hover:text-slate-800 font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 transition"
          >
            Reset Filter
          </button>
        )}
      </div>

      {/* 3. Companies Grid */}
      {filteredCompanies.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Tidak ada perusahaan yang cocok</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {searchQuery 
                ? `Tidak ditemukan perusahaan dengan kata kunci "${searchQuery}". Coba kata kunci lain.` 
                : 'Belum ada perusahaan terdaftar. Klik tombol Tambah Perusahaan Baru untuk mulai.'}
            </p>
          </div>
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="py-2 px-4 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
            >
              Hapus Pencarian
            </button>
          ) : (
            <button
              onClick={handleOpenCreate}
              className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              + Tambah Perusahaan Pertama
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredCompanies.map((comp) => {
            const cName = comp.company_name || comp.name || 'Perusahaan';
            const cCode = comp.company_code || comp.code || 'IO101';
            const isActiveWorkspace = session?.companyCode === cCode;

            return (
              <div 
                key={comp.id || cCode} 
                className={`bg-white rounded-3xl border transition-all flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md ${
                  isActiveWorkspace 
                    ? 'border-indigo-400 ring-2 ring-indigo-500/20' 
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                {/* Card Top Area */}
                <div className="p-5 sm:p-6 space-y-4">
                  {/* Header: Logo, Name, Code Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img 
                        src={comp.logo_url || comp.logoUrl || '/logo.jpg'} 
                        alt={cName} 
                        className="w-12 h-12 rounded-2xl object-cover border border-slate-200/80 shadow-sm shrink-0 bg-slate-50"
                        onError={(e) => { e.target.src = '/logo.jpg'; }}
                      />
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-snug truncate" title={cName}>
                          {cName}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200/70 font-bold px-2 py-0.5 rounded-md">
                            {cCode}
                          </span>
                          {isActiveWorkspace && (
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Workspace Aktif
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Edit/Delete Buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(comp)}
                        title="Edit Profil Perusahaan"
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteModalCompany(comp)}
                        title="Hapus Perusahaan"
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Company Details Body */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                    {/* Telepon */}
                    <div className="flex items-center gap-2.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{comp.phone || 'Belum diisi'}</span>
                    </div>

                    {/* Email */}
                    <div className="flex items-center gap-2.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{comp.email || 'Belum diisi'}</span>
                    </div>

                    {/* Alamat */}
                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2 text-[11px] text-slate-500 leading-relaxed">{comp.address || 'Belum diisi'}</span>
                    </div>

                    {/* Bank Info */}
                    <div className="flex items-center gap-2.5 pt-1 text-[11px] text-slate-700 font-medium">
                      <CreditCard className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="truncate">
                        {comp.bank_name || 'BCA'}: <span className="font-mono font-bold">{comp.account_number || '-'}</span> ({comp.account_holder || cName})
                      </span>
                    </div>

                    {/* Penandatangan */}
                    <div className="flex items-center gap-2.5 text-[11px] text-slate-500">
                      <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">
                        Penandatangan: <strong className="text-slate-700 font-semibold">{comp.signature_name || '-'}</strong> ({comp.signature_title || 'Direktur'})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Action Button */}
                <div className="p-4 bg-slate-50/80 border-t border-slate-100">
                  <button
                    onClick={() => handleSwitchToCompany(comp)}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition active:scale-[0.98] ${
                      isActiveWorkspace
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20'
                        : 'bg-white hover:bg-indigo-600 hover:text-white text-slate-800 border border-slate-200/90 shadow-sm'
                    }`}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{isActiveWorkspace ? 'Kelola Dokumen Perusahaan Ini' : 'Masuk sebagai Perusahaan Ini'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. MODAL FORM: CREATE / EDIT PERUSAHAAN                 */}
      {/* ======================================================== */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-200 animate-scaleUp overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200/70 text-indigo-600 flex items-center justify-center shadow-sm">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    {modalMode === 'create' ? 'Daftarkan Perusahaan Baru' : 'Edit Profil Perusahaan'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {modalMode === 'create' 
                      ? 'Lengkapi data profil entitas usaha untuk penomoran invoice & penawaran' 
                      : `Memperbarui data untuk ${formData.name || 'Perusahaan'}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalMode(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <form onSubmit={handleSubmitForm} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              {actionError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              {/* Section 1: Identitas Utama & Logo */}
              <div className="space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5 pb-1 border-b border-indigo-50">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>1. Identitas Bisnis & Logo</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Logo Upload Box */}
                  <div className="sm:col-span-1 flex flex-col items-center justify-center p-3.5 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 text-center">
                    <img 
                      src={formData.logoUrl || '/logo.jpg'} 
                      alt="Preview" 
                      className="w-20 h-20 rounded-2xl object-cover shadow-sm border border-slate-200 bg-white mb-2"
                      onError={(e) => { e.target.src = '/logo.jpg'; }}
                    />
                    <label className="cursor-pointer py-1.5 px-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-[11px] font-semibold text-slate-700 shadow-xs transition flex items-center gap-1.5">
                      <Upload className="w-3 h-3 text-indigo-600" />
                      <span>Upload Logo</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleLogoUpload} 
                      />
                    </label>
                    <span className="text-[9px] text-slate-400 mt-1">1:1 Auto Crop (Maks 300KB)</span>
                  </div>

                  {/* Nama & Kode Perusahaan */}
                  <div className="sm:col-span-2 space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nama Perusahaan <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="Contoh: PT Tri Homy Care Manado"
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-900"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Kode Akronim <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.code}
                          onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                          placeholder="HCM"
                          maxLength={6}
                          className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-indigo-700 uppercase"
                          required
                        />
                        <span className="text-[10px] text-slate-400">Digunakan di INV-{formData.code || 'XXX'}-...</span>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          No. Telepon / WA
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="0812-4567-8901"
                          className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-medium"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Alamat Email Resmi
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="info@perusahaan.com"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Alamat Operasional
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Jl. Sam Ratulangi No. 101, Manado"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Rekening Bank Penagihan */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5 pb-1 border-b border-indigo-50">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>2. Rekening Bank Penagihan Invoice</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Bank</label>
                    <input
                      type="text"
                      value={formData.bankName}
                      onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                      placeholder="BCA / Mandiri / BRI"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Rekening</label>
                    <input
                      type="text"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                      placeholder="7890123456"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Atas Nama Rekening</label>
                    <input
                      type="text"
                      value={formData.accountHolder}
                      onChange={(e) => setFormData(prev => ({ ...prev, accountHolder: e.target.value }))}
                      placeholder="Nama Pemilik Rekening"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Penandatangan Dokumen */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5 pb-1 border-b border-indigo-50">
                  <FileText className="w-3.5 h-3.5" />
                  <span>3. Nama & Jabatan Penandatangan Dokumen</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Penandatangan</label>
                    <input
                      type="text"
                      value={formData.signatureName}
                      onChange={(e) => setFormData(prev => ({ ...prev, signatureName: e.target.value }))}
                      placeholder="Tri HomyCare"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Jabatan Penandatangan</label>
                    <input
                      type="text"
                      value={formData.signatureTitle}
                      onChange={(e) => setFormData(prev => ({ ...prev, signatureTitle: e.target.value }))}
                      placeholder="Owner / Direktur Utama"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Akun Admin Baru (Hanya saat create) */}
              {modalMode === 'create' && (
                <div className="space-y-3 pt-2 bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100">
                  <div className="text-xs font-bold uppercase tracking-wider text-indigo-800 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>4. Buat Akun Admin Awal (Opsional)</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Akun ini dapat digunakan staf/admin perusahaan baru untuk login langsung di portal "Login Perusahaan".
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Username Login</label>
                      <input
                        type="text"
                        value={formData.adminUsername}
                        onChange={(e) => setFormData(prev => ({ ...prev, adminUsername: e.target.value }))}
                        placeholder="admin"
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Password Awal</label>
                      <input
                        type="text"
                        value={formData.adminPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, adminPassword: e.target.value }))}
                        placeholder="123456"
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="py-2.5 px-4 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="py-2.5 px-6 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-500/20 flex items-center gap-2 transition disabled:opacity-70"
                >
                  {isSubmitting ? 'Menyimpan...' : (modalMode === 'create' ? 'Daftarkan Perusahaan' : 'Simpan Perubahan')}
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. MODAL KONFIRMASI HAPUS PERUSAHAAN                    */}
      {/* ======================================================== */}
      {deleteModalCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-scaleUp space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mx-auto shadow-sm">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Hapus Perusahaan Ini?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Anda akan menghapus entitas <strong className="text-slate-900">{deleteModalCompany.company_name || deleteModalCompany.name}</strong> ({deleteModalCompany.company_code || deleteModalCompany.code}). Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                {actionError}
              </div>
            )}

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteModalCompany(null)}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-500/20 transition disabled:opacity-70"
              >
                {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
