import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  KeyRound, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle2, 
  Server, 
  Eye, 
  EyeOff 
} from 'lucide-react';

export default function SuperAdminLogin({ onBack }) {
  const { loginSuperadmin } = useAuth();
  const [username, setUsername] = useState('superadmintri');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Username Super Admin wajib diisi.');
      return;
    }
    if (!password.trim()) {
      setError('Password Super Admin wajib diisi.');
      return;
    }

    setLoading(true);
    try {
      await loginSuperadmin(username.trim(), password.trim());
    } catch (err) {
      console.error('Superadmin login error:', err);
      let errMsg = err.message || 'Gagal masuk sebagai Super Admin.';
      if (errMsg.toLowerCase().includes('supabase') || errMsg.toLowerCase().includes('secret')) {
        errMsg = 'Koneksi ke database gagal. Pastikan jaringan internet stabil.';
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col justify-center items-center px-4 py-10 relative overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-500/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Header / Portal Badge */}
      <div className="text-center mb-7 z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold tracking-wide uppercase shadow-lg shadow-amber-500/5 mb-4">
          <ShieldAlert className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>Restricted Portal • Root Access</span>
        </div>

        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="p-3 bg-gradient-to-tr from-amber-600 to-amber-400 rounded-2xl shadow-xl shadow-amber-500/20 text-slate-950">
            <ShieldCheck className="w-8 h-8" />
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Login Khusus <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-yellow-400">Superadmin</span>
        </h1>
        <p className="mt-2 text-slate-400 text-xs sm:text-sm max-w-md mx-auto">
          Console kontrol sistem tingkat tertinggi Invoice Online 101 untuk manajemen akun & data seluruh perusahaan.
        </p>
      </div>

      {/* Main Glassmorphism Card */}
      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-amber-500/20 p-7 sm:p-8 z-10 transition-all">
        
        {/* Error Notification */}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5 animate-fadeIn">
            <span className="w-2 h-2 rounded-full bg-red-500 mt-1 shrink-0 animate-ping"></span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Username Superadmin */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              1. Username / Email Superadmin
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-400/80">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Contoh: superadmin"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-950/70 border border-slate-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-white placeholder:text-slate-500 font-medium transition"
                required
              />
            </div>
          </div>

          {/* 2. Password Superadmin */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              2. Password Superadmin
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-400/80">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi root"
                className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-950/70 border border-slate-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-white placeholder:text-slate-500 font-medium transition"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>


          {/* Action Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 py-3 px-4 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 active:scale-[0.99] text-slate-950 rounded-xl font-bold text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition disabled:opacity-70"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                Mengautentikasi Superadmin...
              </span>
            ) : (
              <>
                <span>Masuk Console Superadmin</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Info Card: Kredensial Superadmin */}
        <div className="mt-6 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400">
          <div className="flex items-center justify-between text-[11px] text-amber-400 font-semibold mb-1">
            <span className="flex items-center gap-1">
              <Server className="w-3.5 h-3.5" /> Akun Super Admin Resmi:
            </span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px]">Cloud Active</span>
          </div>
          <div className="font-mono text-[11px] text-slate-300 space-y-0.5">
            <div>User: <span className="text-white font-bold">superadmintri</span></div>
            <div>Password: <span className="text-white font-bold">12shutera</span></div>
          </div>
        </div>

        {/* Back Button / Link */}
        <div className="mt-5 pt-4 border-t border-slate-800 text-center">
          <button
            type="button"
            onClick={() => {
              if (onBack) {
                onBack();
              } else {
                window.location.href = './index.html';
              }
            }}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-amber-400 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Halaman Login Pengguna / Perusahaan</span>
          </button>
        </div>
      </div>

      {/* Footer Badges */}
      <div className="mt-8 flex flex-wrap justify-center items-center gap-5 text-xs text-slate-500 z-10">
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-amber-400" /> Multi-Company Master Access
        </span>
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-amber-400" /> Full Database Rights
        </span>
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-amber-400" /> Audit Log Protection
        </span>
      </div>
    </div>
  );
}
