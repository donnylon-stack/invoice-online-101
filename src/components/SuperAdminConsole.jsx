import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useInvoice } from '../context/InvoiceContext';
import { 
  Building2, 
  Users, 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  X, 
  ShieldAlert, 
  KeyRound, 
  Lock, 
  Building, 
  ArrowRight, 
  Sparkles, 
  CreditCard, 
  Phone, 
  Mail, 
  MapPin, 
  Check, 
  AlertTriangle,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateCompanyAcronym } from '../utils/numbering';

export default function SuperAdminConsole() {
  const { 
    session, 
    companies, 
    fetchCompanies, 
    createCompany, 
    updateCompany, 
    toggleCompanyStatus,
    deleteCompany, 
    switchCompany,
    allUsers,
    fetchAllUsers,
    addUser,
    updateUser,
    deleteUser,
    changeSuperadminPassword
  } = useAuth();

  const { syncWithCloud } = useInvoice();

  const [activeTab, setActiveTab] = useState('companies'); // 'companies' | 'users'
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Modal Ganti Password Super Admin States
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Modal Company States
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [companyForm, setCompanyForm] = useState({
    companyName: '',
    companyCode: '',
    phone: '',
    email: '',
    address: '',
    bankName: 'BCA',
    accountNumber: '',
    accountHolder: '',
    signatureName: '',
    signatureTitle: 'Direktur / Owner'
  });

  // Modal User States
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    companyId: '',
    companyName: '',
    companyCode: '',
    name: '',
    username: '',
    password: '',
    role: 'Admin / Owner',
    email: '',
    status: 'Aktif'
  });

  // Refresh data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      if (fetchCompanies) await fetchCompanies();
      if (fetchAllUsers) await fetchAllUsers();
    } catch (err) {
      console.warn('Error loading superadmin console data:', err);
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    setTimeout(() => setSuccessMessage(''), 3500);
  };

  // --- HANDLER GANTI PASSWORD SUPER ADMIN ---
  const handleOpenPasswordModal = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setPasswordModalOpen(true);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (!newPassword.trim()) {
      setPasswordError('Password baru wajib diisi.');
      return;
    }
    if (newPassword.trim().length < 4) {
      setPasswordError('Password baru minimal 4 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Konfirmasi password tidak cocok dengan password baru.');
      return;
    }

    setPasswordLoading(true);
    try {
      await changeSuperadminPassword(oldPassword, newPassword.trim());
      setPasswordModalOpen(false);
      showSuccess('Password Super Admin berhasil diperbarui! Gunakan password baru saat login.');
    } catch (err) {
      setPasswordError(err.message || 'Gagal mengubah password Super Admin.');
    } finally {
      setPasswordLoading(false);
    }
  };

  // --- HANDLER COMPANY ---
  const handleOpenAddCompany = () => {
    setEditingCompany(null);
    setCompanyForm({
      companyName: '',
      companyCode: '',
      phone: '',
      email: '',
      address: '',
      bankName: 'BCA',
      accountNumber: '',
      accountHolder: '',
      signatureName: '',
      signatureTitle: 'Direktur / Owner'
    });
    setErrorMessage('');
    setCompanyModalOpen(true);
  };

  const handleOpenEditCompany = (comp) => {
    setEditingCompany(comp);
    setCompanyForm({
      companyName: comp.company_name || comp.name || '',
      companyCode: comp.company_code || comp.code || '',
      phone: comp.phone || '',
      email: comp.email || '',
      address: comp.address || '',
      bankName: comp.bank_name || 'BCA',
      accountNumber: comp.account_number || '',
      accountHolder: comp.account_holder || comp.company_name || '',
      signatureName: comp.signature_name || comp.company_name || '',
      signatureTitle: comp.signature_title || 'Direktur / Owner'
    });
    setErrorMessage('');
    setCompanyModalOpen(true);
  };

  const handleCompanySubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!companyForm.companyName.trim()) {
      setErrorMessage('Nama Perusahaan wajib diisi.');
      return;
    }

    const code = companyForm.companyCode.trim() 
      ? companyForm.companyCode.trim().toUpperCase() 
      : generateCompanyAcronym(companyForm.companyName);

    const payload = {
      ...companyForm,
      companyCode: code,
      accountHolder: companyForm.accountHolder.trim() || companyForm.companyName.trim(),
      signatureName: companyForm.signatureName.trim() || companyForm.companyName.trim()
    };

    try {
      if (editingCompany) {
        await updateCompany(editingCompany.id, payload);
        showSuccess(`Perusahaan "${payload.companyName}" berhasil diperbarui!`);
      } else {
        await createCompany(payload);
        showSuccess(`Perusahaan baru "${payload.companyName}" berhasil ditambahkan!`);
      }
      setCompanyModalOpen(false);
      await loadData();
    } catch (err) {
      setErrorMessage(err.message || 'Gagal menyimpan data perusahaan');
    }
  };

  const handleDeleteCompany = async (comp) => {
    const cName = comp.company_name || comp.name;
    if (confirm(`PERINGATAN: Apakah Anda yakin ingin menghapus perusahaan "${cName}"?\nSemua user yang terafiliasi dengan perusahaan ini juga akan terhapus.`)) {
      try {
        await deleteCompany(comp.id);
        showSuccess(`Perusahaan "${cName}" berhasil dihapus.`);
        await loadData();
      } catch (err) {
        alert(err.message || 'Gagal menghapus perusahaan');
      }
    }
  };

  const handleSwitchCompany = (comp) => {
    if (switchCompany) {
      switchCompany(comp);
      showSuccess(`Kini mengelola data perusahaan: ${comp.company_name || comp.name}`);
    }
  };

  const handleToggleCompanyStatus = async (comp) => {
    const currentStatus = comp.status || 'Aktif';
    const nextStatus = currentStatus === 'Aktif' ? 'Nonaktif' : 'Aktif';
    const cName = comp.company_name || comp.name;

    const confirmMsg = nextStatus === 'Nonaktif'
      ? `NONAKTIFKAN PERUSAHAAN?\nPerusahaan "${cName}" akan di-deactivate. SEMUA PENGGUNA pada perusahaan ini TIDAK BISA LOGIN sampai diaktifkan kembali oleh Superadmin.`
      : `AKTIFKAN PERUSAHAAN?\nPerusahaan "${cName}" akan diaktifkan kembali sehingga pengguna dapat login normal.`;

    if (confirm(confirmMsg)) {
      try {
        await toggleCompanyStatus(comp.id, nextStatus);
        showSuccess(`Status "${cName}" diubah: ${nextStatus === 'Aktif' ? 'AKTIF (Bisa Login)' : 'NONAKTIF (Login Diblokir)'}`);
        await loadData();
      } catch (err) {
        alert(err.message || 'Gagal mengubah status perusahaan');
      }
    }
  };

  // --- HANDLER USER ---
  const handleOpenAddUser = () => {
    setEditingUser(null);
    const defaultComp = (companies && companies[0]) || null;
    setUserForm({
      companyId: defaultComp?.id || '',
      companyName: defaultComp?.company_name || '',
      companyCode: defaultComp?.company_code || '',
      name: '',
      username: '',
      password: '',
      role: 'Staff Administrasi',
      email: '',
      status: 'Aktif'
    });
    setErrorMessage('');
    setUserModalOpen(true);
  };

  const handleOpenEditUser = (u) => {
    setEditingUser(u);
    setUserForm({
      companyId: u.company_id || '',
      companyName: u.company_name || '',
      companyCode: u.company_code || '',
      name: u.name || '',
      username: u.username || '',
      password: u.password || '',
      role: u.role || 'Staff Administrasi',
      email: u.email || '',
      status: u.status || 'Aktif'
    });
    setErrorMessage('');
    setUserModalOpen(true);
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!userForm.name.trim() || !userForm.username.trim() || !userForm.password.trim()) {
      setErrorMessage('Nama Lengkap, Username, dan Password wajib diisi.');
      return;
    }

    try {
      if (editingUser) {
        await updateUser(editingUser.id, userForm);
        showSuccess(`Akun "${userForm.username}" berhasil diperbarui!`);
      } else {
        await addUser(userForm);
        showSuccess(`Akun baru "${userForm.username}" berhasil dibuat!`);
      }
      setUserModalOpen(false);
      await loadData();
    } catch (err) {
      setErrorMessage(err.message || 'Gagal menyimpan user');
    }
  };

  const handleDeleteUser = async (u) => {
    if (confirm(`Apakah Anda yakin ingin menghapus user "${u.username}" (${u.name})?`)) {
      try {
        await deleteUser(u.id);
        showSuccess(`User "${u.username}" berhasil dihapus.`);
        await loadData();
      } catch (err) {
        alert(err.message || 'Gagal menghapus user');
      }
    }
  };

  // Filtered users
  const displayedUsers = (allUsers || []).filter(u => {
    if (selectedCompanyFilter === 'ALL') return true;
    return (u.company_id === selectedCompanyFilter) || 
           ((u.company_code || '').toUpperCase() === selectedCompanyFilter.toUpperCase()) ||
           ((u.company_name || '').toLowerCase() === selectedCompanyFilter.toLowerCase());
  });

  return (
    <div className="max-w-6xl space-y-7 pb-16 font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* Top Banner Header */}
      <div className="p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 rounded-2xl border border-amber-500/25 shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[11px] font-bold uppercase tracking-wider mb-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>SUPER ADMINISTRATOR ROOT CONSOLE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Pusat Kontrol <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">Perusahaan & Pengguna</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Hak akses khusus Super Admin: mengelola seluruh entitas perusahaan multi-tenant dan akun pengguna di dalam tiap perusahaan.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenPasswordModal}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 text-amber-300 active:scale-95 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-amber-500/40 transition shadow-sm"
              title="Ganti Password Superadmin"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Ganti Password</span>
            </button>

            <button
              onClick={loadData}
              disabled={loading}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
              title="Refresh data dari database"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
              <span>Segarkan</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mt-6 pt-5 border-t border-slate-800">
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Total Perusahaan</div>
            <div className="text-xl sm:text-2xl font-bold text-white mt-0.5 font-mono">
              {companies?.length || 0}
            </div>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Total User Terdaftar</div>
            <div className="text-xl sm:text-2xl font-bold text-amber-400 mt-0.5 font-mono">
              {allUsers?.length || 0}
            </div>
          </div>
          <div className="col-span-2 sm:col-span-1 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Aktif Dikelola</div>
            <div className="text-sm font-bold text-emerald-400 mt-1 truncate">
              {session?.companyName || 'Homy Care Manado'}
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Tab Selector */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('companies')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
            activeTab === 'companies'
              ? 'border-amber-500 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>1. Manajemen Perusahaan ({companies?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
            activeTab === 'users'
              ? 'border-amber-500 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>2. Manajemen User Perusahaan ({allUsers?.length || 0})</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: MANAJEMEN PERUSAHAAN (COMPANIES CRUD)              */}
      {/* ========================================================= */}
      {activeTab === 'companies' && (
        <div className="space-y-4 text-slate-900">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-800">Daftar Seluruh Perusahaan Multi-Tenant</h2>
              <p className="text-xs text-slate-500">
                Super Admin dapat menambah perusahaan baru, memperbarui legalitas, atau beralih mengelola data perusahaan terpilih.
              </p>
            </div>
            <button
              onClick={handleOpenAddCompany}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-amber-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Perusahaan Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(companies || []).map((comp) => {
              const cName = comp.company_name || comp.name;
              const cCode = comp.company_code || comp.code;
              const isActiveCurrent = (session?.companyId === comp.id) || 
                ((session?.companyCode || '').toUpperCase() === (cCode || '').toUpperCase());

              return (
                <div 
                  key={comp.id} 
                  className={`p-5 rounded-2xl bg-white border transition shadow-sm ${
                    isActiveCurrent ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-amber-500/5' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-brand-600 overflow-hidden shrink-0">
                        {comp.logo_url ? (
                          <img src={comp.logo_url} alt={cName} className="w-full h-full object-cover" />
                        ) : (
                          <Building className="w-6 h-6 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-sm">{cName}</h3>
                          <span className="px-2 py-0.5 rounded bg-brand-50 text-brand-700 font-mono text-[10px] font-bold border border-brand-200">
                            {cCode}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-[200px]">{comp.address || 'Alamat belum diatur'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {comp.status === 'Nonaktif' ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold border border-red-200 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-red-600" /> Nonaktif
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Aktif
                        </span>
                      )}

                      {isActiveCurrent && (
                        <span className="px-2 py-0.5 rounded-full bg-brand-100 text-brand-800 text-[10px] font-bold">
                          Dikelola
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="py-2.5 px-3 bg-slate-50 rounded-xl space-y-1 text-xs text-slate-600 mb-4 border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">Telepon:</span>
                      <span className="font-medium">{comp.phone || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">Rekening Bank:</span>
                      <span className="font-mono text-[11px] font-semibold">{comp.bank_name || 'BCA'} {comp.account_number ? `• ${comp.account_number}` : ''}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleCompanyStatus(comp)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 active:scale-95 ${
                          comp.status === 'Nonaktif'
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                            : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                        }`}
                        title={comp.status === 'Nonaktif' ? 'Aktifkan agar user dapat login' : 'Nonaktifkan agar user tidak bisa login'}
                      >
                        {comp.status === 'Nonaktif' ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Aktifkan</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                            <span>Nonaktifkan</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSwitchCompany(comp)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                          isActiveCurrent 
                            ? 'bg-slate-100 text-slate-400 cursor-default' 
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95'
                        }`}
                        disabled={isActiveCurrent}
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>{isActiveCurrent ? 'Fokus Aktif' : 'Pilih'}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditCompany(comp)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 transition"
                        title="Edit Perusahaan"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCompany(comp)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                        title="Hapus Perusahaan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: MANAJEMEN USER PERUSAHAAN (USERS CRUD)             */}
      {/* ========================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-4 text-slate-900">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-800">Daftar Akun Pengguna Semua Perusahaan</h2>
              <p className="text-xs text-slate-500">
                Super Admin dapat menambahkan akun user login baru, mengubah kata sandi, mengatur role, atau menghapus user.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Filter Perusahaan */}
              <select
                value={selectedCompanyFilter}
                onChange={(e) => setSelectedCompanyFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
              >
                <option value="ALL" className="text-slate-900 bg-white">Semua Perusahaan ({allUsers?.length || 0})</option>
                {(companies || []).map(c => (
                  <option key={c.id} value={c.id || c.company_code} className="text-slate-900 bg-white">
                    {c.company_name} ({c.company_code})
                  </option>
                ))}
              </select>

              <button
                onClick={handleOpenAddUser}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-amber-500/20 transition shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah User Baru</span>
              </button>
            </div>
          </div>

          {/* Tabel Pengguna */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Nama & Username</th>
                    <th className="px-4 py-3">Perusahaan</th>
                    <th className="px-4 py-3">Role / Jabatan</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Password</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {displayedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        Tidak ada pengguna pada filter ini.
                      </td>
                    </tr>
                  ) : (
                    displayedUsers.map((u) => {
                      const isSuper = (u.role || '').toLowerCase().includes('superadmin') || u.username === 'superadmintri';

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/80 transition">
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isSuper && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-black uppercase">
                                  Superadmin
                                </span>
                              )}
                            </div>
                            <div className="text-slate-400 font-mono text-[11px]">@{u.username}</div>
                          </td>

                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-700">{u.company_name || 'Homy Care Manado'}</div>
                            <span className="text-[10px] font-mono text-slate-400 font-bold bg-slate-100 px-1.5 py-0.2 rounded">
                              {u.company_code || 'HCM'}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-slate-600">
                            {u.role || 'Staff Administrasi'}
                          </td>

                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              u.status === 'Aktif' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {u.status || 'Aktif'}
                            </span>
                          </td>

                          <td className="px-4 py-3 font-mono text-slate-500">
                            {u.password ? '••••••••' : '-'}
                          </td>

                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleOpenEditUser(u)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 transition"
                                title="Edit Akun"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                                title="Hapus Akun"
                                disabled={u.username === 'superadmintri'}
                              >
                                <Trash2 className="w-4 h-4" />
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
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL TAMBAH / EDIT PERUSAHAAN                            */}
      {/* ========================================================= */}
      {companyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingCompany ? 'Edit Data Perusahaan' : 'Tambah Perusahaan Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">Super Admin Multi-Tenant Controller</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCompanyModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCompanySubmit} className="p-6 space-y-4 text-xs text-slate-900 max-h-[80vh] overflow-y-auto">
              {errorMessage && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                  {errorMessage}
                </div>
              )}

              {/* Nama Perusahaan & Kode */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Nama Perusahaan *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: PT Artha Tri Hanjaya"
                    value={companyForm.companyName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCompanyForm(prev => ({
                        ...prev,
                        companyName: val,
                        companyCode: prev.companyCode ? prev.companyCode : generateCompanyAcronym(val)
                      }));
                    }}
                    className="w-full px-3 py-2 border border-slate-300 bg-white rounded-lg focus:ring-2 focus:ring-amber-500 font-medium text-slate-900 placeholder:text-slate-400 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kode Akronim</label>
                  <input
                    type="text"
                    placeholder="PATH"
                    value={companyForm.companyCode}
                    onChange={(e) => setCompanyForm(prev => ({ ...prev, companyCode: e.target.value.toUpperCase() }))}
                    className="w-full px-3 py-2 border border-slate-300 bg-white rounded-lg focus:ring-2 focus:ring-amber-500 font-mono font-bold uppercase text-slate-900 placeholder:text-slate-400 shadow-sm"
                  />
                </div>
              </div>

              {/* Kontak: Telepon & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor Telepon / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="0812-3456-7890"
                    value={companyForm.phone}
                    onChange={(e) => setCompanyForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 bg-white rounded-lg focus:ring-2 focus:ring-amber-500 text-slate-900 placeholder:text-slate-400 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Resmi</label>
                  <input
                    type="email"
                    placeholder="kontak@perusahaan.com"
                    value={companyForm.email}
                    onChange={(e) => setCompanyForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 bg-white rounded-lg focus:ring-2 focus:ring-amber-500 text-slate-900 placeholder:text-slate-400 shadow-sm"
                  />
                </div>
              </div>

              {/* Alamat */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Alamat Kantor / Kop Surat</label>
                <textarea
                  rows={2}
                  placeholder="Jl. Sam Ratulangi No. 101, Manado, Sulawesi Utara"
                  value={companyForm.address}
                  onChange={(e) => setCompanyForm(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 bg-white rounded-lg focus:ring-2 focus:ring-amber-500 text-slate-900 placeholder:text-slate-400 shadow-sm"
                />
              </div>

              {/* Rekening Pembayaran */}
              <div className="pt-2 border-t border-slate-100">
                <div className="font-bold text-slate-800 mb-2">Informasi Rekening Bank Tagihan</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Bank</label>
                    <input
                      type="text"
                      placeholder="BCA / Mandiri / BRI"
                      value={companyForm.bankName}
                      onChange={(e) => setCompanyForm(prev => ({ ...prev, bankName: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 bg-white rounded-lg focus:ring-2 focus:ring-amber-500 font-semibold text-slate-900 placeholder:text-slate-400 shadow-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-medium text-slate-600 mb-1">Nomor Rekening</label>
                    <input
                      type="text"
                      placeholder="7890123456"
                      value={companyForm.accountNumber}
                      onChange={(e) => setCompanyForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 bg-white rounded-lg focus:ring-2 focus:ring-amber-500 font-mono text-slate-900 placeholder:text-slate-400 shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Tombol Simpan */}
              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCompanyModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-100 font-semibold text-slate-600 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-slate-950 font-bold rounded-xl shadow-md transition"
                >
                  {editingCompany ? 'Simpan Perubahan' : 'Buat Perusahaan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL TAMBAH / EDIT USER PERUSAHAAN                       */}
      {/* ========================================================= */}
      {userModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingUser ? 'Edit Akun Pengguna' : 'Tambah User Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">Super Admin User Management</p>
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

            <form onSubmit={handleUserSubmit} className="p-6 space-y-4 text-xs text-slate-900">
              {errorMessage && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                  {errorMessage}
                </div>
              )}

              {/* Pilih Perusahaan */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Perusahaan Tempat User Bekerja *</label>
                <select
                  value={userForm.companyId}
                  onChange={(e) => {
                    const cId = e.target.value;
                    const c = (companies || []).find(comp => comp.id === cId);
                    setUserForm(prev => ({
                      ...prev,
                      companyId: cId,
                      companyName: c?.company_name || prev.companyName,
                      companyCode: c?.company_code || prev.companyCode
                    }));
                  }}
                  className="w-full px-3 py-2 border border-slate-300 bg-white rounded-lg focus:ring-2 focus:ring-amber-500 font-semibold text-slate-900 shadow-sm"
                  required
                >
                  <option value="" className="text-slate-900 bg-white">-- Pilih Perusahaan --</option>
                  {(companies || []).map(c => (
                    <option key={c.id} value={c.id} className="text-slate-900 bg-white">
                      {c.company_name} ({c.company_code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Nama Lengkap */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  placeholder="Nama lengkap pegawai"
                  value={userForm.name}
                  onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 bg-white rounded-lg focus:ring-2 focus:ring-amber-500 font-medium text-slate-900 placeholder:text-slate-400 shadow-sm"
                />
              </div>

              {/* Username & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Username Login *</label>
                  <input
                    type="text"
                    required
                    placeholder="username"
                    value={userForm.username}
                    onChange={(e) => setUserForm(prev => ({ ...prev, username: e.target.value.toLowerCase().trim() }))}
                    className="w-full px-3 py-2 border border-slate-300 bg-white rounded-lg focus:ring-2 focus:ring-amber-500 font-mono text-slate-900 placeholder:text-slate-400 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Password *</label>
                  <input
                    type="text"
                    required
                    placeholder="••••••••"
                    value={userForm.password}
                    onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 bg-white rounded-lg focus:ring-2 focus:ring-amber-500 font-mono text-slate-900 placeholder:text-slate-400 shadow-sm"
                  />
                </div>
              </div>

              {/* Role & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Role / Wewenang</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 bg-white rounded-lg focus:ring-2 focus:ring-amber-500 font-semibold text-slate-900 shadow-sm"
                  >
                    <option value="Admin / Owner" className="text-slate-900 bg-white">Admin / Owner</option>
                    <option value="Bagian Keuangan (Finance)" className="text-slate-900 bg-white">Bagian Keuangan (Finance)</option>
                    <option value="Staff Administrasi" className="text-slate-900 bg-white">Staff Administrasi</option>
                    <option value="Kasir" className="text-slate-900 bg-white">Kasir</option>
                    <option value="Superadmin" className="text-slate-900 bg-white">Superadmin</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Akun</label>
                  <select
                    value={userForm.status}
                    onChange={(e) => setUserForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 bg-white rounded-lg focus:ring-2 focus:ring-amber-500 font-semibold text-slate-900 shadow-sm"
                  >
                    <option value="Aktif" className="text-slate-900 bg-white">Aktif</option>
                    <option value="Nonaktif" className="text-slate-900 bg-white">Nonaktif (Suspend)</option>
                  </select>
                </div>
              </div>

              {/* Tombol Simpan */}
              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-100 font-semibold text-slate-600 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-slate-950 font-bold rounded-xl shadow-md transition"
                >
                  {editingUser ? 'Simpan Perubahan' : 'Buat Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL GANTI PASSWORD SUPER ADMIN                          */}
      {/* ========================================================= */}
      {passwordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl max-w-md w-full p-6 text-slate-100 relative animate-scaleUp">
            <button
              onClick={() => setPasswordModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-white">Ganti Password Super Admin</h3>
                <p className="text-xs text-slate-400">
                  Ubah kata sandi akun root <span className="text-amber-400 font-mono">@{session?.username || 'superadmintri'}</span>
                </p>
              </div>
            </div>

            {passwordError && (
              <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Password Lama (Opsional)
                </label>
                <div className="relative">
                  <input
                    type={showOldPass ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Masukkan password saat ini"
                    className="w-full px-3 py-2 pr-9 bg-slate-950/70 border border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 text-white placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPass(!showOldPass)}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-200"
                  >
                    {showOldPass ? <Lock className="w-3.5 h-3.5" /> : <KeyRound className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Password Baru <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 4 karakter"
                    required
                    className="w-full px-3 py-2 pr-9 bg-slate-950/70 border border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 text-white placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-200"
                  >
                    {showNewPass ? <Lock className="w-3.5 h-3.5" /> : <KeyRound className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Konfirmasi Password Baru <span className="text-amber-400">*</span>
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  required
                  className="w-full px-3 py-2 bg-slate-950/70 border border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 text-white placeholder:text-slate-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPasswordModalOpen(false)}
                  className="px-4 py-2 border border-slate-700 rounded-xl hover:bg-slate-800 font-semibold text-slate-300 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-slate-950 font-bold rounded-xl shadow-md transition disabled:opacity-70 flex items-center gap-1.5"
                >
                  {passwordLoading ? (
                    <span>Menyimpan...</span>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Simpan Password Baru</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
