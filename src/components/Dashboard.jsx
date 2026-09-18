import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useInvoice } from '../context/InvoiceContext';
import { formatRupiah, formatDateIndo } from '../utils/currency';
import { 
  DollarSign, 
  CheckCircle, 
  Clock, 
  FileText, 
  Send, 
  ArrowUpRight, 
  Plus, 
  Building2, 
  Printer, 
  Eye, 
  Check,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Dashboard({ setActiveTab, onOpenCreate, onPreviewDocument }) {
  const { session } = useAuth();
  const { invoices, quotations, updateInvoice, convertQuotationToInvoice } = useInvoice();

  // Metrics calculation
  const totalInvoiceValue = invoices.reduce((acc, curr) => acc + (Number(curr.grandTotal) || 0), 0);
  const paidInvoiceValue = invoices
    .filter(i => i.status === 'PAID')
    .reduce((acc, curr) => acc + (Number(curr.grandTotal) || 0), 0);
  const unpaidInvoices = invoices.filter(i => i.status === 'UNPAID');
  const unpaidInvoiceValue = unpaidInvoices.reduce((acc, curr) => acc + (Number(curr.grandTotal) || 0), 0);

  const totalQuotationValue = quotations.reduce((acc, curr) => acc + (Number(curr.grandTotal) || 0), 0);
  const acceptedQuotations = quotations.filter(q => q.status === 'ACCEPTED');

  const handleMarkAsPaid = (e, inv) => {
    e.stopPropagation();
    updateInvoice(inv.id, { status: 'PAID' });
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 }
    });
  };

  const handleConvert = (e, quoteId) => {
    e.stopPropagation();
    const newInv = convertQuotationToInvoice(quoteId);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    alert(`Berhasil! Penawaran berhasil dikonversi menjadi Invoice nomor: ${newInv.number}`);
  };

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-brand-700 via-brand-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-brand-500/15">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold mb-3 border border-white/20">
            <Building2 className="w-3.5 h-3.5" />
            <span>Format Aktif: <strong>INV-{session?.companyCode}-{new Date().getFullYear()}-XXXXXX</strong></span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Selamat Datang, {session?.userName} 👋
          </h2>
          <p className="mt-2 text-brand-100 text-xs sm:text-sm leading-relaxed">
            Kelola tagihan invoice dan surat penawaran harga perusahaan <strong>{session?.companyName}</strong> secara terintegrasi dengan penomoran akronim otomatis.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => onOpenCreate('INV')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-brand-700 hover:bg-brand-50 active:scale-95 rounded-xl text-xs font-bold shadow transition"
            >
              <Plus className="w-4 h-4" />
              Buat Invoice Baru
            </button>
            <button
              onClick={() => onOpenCreate('QUO')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-800/80 hover:bg-brand-900/80 text-white active:scale-95 rounded-xl text-xs font-semibold border border-white/20 transition"
            >
              <Send className="w-3.5 h-3.5" />
              Buat Penawaran Baru
            </button>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute right-0 bottom-0 top-0 w-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -right-6 -bottom-8 opacity-15 pointer-events-none hidden lg:block">
          <FileText className="w-64 h-64 text-white" />
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Invoice */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Nilai Tagihan</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-lg font-extrabold text-slate-900">{formatRupiah(totalInvoiceValue)}</div>
            <div className="mt-1 text-[11px] text-slate-400 font-medium">
              Dari {invoices.length} invoice dibuat
            </div>
          </div>
        </div>

        {/* Card 2: Invoice Lunas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Terbayar (Lunas)</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-lg font-extrabold text-emerald-600">{formatRupiah(paidInvoiceValue)}</div>
            <div className="mt-1 text-[11px] text-slate-400 font-medium">
              {invoices.filter(i => i.status === 'PAID').length} tagihan telah lunas
            </div>
          </div>
        </div>

        {/* Card 3: Menunggu Pembayaran */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Menunggu Pembayaran</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-lg font-extrabold text-amber-600">{formatRupiah(unpaidInvoiceValue)}</div>
            <div className="mt-1 text-[11px] text-slate-400 font-medium">
              {unpaidInvoices.length} tagihan belum dibayar
            </div>
          </div>
        </div>

        {/* Card 4: Penawaran Harga */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Penawaran Aktif</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-lg font-extrabold text-slate-900">{formatRupiah(totalQuotationValue)}</div>
            <div className="mt-1 text-[11px] text-slate-400 font-medium">
              {acceptedQuotations.length} dari {quotations.length} disetujui klien
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Section: Recent Invoices & Recent Quotations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Invoices */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-600" />
              <h3 className="font-bold text-slate-800 text-sm">Invoice Terbaru</h3>
            </div>
            <button
              onClick={() => setActiveTab('invoices')}
              className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-0.5"
            >
              Lihat Semua <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {invoices.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Belum ada invoice dibuat. Klik tombol di atas untuk membuat.
              </div>
            ) : (
              invoices.slice(0, 4).map((inv) => (
                <div 
                  key={inv.id} 
                  className="py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/70 rounded-xl px-2 transition cursor-pointer"
                  onClick={() => onPreviewDocument(inv)}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-brand-700">{inv.number}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        inv.status === 'PAID' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : inv.status === 'UNPAID' 
                          ? 'bg-amber-100 text-amber-700' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {inv.status === 'PAID' ? 'LUNAS' : inv.status === 'UNPAID' ? 'BELUM BAYAR' : inv.status}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-slate-800 truncate mt-0.5">
                      {inv.client?.name || 'Klien Umum'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Jatuh tempo: {formatDateIndo(inv.dueDate)}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-slate-900">
                      {formatRupiah(inv.grandTotal)}
                    </div>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      {inv.status !== 'PAID' && (
                        <button
                          onClick={(e) => handleMarkAsPaid(e, inv)}
                          title="Tandai Sudah Lunas"
                          className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold transition flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" /> Lunas
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPreviewDocument(inv);
                        }}
                        title="Lihat / Cetak"
                        className="p-1 text-slate-400 hover:text-slate-600 rounded"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Quotations */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-cyan-600" />
              <h3 className="font-bold text-slate-800 text-sm">Penawaran Harga Terbaru</h3>
            </div>
            <button
              onClick={() => setActiveTab('quotations')}
              className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-0.5"
            >
              Lihat Semua <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {quotations.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Belum ada penawaran harga dibuat.
              </div>
            ) : (
              quotations.slice(0, 4).map((quo) => (
                <div 
                  key={quo.id} 
                  className="py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/70 rounded-xl px-2 transition cursor-pointer"
                  onClick={() => onPreviewDocument(quo)}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-cyan-700">{quo.number}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        quo.status === 'ACCEPTED' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : quo.status === 'SENT' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {quo.status === 'ACCEPTED' ? 'DISETUJUI' : quo.status === 'SENT' ? 'TERKIRIM' : quo.status}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-slate-800 truncate mt-0.5">
                      {quo.client?.name || 'Klien Umum'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Berlaku s/d: {formatDateIndo(quo.validUntil)}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-slate-900">
                      {formatRupiah(quo.grandTotal)}
                    </div>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      {quo.status !== 'ACCEPTED' ? (
                        <button
                          onClick={(e) => handleConvert(e, quo.id)}
                          title="Ubah Jadi Invoice Resmi"
                          className="px-2 py-0.5 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded text-[10px] font-bold transition flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" /> Konversi ke Inv
                        </button>
                      ) : (
                        <span className="text-[10px] text-emerald-600 font-semibold">
                          Sudah jadi Invoice
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPreviewDocument(quo);
                        }}
                        title="Lihat / Cetak"
                        className="p-1 text-slate-400 hover:text-slate-600 rounded"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
