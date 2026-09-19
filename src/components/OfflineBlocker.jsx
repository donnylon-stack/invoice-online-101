import React, { useState } from 'react';
import { WifiOff, CloudOff, RefreshCw, AlertTriangle, Wifi } from 'lucide-react';

export default function OfflineBlocker({ isOffline, isServerDown, message, onRetry }) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    if (onRetry) {
      try {
        await onRetry();
      } catch (e) {
        console.warn('Retry connection error:', e);
      }
    }
    setTimeout(() => setRetrying(false), 800);
  };

  if (!isOffline && !isServerDown) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[999] bg-slate-950/90 backdrop-blur-lg flex items-center justify-center p-4 sm:p-6 no-print select-none animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 text-white max-w-md w-full rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6 relative overflow-hidden">
        {/* Glow accents */}
        <div className="absolute -top-16 -left-16 w-36 h-36 bg-red-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Icon */}
        <div className="relative mx-auto w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center shadow-inner">
          {isOffline ? (
            <WifiOff className="w-10 h-10 text-red-400 animate-pulse" />
          ) : (
            <CloudOff className="w-10 h-10 text-amber-400 animate-pulse" />
          )}
        </div>

        {/* Text */}
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-[11px] font-bold tracking-wider uppercase">
            <AlertTriangle className="w-3.5 h-3.5" />
            100% Mode Online Wajib
          </span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            {isOffline ? 'Koneksi Internet Terputus' : 'Server Tidak Terjangkau'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Aplikasi <strong>Invoice Online 101</strong> beroperasi <strong>100% online</strong> demi keamanan dan keabsahan data keuangan. Seluruh pembuatan invoice, surat penawaran, dan data transaksi mewajibkan koneksi aktif ke server database.
          </p>
        </div>

        {/* Status Indicators */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4 text-xs space-y-2.5 text-left">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-2">
              <Wifi className="w-4 h-4 text-slate-500" /> Jaringan Perangkat:
            </span>
            <span className={`font-semibold flex items-center gap-1.5 ${isOffline ? 'text-red-400' : 'text-emerald-400'}`}>
              <span className={`w-2 h-2 rounded-full ${isOffline ? 'bg-red-400' : 'bg-emerald-400'}`} />
              {isOffline ? 'Offline (Terputus)' : 'Online (Terhubung)'}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-slate-700/60 pt-2.5">
            <span className="text-slate-400 flex items-center gap-2">
              <CloudOff className="w-4 h-4 text-slate-500" /> Server Database Cloud:
            </span>
            <span className={`font-semibold flex items-center gap-1.5 ${isServerDown ? 'text-amber-400' : 'text-emerald-400'}`}>
              <span className={`w-2 h-2 rounded-full ${isServerDown ? 'bg-amber-400' : 'bg-emerald-400'}`} />
              {isServerDown ? 'Tidak Terjangkau' : 'Tersambung Aktif'}
            </span>
          </div>
        </div>

        {message && (
          <p className="text-[11px] text-slate-500 font-mono bg-slate-950/40 py-1.5 px-3 rounded-lg border border-slate-800 truncate" title={message}>
            Info: {message}
          </p>
        )}

        {/* Retry Action */}
        <div className="pt-1">
          <button
            type="button"
            onClick={handleRetry}
            disabled={retrying}
            className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-500 active:scale-98 disabled:opacity-50 text-white rounded-xl font-bold text-xs sm:text-sm shadow-lg shadow-brand-500/25 transition flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} />
            <span>{retrying ? 'Memeriksa Server...' : 'Hubungkan Ulang Sekarang'}</span>
          </button>
          <p className="text-[11px] text-slate-500 mt-2.5">
            Sistem otomatis memeriksa koneksi berkala setiap beberapa detik.
          </p>
        </div>
      </div>
    </div>
  );
}
