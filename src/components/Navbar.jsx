import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useInvoice } from '../context/InvoiceContext';
import { 
  LogOut, 
  Download, 
  Building, 
  User, 
  Menu, 
  X, 
  PlusCircle, 
  FileText, 
  Send,
  RefreshCw 
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenCreate }) {
  const { session, logout } = useAuth();
  const { cloudStatus, syncWithCloud } = useInvoice();
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
      setIsInstalled(true);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-sm no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Company Acronym */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
              <img src="/logo.jpg" alt="Logo" className="w-9 h-9 rounded-xl object-cover shadow-sm border border-slate-200" />
              <div>
                <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg flex items-center gap-1">
                  Invoice Online <span className="text-brand-600">101</span>
                </span>
                <span className="block text-[10px] text-slate-400 font-medium -mt-1 hidden sm:block">
                  SaaS Invoice & Quotation PWA
                </span>
              </div>
            </div>

            {/* Company Badge */}
            {session && (
              <div className="flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 bg-brand-50 border border-brand-200/60 rounded-full text-xs text-brand-800">
                <Building className="w-3.5 h-3.5 text-brand-600 hidden sm:inline" />
                <span className="hidden md:inline font-semibold truncate max-w-[140px]">{session.companyName}</span>
                <span className="bg-brand-600 text-white font-mono text-[10px] px-1.5 py-0.2 rounded font-bold">
                  {session.companyCode}
                </span>
              </div>
            )}

            {/* Cloud Connection Status */}
            <div 
              onClick={syncWithCloud}
              title={cloudStatus?.message || 'Klik untuk sinkronisasi data cloud'}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 cursor-pointer rounded-full text-[11px] text-slate-700 transition"
            >
              <span className={`w-2 h-2 rounded-full ${cloudStatus?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="font-medium">Cloud Online</span>
              {cloudStatus?.syncing && <RefreshCw className="w-3 h-3 text-brand-600 animate-spin" />}
            </div>
          </div>

          {/* Quick Create Buttons & PWA & User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Action Button */}
            <div className="relative inline-block text-left">
              <button
                type="button"
                onClick={() => onOpenCreate('INV')}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white rounded-lg text-xs font-semibold shadow-sm transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Buat Invoice
              </button>
            </div>
            
            <button
              type="button"
              onClick={() => onOpenCreate('QUO')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Buat Penawaran
            </button>

            {/* Install PWA Button */}
            {installPrompt && !isInstalled && (
              <button
                onClick={handleInstallClick}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold shadow-sm animate-pulse transition"
                title="Install Invoice Online 101 ke Perangkat (PWA)"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Install App</span>
              </button>
            )}

            {/* User Details & Logout */}
            <div className="flex items-center gap-2 border-l border-slate-200 pl-2 sm:pl-3">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-800 leading-tight">{session?.userName}</div>
                <div className="text-[10px] text-slate-400 leading-tight">{session?.companyName}</div>
              </div>
              <button
                onClick={logout}
                title="Keluar / Ganti Akun"
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
