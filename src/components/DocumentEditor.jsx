import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useInvoice } from '../context/InvoiceContext';
import { formatRupiah } from '../utils/currency';
import { 
  X, 
  Plus, 
  Trash2, 
  Save, 
  Sparkles, 
  Building2, 
  Calendar, 
  CreditCard,
  UserCheck,
  Package,
  Layers
} from 'lucide-react';

export default function DocumentEditor({ type = 'INV', initialData = null, onClose, onSaveSuccess }) {
  const { session } = useAuth();
  const { clients, catalogItems, getNextNumber, createInvoice, updateInvoice, createQuotation, updateQuotation } = useInvoice();

  const isEdit = !!initialData;
  const isQuotation = type === 'QUO';

  // Next number preview
  const nextInfo = getNextNumber(type);

  // Form states
  const [docNumber, setDocNumber] = useState(
    initialData?.number || nextInfo.documentNumber
  );
  const [issueDate, setIssueDate] = useState(
    initialData?.issueDate || new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState(
    initialData?.dueDate || initialData?.validUntil || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [status, setStatus] = useState(
    initialData?.status || (isQuotation ? 'SENT' : 'UNPAID')
  );

  // Client states
  const [selectedClientId, setSelectedClientId] = useState(initialData?.client?.id || '');
  const [clientName, setClientName] = useState(initialData?.client?.name || '');
  const [clientContact, setClientContact] = useState(initialData?.client?.contactPerson || '');
  const [clientEmail, setClientEmail] = useState(initialData?.client?.email || '');
  const [clientPhone, setClientPhone] = useState(initialData?.client?.phone || '');
  const [clientAddress, setClientAddress] = useState(initialData?.client?.address || '');

  // Line items state
  const [items, setItems] = useState(
    initialData?.items || [
      { id: '1', description: 'Jasa Konsultasi & Layanan IT Sistem', qty: 1, unit: 'Bulan', price: 5000000, discount: 0, total: 5000000 }
    ]
  );

  // Taxes and global discounts
  const [taxPercent, setTaxPercent] = useState(initialData?.taxPercent !== undefined ? initialData.taxPercent : 11);
  const [discountPercent, setDiscountPercent] = useState(initialData?.discountPercent || 0);
  const [notes, setNotes] = useState(
    initialData?.notes || (isQuotation 
      ? 'Penawaran ini berlaku selama 14 hari kalender sejak tanggal diterbitkan.' 
      : 'Terima kasih atas kerja samanya. Mohon konfirmasi bukti transfer.')
  );
  const [paymentTerms, setPaymentTerms] = useState(
    initialData?.paymentTerms || (session?.bankInfo 
      ? `Transfer Bank ${session.bankInfo.bankName} No. Rek: ${session.bankInfo.accountNumber} a.n ${session.bankInfo.accountHolder}`
      : 'Transfer Bank BCA No. Rekening: 123-456-7890 a.n ' + session?.companyName)
  );

  // When selecting existing client
  const handleClientSelect = (clientId) => {
    setSelectedClientId(clientId);
    const found = clients.find(c => c.id === clientId);
    if (found) {
      setClientName(found.name);
      setClientContact(found.contactPerson || '');
      setClientEmail(found.email || '');
      setClientPhone(found.phone || '');
      setClientAddress(found.address || '');
    }
  };

  // Item handlers
  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      { id: String(Date.now()), description: '', qty: 1, unit: 'Unit', price: 0, discount: 0, total: 0 }
    ]);
  };

  const handleRemoveItem = (id) => {
    if (items.length <= 1) {
      alert('Minimal harus ada 1 baris item');
      return;
    }
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleItemChange = (id, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        // Recalculate line total
        const qty = Number(updated.qty) || 0;
        const price = Number(updated.price) || 0;
        const discount = Number(updated.discount) || 0;
        const gross = qty * price;
        const lineDiscount = (gross * discount) / 100;
        updated.total = Math.max(0, gross - lineDiscount);
        return updated;
      }
      return item;
    }));
  };

  const handleSelectCatalogItem = (catalogItemId) => {
    if (!catalogItemId) return;
    const catItem = catalogItems.find(c => c.id === catalogItemId);
    if (!catItem) return;

    setItems(prev => {
      // If only 1 item and it's empty, replace it
      if (prev.length === 1 && !prev[0].description.trim() && prev[0].price === 0) {
        return [{
          id: prev[0].id,
          description: catItem.name,
          qty: 1,
          unit: catItem.unit || 'Unit',
          price: catItem.price,
          discount: 0,
          total: catItem.price
        }];
      }
      return [
        ...prev,
        {
          id: String(Date.now()),
          description: catItem.name,
          qty: 1,
          unit: catItem.unit || 'Unit',
          price: catItem.price,
          discount: 0,
          total: catItem.price
        }
      ];
    });
  };

  // Calculations
  const subtotal = items.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
  const discountAmount = (subtotal * (Number(discountPercent) || 0)) / 100;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = (taxableAmount * (Number(taxPercent) || 0)) / 100;
  const grandTotal = taxableAmount + taxAmount;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!clientName.trim()) {
      alert('Mohon isi nama klien / pelanggan.');
      return;
    }

    const payload = {
      number: docNumber,
      companyCode: session?.companyCode || 'IO101',
      companyName: session?.companyName || 'Perusahaan',
      issueDate,
      status,
      client: {
        id: selectedClientId || 'client-custom-' + Date.now(),
        name: clientName,
        contactPerson: clientContact,
        email: clientEmail,
        phone: clientPhone,
        address: clientAddress
      },
      items,
      subtotal,
      discountPercent: Number(discountPercent) || 0,
      discountAmount,
      taxPercent: Number(taxPercent) || 0,
      taxAmount,
      grandTotal,
      notes,
      paymentTerms
    };

    if (isQuotation) {
      payload.validUntil = dueDate;
      if (isEdit) {
        updateQuotation(initialData.id, payload);
      } else {
        createQuotation(payload);
      }
    } else {
      payload.dueDate = dueDate;
      if (isEdit) {
        updateInvoice(initialData.id, payload);
      } else {
        createInvoice(payload);
      }
    }

    onSaveSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm overflow-y-auto flex items-start justify-center p-0 sm:p-4 md:p-6 no-print">
      <div className="bg-white w-full max-w-4xl rounded-none sm:rounded-2xl shadow-2xl border-0 sm:border border-slate-200 overflow-hidden min-h-screen sm:min-h-0 sm:my-auto flex flex-col">
        
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className={`p-1.5 sm:p-2 rounded-xl text-white font-bold text-[10px] sm:text-xs ${isQuotation ? 'bg-cyan-600' : 'bg-brand-600'}`}>
              {isQuotation ? 'PENAWARAN' : 'INVOICE'}
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-800">
                {isEdit ? `Edit ${isQuotation ? 'Penawaran' : 'Invoice'}` : `Buat ${isQuotation ? 'Penawaran' : 'Invoice Baru'}`}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 font-mono">
                No: <strong>{docNumber}</strong> ({session?.companyCode})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 flex-1 overflow-y-auto">
          
          {/* Metadata Row: No Dokumen, Tanggal, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200/70">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Nomor Dokumen
              </label>
              <input
                type="text"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg text-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Tanggal Terbit
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                {isQuotation ? 'Berlaku Hingga' : 'Jatuh Tempo'}
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>
          </div>

          {/* Client Information */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-brand-600" />
                Informasi Klien / Pelanggan
              </span>

              {/* Quick Select Existing Client */}
              {clients.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500">Pilih dari kontak:</span>
                  <select
                    value={selectedClientId}
                    onChange={(e) => handleClientSelect(e.target.value)}
                    className="text-xs py-1 px-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 focus:outline-none"
                  >
                    <option value="">-- Ketik Baru / Pilih --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nama Perusahaan / Klien *</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Contoh: PT Gemilang Kreasi Nusantara"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">PIC / Kontak Person</label>
                <input
                  type="text"
                  value={clientContact}
                  onChange={(e) => setClientContact(e.target.value)}
                  placeholder="Nama PIC penerima tagihan"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Email Klien</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="email@klien.com"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nomor Telepon / WhatsApp</label>
                <input
                  type="text"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="0812-xxxx-xxxx"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Alamat Penagihan</label>
                <textarea
                  rows={2}
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  placeholder="Alamat kantor klien..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-brand-600" />
                Rincian Barang / Jasa
              </span>
              
              <div className="flex items-center gap-2">
                {/* Quick Catalog Selector */}
                {catalogItems.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        handleSelectCatalogItem(e.target.value);
                        e.target.value = '';
                      }}
                      className="py-1 px-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-semibold rounded-lg transition focus:outline-none"
                    >
                      <option value="">+ Pilih dari Katalog...</option>
                      {catalogItems.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          [{cat.type === 'BARANG' ? 'Barang' : 'Jasa'}] {cat.name} ({formatRupiah(cat.price)}/{cat.unit})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold rounded-lg transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Baris Kosong
                </button>
              </div>
            </div>

            {/* Mobile View: Cards for Items (md:hidden) */}
            <div className="md:hidden space-y-3">
              {items.map((item, index) => (
                <div key={item.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500">Item #{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                      title="Hapus baris"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">Deskripsi Item / Jasa *</label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                      placeholder="Nama item / deskripsi pekerjaan"
                      className="w-full p-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">Qty</label>
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => handleItemChange(item.id, 'qty', e.target.value)}
                        className="w-full p-2 text-xs text-center bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">Satuan</label>
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                        placeholder="Unit / Pcs / Bln"
                        className="w-full p-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">Harga Satuan (Rp) *</label>
                      <input
                        type="number"
                        min="0"
                        value={item.price}
                        onChange={(e) => handleItemChange(item.id, 'price', e.target.value)}
                        className="w-full p-2 text-xs text-right font-mono bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">Diskon (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={item.discount}
                        onChange={(e) => handleItemChange(item.id, 'discount', e.target.value)}
                        className="w-full p-2 text-xs text-center bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">Subtotal Item:</span>
                    <span className="font-mono font-bold text-slate-900 text-xs">{formatRupiah(item.total)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Table (hidden md:block) */}
            <div className="hidden md:block overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Deskripsi Barang / Jasa</th>
                    <th className="py-2.5 px-2 w-20 text-center">Qty</th>
                    <th className="py-2.5 px-2 w-20">Satuan</th>
                    <th className="py-2.5 px-3 w-36">Harga Satuan</th>
                    <th className="py-2.5 px-2 w-20 text-center">Disc %</th>
                    <th className="py-2.5 px-3 w-36 text-right">Total</th>
                    <th className="py-2.5 px-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                          placeholder="Nama item / deskripsi pekerjaan"
                          className="w-full p-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-brand-500"
                          required
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => handleItemChange(item.id, 'qty', e.target.value)}
                          className="w-full p-1.5 text-xs text-center border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-brand-500"
                          required
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                          placeholder="Pcs/Bln"
                          className="w-full p-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          value={item.price}
                          onChange={(e) => handleItemChange(item.id, 'price', e.target.value)}
                          className="w-full p-1.5 text-xs text-right border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-brand-500"
                          required
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discount}
                          onChange={(e) => handleItemChange(item.id, 'discount', e.target.value)}
                          className="w-full p-1.5 text-xs text-center border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                      </td>
                      <td className="p-2 text-right font-mono font-semibold text-slate-800">
                        {formatRupiah(item.total)}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1 text-slate-300 hover:text-red-600 rounded transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Calculations & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Notes & Bank Details */}
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Catatan / Syarat Ketentuan
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-brand-600" />
                  Instruksi Rekening Bank
                </label>
                <textarea
                  rows={2}
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono text-[11px]"
                />
              </div>
            </div>

            {/* Subtotal, Tax, Grand Total Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Item:</span>
                <span className="font-mono font-semibold text-slate-900">{formatRupiah(subtotal)}</span>
              </div>

              {/* Discount */}
              <div className="flex items-center justify-between text-slate-600">
                <div className="flex items-center gap-2">
                  <span>Diskon Tambahan:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(e.target.value)}
                      className="w-12 px-1.5 py-0.5 text-xs text-center border border-slate-300 rounded bg-white"
                    />
                    <span>%</span>
                  </div>
                </div>
                <span className="font-mono text-red-600">-{formatRupiah(discountAmount)}</span>
              </div>

              {/* PPN Tax */}
              <div className="flex items-center justify-between text-slate-600">
                <div className="flex items-center gap-2">
                  <span>PPN:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={taxPercent}
                      onChange={(e) => setTaxPercent(e.target.value)}
                      className="w-12 px-1.5 py-0.5 text-xs text-center border border-slate-300 rounded bg-white"
                    />
                    <span>%</span>
                  </div>
                </div>
                <span className="font-mono text-slate-900">+{formatRupiah(taxAmount)}</span>
              </div>

              <div className="border-t border-slate-200 pt-2 flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-900">Total Akhir:</span>
                <span className="text-lg font-black text-brand-700 font-mono">
                  {formatRupiah(grandTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-500/20 flex items-center gap-2 transition"
            >
              <Save className="w-4 h-4" />
              {isEdit ? 'Simpan Perubahan' : `Terbitkan ${isQuotation ? 'Penawaran' : 'Invoice'}`}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
