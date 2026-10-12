import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Send, 
  Users, 
  Settings, 
  Plus, 
  Sparkles, 
  Package,
  Building2,
  Crown
} from 'lucide-react';
import { useInvoice } from '../context/InvoiceContext';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ activeTab, setActiveTab, onOpenCreate }) {
  const { session, companies } = useAuth();
  const { invoices, quotations, clients, catalogItems } = useInvoice();

  const unpaidCount = invoices.filter(i => i.status === 'UNPAID').length;
  const pendingQuoteCount = quotations.filter(q => q.status === 'SENT' || q.status === 'DRAFT').length;

  const baseMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'invoices', label: 'Daftar Invoice', icon: FileText, badge: unpaidCount > 0 ? unpaidCount : null, badgeColor: 'bg-amber-500' },
    { id: 'quotations', label: 'Penawaran Harga', icon: Send, badge: pendingQuoteCount > 0 ? pendingQuoteCount : null, badgeColor: 'bg-cyan-500' },
    { id: 'items', label: 'Barang & Jasa', icon: Package, count: catalogItems?.length || 0 },
    { id: 'clients', label: 'Daftar Klien', icon: Users, count: clients.length },
    { id: 'settings', label: 'Profil Perusahaan', icon: Settings },
  ];

  const menuItems = session?.isSuperAdmin
    ? [
        { 
          id: 'companies', 
          label: 'Kelola Perusahaan', 
          icon: Building2, 
          count: companies?.length || 0,
          isSuperAdminItem: true 
        },
        ...baseMenuItems
      ]
    : baseMenuItems;

  return (
    <aside className="hidden md:flex md:w-64 bg-white border-r border-slate-200/80 p-4 flex-col justify-between shrink-0 no-print">
      <div className="space-y-6">
        
        {/* Quick Action Button for Mobile / Sidebar */}
        <div className="space-y-2">
          <button
            onClick={() => onOpenCreate('INV')}
            className="w-full py-2.5 px-3.5 bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 flex items-center justify-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            Buat Invoice Baru
          </button>
          <button
            onClick={() => onOpenCreate('QUO')}
            className="w-full py-2 px-3.5 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition"
          >
            <Send className="w-3.5 h-3.5 text-slate-500" />
            Buat Penawaran Baru
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Menu Utama
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive 
                    ? (item.isSuperAdminItem ? 'bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700 font-bold border border-indigo-200/60' : 'bg-brand-50 text-brand-700 font-bold') 
                    : (item.isSuperAdminItem ? 'text-indigo-950 bg-indigo-50/40 hover:bg-indigo-50 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900')
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? (item.isSuperAdminItem ? 'text-indigo-600' : 'text-brand-600') : (item.isSuperAdminItem ? 'text-indigo-500' : 'text-slate-400')}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge !== null && (
                  <span className={`text-[10px] text-white px-2 py-0.5 rounded-full font-bold ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
                {item.count !== undefined && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    item.isSuperAdminItem ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* PWA / Offline Status Info Card */}
      <div className="mt-6 p-3.5 bg-gradient-to-br from-slate-900 to-brand-950 rounded-2xl text-white text-xs">
        <div className="flex items-center gap-2 text-brand-300 font-bold mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>PWA Standalone</span>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          Semua invoice & penawaran tersimpan otomatis secara lokal dan dapat dibuka saat offline.
        </p>
      </div>
    </aside>
  );
}
