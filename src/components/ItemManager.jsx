import React, { useState } from 'react';
import { useInvoice } from '../context/InvoiceContext';
import { formatRupiah } from '../utils/currency';
import { 
  Package, 
  Wrench, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Tag, 
  DollarSign, 
  Layers, 
  X, 
  Check, 
  Briefcase 
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ItemManager() {
  const { catalogItems, addCatalogItem, updateCatalogItem, deleteCatalogItem } = useInvoice();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // ALL, BARANG, JASA

  // Modal form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [formData, setFormData] = useState({
    type: 'JASA',
    code: '',
    name: '',
    category: '',
    price: 0,
    unit: 'Paket',
    description: ''
  });

  const filteredItems = catalogItems.filter(item => {
    const matchSearch = 
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.code.toLowerCase().includes(search.toLowerCase()) ||
      item.category?.toLowerCase().includes(search.toLowerCase());
    
    if (filterType === 'ALL') return matchSearch;
    return matchSearch && item.type === filterType;
  });

  const barangCount = catalogItems.filter(i => i.type === 'BARANG').length;
  const jasaCount = catalogItems.filter(i => i.type === 'JASA').length;

  const handleOpenAdd = (defaultType = 'JASA') => {
    const prefix = defaultType === 'BARANG' ? 'PRD' : 'SRV';
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setEditingItem(null);
    setFormData({
      type: defaultType,
      code: `${prefix}-${randomSuffix}`,
      name: '',
      category: defaultType === 'BARANG' ? 'Hardware / Perlengkapan' : 'Software & Layanan',
      price: 100000,
      unit: defaultType === 'BARANG' ? 'Unit' : 'Paket',
      description: ''
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      type: item.type,
      code: item.code,
      name: item.name,
      category: item.category || '',
      price: item.price,
      unit: item.unit || 'Unit',
      description: item.description || ''
    });
    setModalOpen(true);
  };

  const handleDelete = (id, name) => {
    if (confirm(`Hapus "${name}" dari katalog?`)) {
      deleteCatalogItem(id);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Nama barang atau jasa harus diisi!');
      return;
    }

    const payload = {
      ...formData,
      price: Number(formData.price) || 0
    };

    if (editingItem) {
      updateCatalogItem(editingItem.id, payload);
    } else {
      addCatalogItem(payload);
      confetti({ particleCount: 50, spread: 45, origin: { y: 0.7 } });
    }

    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-brand-600" />
            Katalog Barang & Jasa
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola master data produk fisik dan tarif layanan untuk dipilih instan saat pembuatan invoice dan penawaran
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => handleOpenAdd('BARANG')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-sm transition"
          >
            <Package className="w-4 h-4" />
            + Barang Baru
          </button>
          <button
            onClick={() => handleOpenAdd('JASA')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 transition"
          >
            <Wrench className="w-4 h-4" />
            + Jasa Baru
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kode SKU, nama barang, atau layanan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {[
            { id: 'ALL', label: 'Semua', count: catalogItems.length },
            { id: 'BARANG', label: 'Barang Fisik', count: barangCount, color: 'text-amber-600' },
            { id: 'JASA', label: 'Jasa & Layanan', count: jasaCount, color: 'text-brand-600' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition ${
                filterType === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${filterType === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Products and Services */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
            Tidak ada data barang atau jasa yang sesuai.
          </div>
        ) : (
          filteredItems.map((item) => {
            const isBarang = item.type === 'BARANG';
            return (
              <div 
                key={item.id} 
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      isBarang ? 'bg-amber-100 text-amber-800' : 'bg-brand-100 text-brand-800'
                    }`}>
                      {isBarang ? <Package className="w-3 h-3" /> : <Wrench className="w-3 h-3" />}
                      {isBarang ? 'Barang' : 'Jasa'}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-slate-400">
                      {item.code}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 mt-2.5 leading-snug">
                    {item.name}
                  </h3>

                  {item.category && (
                    <span className="inline-block mt-1 text-[11px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded">
                      {item.category}
                    </span>
                  )}

                  {item.description && (
                    <p className="mt-2 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Harga Satuan:</div>
                    <div className="text-sm font-black font-mono text-slate-900">
                      {formatRupiah(item.price)}
                      <span className="text-xs text-slate-500 font-normal font-sans ml-1">/{item.unit || 'Unit'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      title="Edit Item"
                      className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.name)}
                      title="Hapus Item"
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl text-white font-bold text-xs ${
                  formData.type === 'BARANG' ? 'bg-amber-600' : 'bg-brand-600'
                }`}>
                  {formData.type === 'BARANG' ? <Package className="w-4 h-4" /> : <Wrench className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingItem ? 'Edit Data Barang / Jasa' : 'Tambah Barang atau Jasa Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Isi detail master data untuk mempermudah pembuatan faktur
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              
              {/* Type Radio */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[11px]">
                  Tipe Entitas *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition ${
                    formData.type === 'JASA'
                      ? 'border-brand-600 bg-brand-50 text-brand-900 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}>
                    <input
                      type="radio"
                      name="type"
                      checked={formData.type === 'JASA'}
                      onChange={() => setFormData(prev => ({ ...prev, type: 'JASA', unit: 'Paket' }))}
                      className="hidden"
                    />
                    <Wrench className="w-4 h-4 text-brand-600" />
                    <span>Jasa / Layanan</span>
                  </label>

                  <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition ${
                    formData.type === 'BARANG'
                      ? 'border-amber-600 bg-amber-50 text-amber-900 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}>
                    <input
                      type="radio"
                      name="type"
                      checked={formData.type === 'BARANG'}
                      onChange={() => setFormData(prev => ({ ...prev, type: 'BARANG', unit: 'Unit' }))}
                      className="hidden"
                    />
                    <Package className="w-4 h-4 text-amber-600" />
                    <span>Barang Fisik</span>
                  </label>
                </div>
              </div>

              {/* Code & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kode / SKU *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="Contoh: SRV-001"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="Software, Hardware, Konsultasi"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Barang / Jasa *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Contoh: Pembuatan Website & Landing Page"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 font-medium"
                />
              </div>

              {/* Price & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Harga Satuan Standar (Rp) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Satuan Default</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                    placeholder="Unit / Pcs / Paket / Bulan / Jam"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Deskripsi Tambahan</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Keterangan spesifikasi barang atau lingkup pekerjaan jasa..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold shadow-md shadow-brand-500/20 transition"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Tambah ke Katalog'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
