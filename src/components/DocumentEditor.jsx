import React, { useState, useEffect, useRef } from 'react';
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
  Layers,
  Search,
  ShoppingCart,
  CheckCircle2,
  BookOpen,
  Wrench,
  Check
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

  // Catalog Popup Modal states
  const [catalogModalOpen, setCatalogModalOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogFilterType, setCatalogFilterType] = useState('ALL'); // ALL, BARANG, JASA
  const [toastMsg, setToastMsg] = useState('');
  const toastTimeoutRef = useRef(null);

  const handleAddFromCatalog = (catItem) => {
    let updatedQty = 1;

    setItems(prev => {
      // 1. Cek apakah item sudah ada di dalam list (berdasarkan catalogItemId atau nama & harga yang sama)
      const existingIndex = prev.findIndex(
        item => item.catalogItemId === catItem.id || (item.description === catItem.name && Number(item.price) === Number(catItem.price))
      );

      if (existingIndex !== -1) {
        // Klik ke-2, ke-3, dst -> tambah qty (+1 pcs)
        return prev.map((item, idx) => {
          if (idx === existingIndex) {
            const newQty = (Number(item.qty) || 0) + 1;
            updatedQty = newQty;
            const price = Number(item.price) || 0;
            const discount = Number(item.discount) || 0;
            const gross = newQty * price;
            const lineDiscount = (gross * discount) / 100;
            return {
              ...item,
              catalogItemId: catItem.id,
              qty: newQty,
              total: Math.max(0, gross - lineDiscount)
            };
          }
          return item;
        });
      }

      // 2. Jika baris pertama masih kosong/default, gantikan baris kosong tersebut
      if (prev.length === 1 && !prev[0].description.trim() && (Number(prev[0].price) || 0) === 0) {
        updatedQty = 1;
        return [{
          id: prev[0].id,
          catalogItemId: catItem.id,
          description: catItem.name,
          qty: 1,
          unit: catItem.unit || 'Unit',
          price: Number(catItem.price) || 0,
          discount: 0,
          total: Number(catItem.price) || 0
        }];
      }

      // 3. Tambahkan sebagai baris item baru dengan jumlah 1 pcs
      updatedQty = 1;
      return [
        ...prev,
        {
          id: 'item-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          catalogItemId: catItem.id,
          description: catItem.name,
          qty: 1,
          unit: catItem.unit || 'Unit',
          price: Number(catItem.price) || 0,
          discount: 0,
          total: Number(catItem.price) || 0
        }
      ];
    });

    // Tampilkan notifikasi "Berhasil!"
    setToastMsg(`Berhasil! "${catItem.name}" dimasukkan (${updatedQty} ${catItem.unit || 'pcs'})`);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMsg('');
    }, 2200);
  };

  const getItemQtyInDocument = (catItemId, catItemName, catItemPrice) => {
    const found = items.find(
      i => i.catalogItemId === catItemId || (i.description === catItemName && Number(i.price) === Number(catItemPrice))
    );
    return found ? Number(found.qty) || 0 : 0;
  };

  // Filter katalog produk & jasa berdasarkan pencarian dan tipe
  const filteredCatalog = catalogItems.filter(item => {
    const q = (catalogSearch || '').toLowerCase().trim();
    const matchSearch =
      !q ||
      item.name?.toLowerCase().includes(q) ||
      item.code?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q);
    const matchType = catalogFilterType === 'ALL' || item.type === catalogFilterType;
    return matchSearch && matchType;
  });

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
                {/* Tombol Buka Popup Dialog Katalog Produk & Jasa */}
                <button
                  type="button"
                  onClick={() => {
                    setCatalogSearch('');
                    setCatalogFilterType('ALL');
                    setCatalogModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold rounded-lg shadow-sm transition active:scale-95"
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                  <span>Pilih dari Katalog</span>
                  {catalogItems.length > 0 && (
                    <span className="ml-0.5 px-1.5 py-0.2 bg-amber-200/80 text-amber-900 rounded-full text-[10px] font-mono font-bold">
                      {catalogItems.length}
                    </span>
                  )}
                </button>

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

      {/* FLOATING TOAST NOTIFICATION */}
      {toastMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[80] pointer-events-none transition-all">
          <div className="flex items-center gap-2.5 bg-slate-900/95 text-white border border-emerald-500/50 shadow-2xl px-5 py-3 rounded-full text-xs sm:text-sm font-semibold backdrop-blur-md animate-bounce">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        </div>
      )}

      {/* POPUP MODAL KATALOG PRODUK & JASA */}
      {catalogModalOpen && (
        <div className="fixed inset-0 z-[65] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh]">
            
            {/* Header Dialog */}
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
                    Pilih Produk / Jasa dari Katalog
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Klik produk untuk menambahkan ke daftar (1x klik = 1 pcs, 2x klik = 2 pcs, dst.)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCatalogModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter & Search */}
            <div className="p-4 border-b border-slate-100 space-y-3 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Cari nama produk, SKU, kode, atau rincian..."
                  className="w-full pl-10 pr-9 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition"
                  autoFocus
                />
                {catalogSearch && (
                  <button
                    type="button"
                    onClick={() => setCatalogSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 text-xs flex-wrap">
                <button
                  type="button"
                  onClick={() => setCatalogFilterType('ALL')}
                  className={`px-3 py-1 rounded-lg font-medium transition ${
                    catalogFilterType === 'ALL'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Semua ({catalogItems.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCatalogFilterType('GOODS')}
                  className={`px-3 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
                    catalogFilterType === 'GOODS'
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Package className="w-3 h-3" />
                  Barang / Produk ({catalogItems.filter(i => i.type === 'GOODS').length})
                </button>
                <button
                  type="button"
                  onClick={() => setCatalogFilterType('SERVICE')}
                  className={`px-3 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
                    catalogFilterType === 'SERVICE'
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Wrench className="w-3 h-3" />
                  Jasa / Layanan ({catalogItems.filter(i => i.type === 'SERVICE').length})
                </button>
              </div>
            </div>

            {/* List Catalog Items */}
            <div className="p-4 overflow-y-auto flex-1 space-y-2.5 bg-slate-50/50">
              {filteredCatalog.length === 0 ? (
                <div className="py-12 text-center">
                  <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600">
                    {catalogItems.length === 0 
                      ? 'Belum ada produk/jasa di katalog.' 
                      : 'Tidak ada produk atau jasa yang cocok dengan pencarian.'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {catalogItems.length === 0 && 'Silakan tambahkan produk di menu Katalog Produk & Jasa.'}
                  </p>
                </div>
              ) : (
                filteredCatalog.map(item => {
                  const qtyInDoc = getItemQtyInDocument(item.id, item.name, item.price);
                  const isSelected = qtyInDoc > 0;

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleAddFromCatalog(item)}
                      className={`group p-3 sm:p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 select-none ${
                        isSelected
                          ? 'bg-brand-50/40 border-brand-300 shadow-sm hover:border-brand-500'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                          item.type === 'SERVICE' 
                            ? 'bg-cyan-50 text-cyan-600 group-hover:bg-cyan-100' 
                            : 'bg-amber-50 text-amber-600 group-hover:bg-amber-100'
                        }`}>
                          {item.type === 'SERVICE' ? (
                            <Wrench className="w-4 h-4" />
                          ) : (
                            <Package className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-brand-600 transition truncate">
                              {item.name}
                            </h4>
                            {item.code && (
                              <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                {item.code}
                              </span>
                            )}
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                              item.type === 'SERVICE'
                                ? 'bg-cyan-100/70 text-cyan-700'
                                : 'bg-amber-100/70 text-amber-700'
                            }`}>
                              {item.type === 'SERVICE' ? 'Jasa' : 'Barang'}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {item.description}
                            </p>
                          )}
                          <div className="text-xs font-extrabold text-slate-900 mt-1">
                            {formatRupiah(item.price)}
                            <span className="text-[11px] font-normal text-slate-500 ml-1">
                              / {item.unit || 'pcs'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action / Qty status */}
                      <div className="flex items-center gap-2 shrink-0">
                        {isSelected ? (
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-1 bg-brand-600 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 shadow-sm">
                              <Check className="w-3 h-3" />
                              <span>{qtyInDoc} {item.unit || 'pcs'}</span>
                            </span>
                            <button
                              type="button"
                              className="px-2.5 py-1 bg-white hover:bg-brand-50 border border-brand-300 text-brand-700 text-xs font-bold rounded-lg active:scale-95 transition"
                            >
                              +1
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="px-3 py-1.5 bg-slate-100 group-hover:bg-brand-600 group-hover:text-white text-slate-700 text-xs font-semibold rounded-lg active:scale-95 transition flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Pilih (+1)</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Dialog */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Total item terdaftar: <strong className="text-slate-800">{items.filter(i => i.description.trim()).length}</strong> jenis
              </span>
              <button
                type="button"
                onClick={() => setCatalogModalOpen(false)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition active:scale-95"
              >
                Selesai
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
