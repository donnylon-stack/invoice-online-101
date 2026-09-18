import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { generateCompanyAcronym, formatDocumentNumber } from '../utils/numbering';
import { Building2, User, Lock, ArrowRight, ShieldCheck, Sparkles, FileText, CheckCircle2, Mail, X } from 'lucide-react';

export default function AuthView() {
  const { login, loginWithGoogle } = useAuth();
  const [companyName, setCompanyName] = useState('homycaremanado');
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Google / Gmail Login States
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [gmailEmail, setGmailEmail] = useState('');
  const [gmailName, setGmailName] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');

  // Handle direct Gmail Login
  const handleGmailLogin = async (e) => {
    if (e) e.preventDefault();
    if (!gmailEmail || !gmailEmail.includes('@')) {
      setGoogleError('Silakan masukkan alamat Gmail yang valid.');
      return;
    }
    setGoogleLoading(true);
    setGoogleError('');
    try {
      await loginWithGoogle({
        email: gmailEmail.trim(),
        name: gmailName.trim() || gmailEmail.split('@')[0],
        company: companyName.trim() || 'Homy Care Manado'
      });
      setShowGoogleModal(false);
    } catch (err) {
      let errMsg = err.message || 'Gagal masuk dengan Gmail';
      if (errMsg.toLowerCase().includes('supabase') || errMsg.toLowerCase().includes('secret') || errMsg.toLowerCase().includes('api key')) {
        errMsg = 'Gagal terhubung ke database cloud. Periksa koneksi internet Anda.';
      }
      setGoogleError(errMsg);
    } finally {
      setGoogleLoading(false);
    }
  };

  // Handle Google OAuth
  const handleOAuthGoogle = async () => {
    setGoogleLoading(true);
    setGoogleError('');
    try {
      const { supabase } = await import('../lib/supabase');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) {
        throw error;
      }
    } catch (err) {
      setGoogleError('Fitur login instan Google OAuth belum diaktifkan di server. Silakan gunakan opsi "Masuk dengan Email Gmail" di bawah.');
      setGoogleLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const norm = companyName.trim().toLowerCase().replace(/\s+/g, '');
  const previewAcronym = norm === 'homycaremanado' ? 'HCM' : generateCompanyAcronym(companyName);
  const previewInvoiceNumber = formatDocumentNumber('INV', previewAcronym, 1, currentYear);
  const previewQuotationNumber = formatDocumentNumber('QUO', previewAcronym, 1, currentYear);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!companyName.trim()) {
      setError('Silakan masukkan nama perusahaan Anda.');
      return;
    }
    if (!userName.trim()) {
      setError('Silakan masukkan nama user Anda.');
      return;
    }
    if (!password.trim()) {
      setError('Silakan masukkan password.');
      return;
    }

    setLoading(true);
    try {
      await login(companyName, userName, password);
    } catch (err) {
      console.error('Login error:', err);
      let errMsg = err.message || 'Gagal login. Silakan periksa kembali kredensial Anda.';
      if (errMsg.toLowerCase().includes('supabase') || errMsg.toLowerCase().includes('secret') || errMsg.toLowerCase().includes('api key')) {
        errMsg = 'Gagal terhubung ke server database cloud. Silakan periksa koneksi internet Anda atau coba beberapa saat lagi.';
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-brand-950 to-slate-900 flex flex-col justify-center items-center px-4 py-10 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="text-center mb-8 z-10">
        <div className="inline-flex items-center justify-center p-3 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl mb-4">
          <img src="/logo.jpg" alt="Invoice Online 101" className="w-14 h-14 rounded-xl object-cover shadow-md" />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
          Invoice Online <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-cyan-300">101</span>
        </h1>
        <p className="mt-2 text-slate-400 text-sm max-w-sm mx-auto">
          Platform SaaS pembuatan Invoice & Penawaran instan dengan format nomor otomatis dan ramah PWA
        </p>
      </div>

      {/* Card Form */}
      <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-100/50 p-7 sm:p-8 z-10 transition-all">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900">Masuk ke Akun Perusahaan</h2>
          <p className="text-xs text-slate-500 mt-1">
            Lengkapi identitas login perusahaan Anda (tidak case-sensitif, huruf kecil/besar sama).
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Nama Perusahaan */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                1. Nama Perusahaan
              </label>
              <span className="text-[10px] text-slate-400 font-medium italic">Tidak case sensitif</span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Building2 className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Contoh: homycaremanado"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white text-slate-900 placeholder:text-slate-400 font-medium transition"
                required
              />
            </div>
          </div>

          {/* 2. Nama User */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              2. User
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Masukkan username"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white text-slate-900 placeholder:text-slate-400 font-medium transition"
                required
              />
            </div>
          </div>

          {/* 3. Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              3. Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white text-slate-900 placeholder:text-slate-400 transition"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-brand-600 hover:bg-brand-700 active:scale-[0.99] text-white rounded-xl font-semibold text-sm shadow-lg shadow-brand-500/30 flex items-center justify-center gap-2 transition disabled:opacity-70"
          >
            {loading ? 'Memproses...' : 'Masuk ke Dashboard'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Separator */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white/95 px-3 text-slate-400 font-semibold tracking-wider">
              atau masuk dengan
            </span>
          </div>
        </div>

        {/* Button Login by Gmail / Google */}
        <button
          type="button"
          onClick={() => setShowGoogleModal(true)}
          className="w-full py-2.5 px-4 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold text-sm flex items-center justify-center gap-3 transition shadow-sm hover:shadow active:scale-[0.99]"
        >
          {/* Google SVG Icon */}
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Masuk dengan Gmail / Google</span>
        </button>
      </div>

      {/* Footer Features Badge */}
      <div className="mt-8 flex flex-wrap justify-center items-center gap-4 text-xs text-slate-400 z-10">
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Format Nomor Otomatis
        </span>
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> PWA Offline-Ready
        </span>
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Cetak & Unduh PDF
        </span>
      </div>

      {/* Modal Dialog: Masuk dengan Google / Gmail */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-7 border border-slate-200 relative animate-scaleUp">
            {/* Close button */}
            <button
              onClick={() => setShowGoogleModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center p-2 shadow-sm shrink-0">
                <svg className="w-7 h-7" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Masuk dengan Gmail / Google</h3>
                <p className="text-xs text-slate-500">Tersinkronisasi & tersimpan otomatis di Cloud</p>
              </div>
            </div>

            {googleError && (
              <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                {googleError}
              </div>
            )}

            {/* Opsi 1: Direct OAuth browser */}
            <div className="mb-5">
              <button
                type="button"
                onClick={handleOAuthGoogle}
                disabled={googleLoading}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-black active:scale-[0.99] text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-2.5 shadow-md transition disabled:opacity-60"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                {googleLoading ? 'Menghubungkan...' : 'Lanjutkan dengan Google OAuth (Browser)'}
              </button>
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-white px-2 text-slate-400 font-semibold tracking-wider">
                  atau masuk langsung dengan Email Gmail
                </span>
              </div>
            </div>

            {/* Opsi 2: Masuk Langsung dengan Email Gmail */}
            <form onSubmit={handleGmailLogin} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Email Gmail:
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={gmailEmail}
                    onChange={(e) => setGmailEmail(e.target.value)}
                    placeholder="namaanda@gmail.com"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-slate-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Pengguna (Opsional):
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={gmailName}
                    onChange={(e) => setGmailName(e.target.value)}
                    placeholder="Tri HomyCare"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={googleLoading}
                  className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 active:scale-[0.99] text-white rounded-xl font-semibold text-sm shadow-md shadow-brand-500/20 flex items-center justify-center gap-2 transition disabled:opacity-70"
                >
                  {googleLoading ? 'Memproses Akun...' : 'Masuk Sekarang dengan Gmail'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
