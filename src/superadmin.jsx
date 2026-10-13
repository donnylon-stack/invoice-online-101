import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider, useAuth } from './context/AuthContext';
import { InvoiceProvider } from './context/InvoiceContext';
import SuperAdminLogin from './components/SuperAdminLogin';
import SuperAdminConsole from './components/SuperAdminConsole';
import { ShieldAlert, LogOut, ArrowLeft, Building2 } from 'lucide-react';
import './index.css';

function SuperAdminRoot() {
  const { session, isAuthenticated, isSuperadmin, logout } = useAuth();

  // Jika belum login atau bukan superadmin, tampilkan halaman login Superadmin
  if (!isAuthenticated || !isSuperadmin) {
    return (
      <SuperAdminLogin 
        onBack={() => {
          window.location.href = './index.html';
        }} 
      />
    );
  }

  // Jika sudah login sebagai Super Admin, tampilkan konsol khusus Super Admin
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Superadmin Dedicated Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-amber-500/20 shadow-lg px-4 sm:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-amber-500 to-amber-600 rounded-xl text-slate-950 font-bold shadow-md shadow-amber-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white tracking-tight text-base sm:text-lg">
                  Invoice Online <span className="text-amber-400">101</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-[10px] uppercase tracking-wider">
                  Root Console
                </span>
              </div>
              <p className="text-[10px] text-slate-400 -mt-0.5 hidden sm:block">
                Hanya CRUD Perusahaan, Manajemen User, & Kontrol Aktivasi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-amber-300">{session?.userName || 'Super Admin Tri'}</div>
              <div className="text-[10px] text-slate-400 font-mono">@{session?.username || 'superadmintri'}</div>
            </div>

            <button
              onClick={() => {
                logout();
              }}
              className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
              title="Keluar dari Console Super Admin"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Console Stage */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <SuperAdminConsole />
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <InvoiceProvider>
        <SuperAdminRoot />
      </InvoiceProvider>
    </AuthProvider>
  </React.StrictMode>
);
