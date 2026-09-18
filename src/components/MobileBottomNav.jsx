import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Send, 
  Plus, 
  Menu as MenuIcon, 
  Package, 
  Users, 
  Settings, 
  X, 
  LogOut, 
  Download,
  Building2,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useInvoice } from '../context/InvoiceContext';

export default function MobileBottomNav({ activeTab, setActiveTab, onOpenCreate }) {
  const { session, logout } = useAuth();
  const { invoices, quotations, clients, catalogItems, cloudStatus, syncWithCloud } = useInvoice();

  const [showMenuDrawer, setShowMenuDrawer] = useState(false);
  const [showCreateSheet, setShowCreateSheet] = useState(false);

  const unpaidCount = invoices.filter(i => i.status === 'UNPAID').length;
  const pendingQuoteCount = quotations.filter(q => q.status === 'SENT' || q.status === 'DRAFT').length;

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setShowMenuDrawer(false);
    setShowCreateSheet(false);
  };

  return (
    <>
      {/* ===================================== */}
      {/* 1. FIXED BOTTOM NAVIGATION BAR        */}
      {/* ===================================== */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 flex items-center justify-around no-print safe-area-pb">
        {/* Tab 1: Dashboard */}
        <button
          type="button"
          onClick={() => handleTabClick('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition ${
            activeTab === 'dashboard' 
              ? 'text-brand-600 font-bold' 
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <LayoutDashboard className={`w-5 h-5 ${activeTab === 'dashboard' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-1 tracking-tight">Beranda</span>
        </button>

        {/* Tab 2: Invoices */}
        <button
          type="button"
          onClick={() => handleTabClick('invoices')}
          className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition ${
            activeTab === 'invoices' 
              ? 'text-brand-600 font-bold' 
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <div className="relative">
            <FileText className={`w-5 h-5 ${activeTab === 'invoices' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            {unpaidCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full min-w-[16px] text-center shadow-sm">
                {unpaidCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Invoice</span>
        </button>

        {/* Center: Plus Floating Button */}
        <div className="relative -top-3">
          <button
            type="button"
            onClick={() => setShowCreateSheet(true)}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 active:scale-90 text-white shadow-lg shadow-brand-500/35 flex items-center justify-center transition"
            aria-label="Buat Dokumen Baru"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Tab 3: Quotations */}
        <button
          type="button"
          onClick={() => handleTabClick('quotations')}
          className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition ${
            activeTab === 'quotations' 
              ? 'text-brand-600 font-bold' 
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <div className="relative">
            <Send className={`w-5 h-5 ${activeTab === 'quotations' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            {pendingQuoteCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-cyan-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full min-w-[16px] text-center shadow-sm">
                {pendingQuoteCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Penawaran</span>
        </button>

        {/* Tab 4: More / Menu Drawer */}
        <button
          type="button"
          onClick={() => setShowMenuDrawer(true)}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition ${
            ['items', 'clients', 'settings'].includes(activeTab) || showMenuDrawer
              ? 'text-brand-600 font-bold' 
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <MenuIcon className="w-5 h-5 stroke-2" />
          <span className="text-[10px] mt-1 tracking-tight">Menu</span>
        </button>
      </div>

      {/* ===================================== */}
      {/* 2. BOTTOM SHEET: QUICK CREATE MODAL   */}
      {/* ===================================== */}
      {showCreateSheet && (
        <div 
          className="md:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex flex-col justify-end animate-fadeIn"
          onClick={() => setShowCreateSheet(false)}
        >
          <div 
            className="bg-white rounded-t-3xl p-5 shadow-2xl space-y-4 animate-slideUp safe-area-pb"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Buat Dokumen Baru</h3>
                  <p className="text-[11px] text-slate-500">Pilih jenis dokumen yang ingin dibuat</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCreateSheet(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowCreateSheet(false);
                  onOpenCreate('INV');
                }}
                className="p-3.5 bg-brand-50 hover:bg-brand-100/80 active:scale-[0.98] border border-brand-200 rounded-2xl flex items-center gap-3.5 text-left transition"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-brand-900">Faktur Invoice Penagihan</div>
                  <div className="text-[11px] text-brand-700/80 mt-0.5">Penomoran otomatis INV-{session?.companyCode}-{new Date().getFullYear()}-XXXXXX</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowCreateSheet(false);
                  onOpenCreate('QUO');
                }}
                className="p-3.5 bg-cyan-50 hover:bg-cyan-100/80 active:scale-[0.98] border border-cyan-200 rounded-2xl flex items-center gap-3.5 text-left transition"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Send className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-cyan-950">Surat Penawaran Harga</div>
                  <div className="text-[11px] text-cyan-700 mt-0.5">Format penawaran QUO-{session?.companyCode}-{new Date().getFullYear()}-XXXXXX</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================== */}
      {/* 3. MOBILE MENU DRAWER (SLIDE-UP)      */}
      {/* ===================================== */}
      {showMenuDrawer && (
        <div 
          className="md:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex flex-col justify-end animate-fadeIn"
          onClick={() => setShowMenuDrawer(false)}
        >
          <div 
            className="bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto p-5 shadow-2xl space-y-5 animate-slideUp safe-area-pb"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Drawer */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-extrabold text-sm shadow-md">
                  {session?.companyCode || 'IO'}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">{session?.companyName}</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">{session?.userName} ({session?.userRole || 'Staff'})</p>
                </div>
              </div>
              <button 
                onClick={() => setShowMenuDrawer(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cloud Sync Status Pill on Mobile */}
            <div 
              onClick={() => {
                syncWithCloud();
              }}
              className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between cursor-pointer active:bg-slate-100 transition"
            >
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${cloudStatus?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <div>
                  <div className="text-xs font-bold text-slate-800">Status Server Cloud</div>
                  <div className="text-[10px] text-slate-500">{cloudStatus?.message || 'Tersinkronisasi'}</div>
                </div>
              </div>
              <RefreshCw className={`w-4 h-4 text-brand-600 ${cloudStatus?.syncing ? 'animate-spin' : ''}`} />
            </div>

            {/* Secondary Navigation Menu */}
            <div className="space-y-1.5">
              <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Menu Manajemen
              </div>

              <button
                type="button"
                onClick={() => handleTabClick('items')}
                className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-semibold transition ${
                  activeTab === 'items' 
                    ? 'bg-brand-50 text-brand-700 font-bold border border-brand-200' 
                    : 'text-slate-700 hover:bg-slate-50 border border-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Package className="w-4 h-4" />
                  </div>
                  <span>Master Barang & Jasa (Katalog)</span>
                </div>
                <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">
                  {catalogItems?.length || 0}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleTabClick('clients')}
                className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-semibold transition ${
                  activeTab === 'clients' 
                    ? 'bg-brand-50 text-brand-700 font-bold border border-brand-200' 
                    : 'text-slate-700 hover:bg-slate-50 border border-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <span>Buku Kontak Pelanggan / Klien</span>
                </div>
                <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">
                  {clients?.length || 0}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleTabClick('settings')}
                className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-semibold transition ${
                  activeTab === 'settings' 
                    ? 'bg-brand-50 text-brand-700 font-bold border border-brand-200' 
                    : 'text-slate-700 hover:bg-slate-50 border border-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                    <Settings className="w-4 h-4" />
                  </div>
                  <span>Pengaturan Kop Surat & Rekening</span>
                </div>
              </button>
            </div>

            {/* Logout Button */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={logout}
                className="w-full py-3 px-4 rounded-2xl bg-red-50 hover:bg-red-100 active:scale-[0.99] text-red-700 text-xs font-bold flex items-center justify-center gap-2 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar dari Akun Perusahaan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
