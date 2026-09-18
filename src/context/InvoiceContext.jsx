import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { formatDocumentNumber } from '../utils/numbering';
import { supabaseService } from '../lib/supabaseService';

const InvoiceContext = createContext();

const INVOICES_STORAGE = 'io101_invoices_data';
const QUOTATIONS_STORAGE = 'io101_quotations_data';
const CLIENTS_STORAGE = 'io101_clients_data';
const ITEMS_STORAGE = 'io101_items_data';

export function InvoiceProvider({ children }) {
  const { session } = useAuth();
  const currentYear = new Date().getFullYear();

  // Cloud Sync Status
  const [cloudStatus, setCloudStatus] = useState({
    connected: false,
    tablesReady: false,
    syncing: false,
    message: 'Memeriksa koneksi cloud...'
  });

  // Load or seed invoices
  const [invoices, setInvoices] = useState(() => {
    try {
      const saved = localStorage.getItem(INVOICES_STORAGE);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Load or seed quotations
  const [quotations, setQuotations] = useState(() => {
    try {
      const saved = localStorage.getItem(QUOTATIONS_STORAGE);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Clients database
  const [clients, setClients] = useState(() => {
    try {
      const saved = localStorage.getItem(CLIENTS_STORAGE);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'client-1',
        name: 'PT Gemilang Kreasi Nusantara',
        contactPerson: 'Budi Santoso',
        email: 'finance@gemilangkreasinusantara.co.id',
        phone: '0813-8899-7711',
        address: 'Gedung Wisma Niaga Lt. 8, Jl. Gatot Subroto Kav. 12, Jakarta Selatan'
      },
      {
        id: 'client-2',
        name: 'CV Sinar Mandiri Sejahtera',
        contactPerson: 'Siti Rahma',
        email: 'purchasing@sinarmandiri.com',
        phone: '0821-4455-6677',
        address: 'Ruko Golden Boulevard Blok C-15, BSD City, Tangerang'
      },
      {
        id: 'client-3',
        name: 'PT Surya Citra Logistik',
        contactPerson: 'Hendra Wijaya',
        email: 'hendra@suryacitralogistik.com',
        phone: '0857-1122-3344',
        address: 'Jl. Perak Barat No. 44, Tanjung Perak, Surabaya'
      }
    ];
  });

  // Catalog of Barang & Jasa (Products & Services)
  const [catalogItems, setCatalogItems] = useState(() => {
    try {
      const saved = localStorage.getItem(ITEMS_STORAGE);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'item-1',
        type: 'JASA',
        code: 'SRV-WEB-01',
        name: 'Pengembangan Website & Sistem Custom',
        category: 'Software & Web',
        price: 15000000,
        unit: 'Paket',
        description: 'Pembuatan aplikasi web frontend & backend responsif dengan integrasi API'
      },
      {
        id: 'item-2',
        type: 'JASA',
        code: 'SRV-SRV-02',
        name: 'Maintenance Cloud Server & Backup Bulanan',
        category: 'Cloud & DevOps',
        price: 1500000,
        unit: 'Bulan',
        description: 'Pemeliharaan server VPS, pembaruan keamanan, dan backup harian otomatis'
      },
      {
        id: 'item-3',
        type: 'JASA',
        code: 'SRV-KNS-03',
        name: 'Konsultasi IT & Pelatihan Onboarding',
        category: 'Konsultasi',
        price: 3000000,
        unit: 'Sesi',
        description: 'Sesi pendampingan implementasi sistem dan panduan operasional pengguna'
      },
      {
        id: 'item-4',
        type: 'BARANG',
        code: 'PRD-PRN-01',
        name: 'Printer Thermal Kasir 80mm Auto-Cutter USB+LAN',
        category: 'Hardware POS',
        price: 1250000,
        unit: 'Unit',
        description: 'Printer cetak struk cepat 250mm/s dengan auto-cutter pisau tahan lama'
      },
      {
        id: 'item-5',
        type: 'BARANG',
        code: 'PRD-SCN-02',
        name: 'Barcode Scanner 2D Wireless Bluetooth & QR Code',
        category: 'Hardware POS',
        price: 850000,
        unit: 'Unit',
        description: 'Scanner barcode 1D dan 2D QR Code wireless jangkauan hingga 50 meter'
      },
      {
        id: 'item-6',
        type: 'BARANG',
        code: 'PRD-KRT-03',
        name: 'Kertas Thermal Roll 80x80 (1 Box isi 50 Roll)',
        category: 'Supplies',
        price: 450000,
        unit: 'Box',
        description: 'Kertas struk kasir thermal premium putih pekat, cetakan tajam dan tahan lama'
      }
    ];
  });

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(INVOICES_STORAGE, JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem(QUOTATIONS_STORAGE, JSON.stringify(quotations));
  }, [quotations]);

  useEffect(() => {
    localStorage.setItem(CLIENTS_STORAGE, JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem(ITEMS_STORAGE, JSON.stringify(catalogItems));
  }, [catalogItems]);

  // If user just logged in with new company code and list is empty, seed demo documents with their code
  useEffect(() => {
    if (session && invoices.length === 0 && quotations.length === 0) {
      const code = session.companyCode || 'PATH';
      const sampleDate = new Date().toISOString().split('T')[0];
      const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const sampleInvoice = {
        id: 'inv-' + Date.now(),
        type: 'INV',
        number: formatDocumentNumber('INV', code, 1, currentYear),
        sequenceNumber: 1,
        companyName: session.companyName,
        companyCode: code,
        issueDate: sampleDate,
        dueDate: dueDate,
        status: 'PAID', // PAID, UNPAID, DRAFT, CANCELLED
        client: clients[0],
        items: [
          { id: '1', description: 'Pengembangan Aplikasi Web Enterprise & Integrasi API', qty: 1, unit: 'Paket', price: 17500000, discount: 0, total: 17500000 },
          { id: '2', description: 'Cloud Server Setup & Maintenance Bulanan', qty: 2, unit: 'Bulan', price: 1500000, discount: 10, total: 2700000 }
        ],
        subtotal: 20200000,
        taxPercent: 11,
        taxAmount: 2222000,
        discountPercent: 0,
        discountAmount: 0,
        grandTotal: 22422000,
        notes: 'Terima kasih atas kerja samanya. Pembayaran telah lunas diterima.',
        paymentTerms: 'Transfer Bank BCA no. rek 1234567890 a.n ' + session.companyName,
        createdAt: new Date().toISOString(),
      };

      const sampleQuotation = {
        id: 'quo-' + Date.now(),
        type: 'QUO',
        number: formatDocumentNumber('QUO', code, 1, currentYear),
        sequenceNumber: 1,
        companyName: session.companyName,
        companyCode: code,
        issueDate: sampleDate,
        validUntil: dueDate,
        status: 'SENT', // DRAFT, SENT, ACCEPTED, REJECTED
        client: clients[1],
        items: [
          { id: '1', description: 'Paket Layanan SaaS Subscription 1 Tahun (Enterprise)', qty: 1, unit: 'Lisensi', price: 12000000, discount: 5, total: 11400000 },
          { id: '2', description: 'Training & Onboarding User Tim Internal (2 Hari)', qty: 1, unit: 'Sesi', price: 3000000, discount: 0, total: 3000000 }
        ],
        subtotal: 14400000,
        taxPercent: 11,
        taxAmount: 1584000,
        discountPercent: 0,
        discountAmount: 0,
        grandTotal: 15984000,
        notes: 'Penawaran ini berlaku selama 14 hari kalender sejak tanggal diterbitkan.',
        paymentTerms: 'Term 1: 50% DP setelah PO disetujui, Term 2: 50% setelah serah terima.',
        createdAt: new Date().toISOString(),
      };

      setInvoices([sampleInvoice]);
      setQuotations([sampleQuotation]);
    }
  }, [session]);

  // Helper to generate next document number
  const getNextNumber = (type) => {
    const code = session?.companyCode || 'IO101';
    const list = type === 'QUO' ? quotations : invoices;
    
    // Filter documents matching current year and company code
    const currentYearDocs = list.filter(d => 
      d.companyCode === code && 
      new Date(d.issueDate || d.createdAt).getFullYear() === currentYear
    );

    const maxSeq = currentYearDocs.reduce((max, d) => {
      const seq = Number(d.sequenceNumber) || 0;
      return seq > max ? seq : max;
    }, 0);

    const nextSeq = maxSeq + 1;
    return {
      sequenceNumber: nextSeq,
      documentNumber: formatDocumentNumber(type, code, nextSeq, currentYear)
    };
  };

  // Sync with Supabase Cloud
  const syncWithCloud = async () => {
    setCloudStatus(prev => ({ ...prev, syncing: true }));
    try {
      const conn = await supabaseService.testConnection();
      if (!conn.connected) {
        setCloudStatus({ connected: false, tablesReady: false, syncing: false, message: conn.message });
        return;
      }

      if (!conn.tablesReady) {
        setCloudStatus({
          connected: true,
          tablesReady: false,
          syncing: false,
          message: 'Terhubung ke server cloud (Tabel belum siap)'
        });
        return;
      }

      // If tables are ready, fetch and merge cloud data
      const cloudInvoices = await supabaseService.fetchInvoices(session?.companyCode);
      if (cloudInvoices && cloudInvoices.length > 0) {
        setInvoices(cloudInvoices);
      }

      const cloudQuotes = await supabaseService.fetchQuotations(session?.companyCode);
      if (cloudQuotes && cloudQuotes.length > 0) {
        setQuotations(cloudQuotes);
      }

      const cloudItems = await supabaseService.fetchCatalogItems();
      if (cloudItems && cloudItems.length > 0) {
        setCatalogItems(cloudItems);
      }

      const cloudClients = await supabaseService.fetchClients();
      if (cloudClients && cloudClients.length > 0) {
        setClients(cloudClients);
      }

      setCloudStatus({
        connected: true,
        tablesReady: true,
        syncing: false,
        message: 'Tersinkronisasi dengan Cloud Database',
        lastSynced: new Date().toLocaleTimeString('id-ID')
      });
    } catch (err) {
      setCloudStatus({ connected: false, tablesReady: false, syncing: false, message: err.message });
    }
  };

  useEffect(() => {
    syncWithCloud();
  }, [session?.companyCode]);

  // CRUD for Invoice
  const createInvoice = (invoiceData) => {
    const next = getNextNumber('INV');
    const newInvoice = {
      ...invoiceData,
      id: 'inv-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      type: 'INV',
      companyCode: session?.companyCode || 'IO101',
      companyName: session?.companyName || 'Perusahaan',
      sequenceNumber: invoiceData.sequenceNumber || next.sequenceNumber,
      number: invoiceData.number || next.documentNumber,
      createdAt: new Date().toISOString()
    };
    setInvoices(prev => [newInvoice, ...prev]);
    supabaseService.saveInvoice(newInvoice);
    return newInvoice;
  };

  const updateInvoice = (id, updatedData) => {
    setInvoices(prev => {
      const nextList = prev.map(inv => {
        if (inv.id === id) {
          const updated = { ...inv, ...updatedData, updatedAt: new Date().toISOString() };
          supabaseService.saveInvoice(updated);
          return updated;
        }
        return inv;
      });
      return nextList;
    });
  };

  const deleteInvoice = (id) => {
    setInvoices(prev => prev.filter(inv => inv.id !== id));
    supabaseService.deleteInvoice(id);
  };

  // CRUD for Quotation
  const createQuotation = (quotationData) => {
    const next = getNextNumber('QUO');
    const newQuotation = {
      ...quotationData,
      id: 'quo-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      type: 'QUO',
      companyCode: session?.companyCode || 'IO101',
      companyName: session?.companyName || 'Perusahaan',
      sequenceNumber: quotationData.sequenceNumber || next.sequenceNumber,
      number: quotationData.number || next.documentNumber,
      createdAt: new Date().toISOString()
    };
    setQuotations(prev => [newQuotation, ...prev]);
    supabaseService.saveQuotation(newQuotation);
    return newQuotation;
  };

  const updateQuotation = (id, updatedData) => {
    setQuotations(prev => {
      const nextList = prev.map(q => {
        if (q.id === id) {
          const updated = { ...q, ...updatedData, updatedAt: new Date().toISOString() };
          supabaseService.saveQuotation(updated);
          return updated;
        }
        return q;
      });
      return nextList;
    });
  };

  const deleteQuotation = (id) => {
    setQuotations(prev => prev.filter(q => q.id !== id));
    supabaseService.deleteQuotation(id);
  };

  // 1-Click Convert Quotation to Invoice
  const convertQuotationToInvoice = (quotationId) => {
    const quote = quotations.find(q => q.id === quotationId);
    if (!quote) throw new Error('Penawaran tidak ditemukan');

    const next = getNextNumber('INV');
    const today = new Date().toISOString().split('T')[0];
    const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const newInvoice = {
      type: 'INV',
      id: 'inv-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      number: next.documentNumber,
      sequenceNumber: next.sequenceNumber,
      companyCode: session?.companyCode || quote.companyCode,
      companyName: session?.companyName || quote.companyName,
      issueDate: today,
      dueDate: dueDate,
      status: 'UNPAID',
      client: quote.client,
      items: JSON.parse(JSON.stringify(quote.items)),
      subtotal: quote.subtotal,
      taxPercent: quote.taxPercent,
      taxAmount: quote.taxAmount,
      discountPercent: quote.discountPercent,
      discountAmount: quote.discountAmount,
      grandTotal: quote.grandTotal,
      notes: `Dikonversi dari Penawaran #${quote.number}. ${quote.notes || ''}`,
      paymentTerms: quote.paymentTerms || '',
      linkedQuotationNumber: quote.number,
      createdAt: new Date().toISOString()
    };

    setInvoices(prev => [newInvoice, ...prev]);
    supabaseService.saveInvoice(newInvoice);

    // Update quotation status to ACCEPTED
    updateQuotation(quote.id, {
      status: 'ACCEPTED',
      convertedToInvoiceNumber: newInvoice.number
    });

    return newInvoice;
  };

  // Client Management
  const addClient = (clientData) => {
    const newClient = {
      ...clientData,
      id: 'client-' + Date.now()
    };
    setClients(prev => [...prev, newClient]);
    supabaseService.saveClient(newClient);
    return newClient;
  };

  // Catalog (Barang & Jasa) CRUD
  const addCatalogItem = (itemData) => {
    const newItem = {
      ...itemData,
      id: 'item-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      createdAt: new Date().toISOString()
    };
    setCatalogItems(prev => [newItem, ...prev]);
    supabaseService.saveCatalogItem(newItem);
    return newItem;
  };

  const updateCatalogItem = (id, updatedData) => {
    setCatalogItems(prev => {
      const nextList = prev.map(item => {
        if (item.id === id) {
          const updated = { ...item, ...updatedData, updatedAt: new Date().toISOString() };
          supabaseService.saveCatalogItem(updated);
          return updated;
        }
        return item;
      });
      return nextList;
    });
  };

  const deleteCatalogItem = (id) => {
    setCatalogItems(prev => prev.filter(item => item.id !== id));
    supabaseService.deleteCatalogItem(id);
  };

  return (
    <InvoiceContext.Provider value={{
      invoices,
      quotations,
      clients,
      catalogItems,
      cloudStatus,
      syncWithCloud,
      getNextNumber,
      createInvoice,
      updateInvoice,
      deleteInvoice,
      createQuotation,
      updateQuotation,
      deleteQuotation,
      convertQuotationToInvoice,
      addClient,
      addCatalogItem,
      updateCatalogItem,
      deleteCatalogItem
    }}>
      {children}
    </InvoiceContext.Provider>
  );
}

export function useInvoice() {
  const context = useContext(InvoiceContext);
  if (!context) {
    throw new Error('useInvoice must be used within an InvoiceProvider');
  }
  return context;
}
