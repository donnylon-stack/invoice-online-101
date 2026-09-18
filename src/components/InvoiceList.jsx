import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useInvoice } from '../context/InvoiceContext';
import { formatRupiah, formatDateIndo } from '../utils/currency';
import { 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Printer, 
  Eye, 
  Edit, 
  Trash2, 
  Check, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Calendar,
  XCircle 
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function InvoiceList({ onOpenCreate, onPreviewDocument, onEditDocument }) {
  const { session } = useAuth();
  const { invoices, updateInvoice, deleteInvoice } = useInvoice();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [periodPreset, setPeriodPreset] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handlePeriodPreset = (preset) => {
    setPeriodPreset(preset);
    const now = new Date();
    if (preset === 'ALL') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'THIS_MONTH') {
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
      setStartDate(`${y}-${m}-01`);
      setEndDate(`${y}-${m}-${String(lastDay).padStart(2, '0')}`);
    } else if (preset === 'LAST_MONTH') {
      const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const y = prevMonthDate.getFullYear();
      const m = String(prevMonthDate.getMonth() + 1).padStart(2, '0');
      const lastDay = new Date(y, prevMonthDate.getMonth() + 1, 0).getDate();
      setStartDate(`${y}-${m}-01`);
      setEndDate(`${y}-${m}-${String(lastDay).padStart(2, '0')}`);
    } else if (preset === 'THIS_YEAR') {
      const y = now.getFullYear();
      setStartDate(`${y}-01-01`);
      setEndDate(`${y}-12-31`);
    }
  };

  const handleCustomDateChange = (start, end) => {
    setStartDate(start);
    setEndDate(end);
    setPeriodPreset('CUSTOM');
  };

  const clearDateFilter = () => {
    setStartDate('');
    setEndDate('');
    setPeriodPreset('ALL');
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchSearch = 
      inv.number?.toLowerCase().includes(search.toLowerCase()) ||
      inv.client?.name?.toLowerCase().includes(search.toLowerCase());
    
    const matchStatus = filterStatus === 'ALL' || inv.status === filterStatus;

    const docDate = (inv.issueDate || inv.createdAt || '').split('T')[0];
    const matchStart = !startDate || (docDate && docDate >= startDate);
    const matchEnd = !endDate || (docDate && docDate <= endDate);

    return matchSearch && matchStatus && matchStart && matchEnd;
  });

  const handleTogglePaid = (e, inv) => {
    e.stopPropagation();
    const newStatus = inv.status === 'PAID' ? 'UNPAID' : 'PAID';
    updateInvoice(inv.id, { status: newStatus });
    if (newStatus === 'PAID') {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 }
      });
    }
  };

  const handleDelete = (e, id, number) => {
    e.stopPropagation();
    if (confirm(`Apakah Anda yakin ingin menghapus Invoice ${number}?`)) {
      deleteInvoice(id);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-600" />
            Daftar Faktur Invoice
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Format Penomoran: <strong className="font-mono text-brand-700">INV-{session?.companyCode}-{new Date().getFullYear()}-00000X</strong>
          </p>
        </div>

        <button
          onClick={() => onOpenCreate('INV')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          Buat Invoice Baru
        </button>
      </div>

      {/* Filter & Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nomor invoice / nama klien..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
            />
          </div>

          {/* Status Filters */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'ALL', label: 'Semua' },
              { id: 'UNPAID', label: 'Belum Bayar' },
              { id: 'PAID', label: 'Lunas' },
              { id: 'DRAFT', label: 'Draft' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  filterStatus === tab.id
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date Period Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2.5 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-500 text-[11px] font-semibold flex items-center gap-1 mr-1">
              <Calendar className="w-3.5 h-3.5 text-brand-600" />
              Periode:
            </span>
            {[
              { id: 'ALL', label: 'Semua Waktu' },
              { id: 'THIS_MONTH', label: 'Bulan Ini' },
              { id: 'LAST_MONTH', label: 'Bulan Lalu' },
              { id: 'THIS_YEAR', label: 'Tahun Ini' }
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePeriodPreset(p.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                  periodPreset === p.id
                    ? 'bg-brand-50 text-brand-700 border border-brand-200 font-bold'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleCustomDateChange(e.target.value, endDate)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:ring-1 focus:ring-brand-500"
              title="Dari Tanggal"
            />
            <span className="text-slate-400">s/d</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => handleCustomDateChange(startDate, e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:ring-1 focus:ring-brand-500"
              title="Sampai Tanggal"
            />
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={clearDateFilter}
                className="text-slate-400 hover:text-red-500 p-1"
                title="Hapus Filter Tanggal"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        
        {/* Mobile View: Card List (md:hidden) */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredInvoices.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Tidak ada invoice ditemukan.
            </div>
          ) : (
            filteredInvoices.map((inv) => (
              <div
                key={inv.id}
                onClick={() => onPreviewDocument(inv)}
                className="p-4 hover:bg-slate-50 active:bg-slate-100/80 transition cursor-pointer space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="font-mono font-bold text-brand-700 text-xs">{inv.number}</span>
                    <span className="text-[10px] text-slate-400 font-mono ml-1.5">[{inv.companyCode}]</span>
                  </div>
                  <button
                    onClick={(e) => handleTogglePaid(e, inv)}
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase transition ${
                      inv.status === 'PAID'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {inv.status === 'PAID' ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        LUNAS
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3 text-amber-600" />
                        BELUM BAYAR
                      </>
                    )}
                  </button>
                </div>

                <div>
                  <div className="text-xs font-bold text-slate-900 leading-snug">{inv.client?.name || 'Klien Umum'}</div>
                  {inv.client?.contactPerson && (
                    <div className="text-[11px] text-slate-500 mt-0.5">PIC: {inv.client.contactPerson}</div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <div>
                    <span>Jatuh tempo: </span>
                    <span className="font-medium text-slate-700">{formatDateIndo(inv.dueDate)}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-black text-slate-900 text-sm">{formatRupiah(inv.grandTotal)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onPreviewDocument(inv)}
                    className="px-3 py-1.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" /> Lihat / Cetak
                  </button>
                  <button
                    onClick={() => onEditDocument(inv)}
                    className="p-1.5 text-slate-600 hover:text-amber-600 bg-slate-50 hover:bg-amber-50 rounded-lg border border-slate-200/60"
                    title="Edit"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, inv.id, inv.number)}
                    className="p-1.5 text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 rounded-lg border border-slate-200/60"
                    title="Hapus"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Full Table (hidden md:block) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">No. Invoice</th>
                <th className="py-3 px-4">Klien</th>
                <th className="py-3 px-4">Tanggal Terbit</th>
                <th className="py-3 px-4">Jatuh Tempo</th>
                <th className="py-3 px-4 text-right">Total Tagihan</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Tidak ada invoice ditemukan.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr 
                    key={inv.id}
                    onClick={() => onPreviewDocument(inv)}
                    className="hover:bg-slate-50/70 transition cursor-pointer"
                  >
                    {/* Number */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-brand-700">{inv.number}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Kode: {inv.companyCode}</div>
                    </td>

                    {/* Client */}
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      <div>{inv.client?.name || 'Klien'}</div>
                      {inv.client?.contactPerson && (
                        <div className="text-[11px] text-slate-400 font-normal">PIC: {inv.client.contactPerson}</div>
                      )}
                    </td>

                    {/* Issue Date */}
                    <td className="py-3.5 px-4 text-slate-600">
                      {formatDateIndo(inv.issueDate)}
                    </td>

                    {/* Due Date */}
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {formatDateIndo(inv.dueDate)}
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      {formatRupiah(inv.grandTotal)}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={(e) => handleTogglePaid(e, inv)}
                        title="Klik untuk ubah status lunas"
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : inv.status === 'UNPAID'
                            ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {inv.status === 'PAID' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            LUNAS
                          </>
                        ) : inv.status === 'UNPAID' ? (
                          <>
                            <Clock className="w-3 h-3 text-amber-600" />
                            BELUM BAYAR
                          </>
                        ) : (
                          inv.status
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onPreviewDocument(inv)}
                          title="Lihat / Cetak"
                          className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEditDocument(inv)}
                          title="Edit"
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, inv.id, inv.number)}
                          title="Hapus"
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
