import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { formatDocumentNumber } from '../utils/numbering';
import { supabaseService } from '../lib/supabaseService';

const InvoiceContext = createContext();

export function InvoiceProvider({ children }) {
  const { session } = useAuth();
  const currentYear = new Date().getFullYear();

  // Helper storage key scoped to active company
  const getCompKey = () => session?.companyId || session?.companyCode || 'guest';

  // Network & Cloud Sync Status (100% Online Enforcement)
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [cloudStatus, setCloudStatus] = useState({
    connected: false,
    tablesReady: false,
    syncing: false,
    message: 'Memeriksa koneksi cloud...'
  });

  // Load tenant-isolated invoices
  const [invoices, setInvoices] = useState(() => {
    if (!session) return [];
    try {
      const saved = localStorage.getItem(`io101_invoices_${session.companyId || session.companyCode}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Load tenant-isolated quotations
  const [quotations, setQuotations] = useState(() => {
    if (!session) return [];
    try {
      const saved = localStorage.getItem(`io101_quotations_${session.companyId || session.companyCode}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Load tenant-isolated clients
  const [clients, setClients] = useState(() => {
    if (!session) return [];
    try {
      const saved = localStorage.getItem(`io101_clients_${session.companyId || session.companyCode}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Load tenant-isolated catalog of Barang & Jasa
  const [catalogItems, setCatalogItems] = useState(() => {
    if (!session) return [];
    try {
      const saved = localStorage.getItem(`io101_items_${session.companyId || session.companyCode}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Reload isolated data whenever active company changes or user logs in/out
  useEffect(() => {
    if (!session) {
      setInvoices([]);
      setQuotations([]);
      setClients([]);
      setCatalogItems([]);
      return;
    }

    const compKey = session.companyId || session.companyCode;
    try {
      const savedInv = localStorage.getItem(`io101_invoices_${compKey}`);
      setInvoices(savedInv ? JSON.parse(savedInv) : []);
    } catch (e) { setInvoices([]); }

    try {
      const savedQuo = localStorage.getItem(`io101_quotations_${compKey}`);
      setQuotations(savedQuo ? JSON.parse(savedQuo) : []);
    } catch (e) { setQuotations([]); }

    try {
      const savedCli = localStorage.getItem(`io101_clients_${compKey}`);
      setClients(savedCli ? JSON.parse(savedCli) : []);
    } catch (e) { setClients([]); }

    try {
      const savedItm = localStorage.getItem(`io101_items_${compKey}`);
      setCatalogItems(savedItm ? JSON.parse(savedItm) : []);
    } catch (e) { setCatalogItems([]); }

    // Fetch fresh tenant data from cloud
    syncWithCloud();
  }, [session?.companyId, session?.companyCode]);

  // Save to tenant-scoped localStorage
  useEffect(() => {
    if (session) {
      const compKey = session.companyId || session.companyCode;
      localStorage.setItem(`io101_invoices_${compKey}`, JSON.stringify(invoices));
    }
  }, [invoices, session?.companyId, session?.companyCode]);

  useEffect(() => {
    if (session) {
      const compKey = session.companyId || session.companyCode;
      localStorage.setItem(`io101_quotations_${compKey}`, JSON.stringify(quotations));
    }
  }, [quotations, session?.companyId, session?.companyCode]);

  useEffect(() => {
    if (session) {
      const compKey = session.companyId || session.companyCode;
      localStorage.setItem(`io101_clients_${compKey}`, JSON.stringify(clients));
    }
  }, [clients, session?.companyId, session?.companyCode]);

  useEffect(() => {
    if (session) {
      const compKey = session.companyId || session.companyCode;
      localStorage.setItem(`io101_items_${compKey}`, JSON.stringify(catalogItems));
    }
  }, [catalogItems, session?.companyId, session?.companyCode]);

  // Helper to generate next document number
  const getNextNumber = (type) => {
    const code = session?.companyCode || 'IO101';
    const list = type === 'QUO' ? quotations : invoices;
    
    // Filter documents matching current year and company code
    const currentYearDocs = list.filter(d => 
      (d.companyCode === code || d.companyId === session?.companyId) && 
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

  // Sync with Supabase Cloud (Tenant-Isolated 100% Online Mode)
  const syncWithCloud = async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOnline(false);
      setCloudStatus({
        connected: false,
        tablesReady: false,
        syncing: false,
        message: 'Koneksi internet terputus (Offline).'
      });
      return;
    }

    setCloudStatus(prev => ({ ...prev, syncing: true }));
    try {
      const conn = await supabaseService.testConnection();
      if (!conn.connected) {
        setCloudStatus({ connected: false, tablesReady: false, syncing: false, message: conn.message || 'Gagal terhubung ke database cloud.' });
        return;
      }

      setIsOnline(true);
      if (!conn.tablesReady) {
        setCloudStatus({
          connected: true,
          tablesReady: false,
          syncing: false,
          message: 'Terhubung ke server cloud (Tabel belum siap)'
        });
        return;
      }

      const compCode = session?.companyCode;
      const compId = session?.companyId;

      if (!compCode && !compId && !session?.isSuperadmin) {
        setInvoices([]);
        setQuotations([]);
        setClients([]);
        setCatalogItems([]);
        setCloudStatus({ connected: true, tablesReady: true, syncing: false, message: 'Silakan login perusahaan.' });
        return;
      }

      // If tables are ready, fetch live cloud data strictly for THIS company
      const cloudInvoices = await supabaseService.fetchInvoices(compCode, compId);
      if (Array.isArray(cloudInvoices)) {
        setInvoices(cloudInvoices);
      }

      const cloudQuotes = await supabaseService.fetchQuotations(compCode, compId);
      if (Array.isArray(cloudQuotes)) {
        setQuotations(cloudQuotes);
      }

      const cloudItems = await supabaseService.fetchCatalogItems(compCode, compId);
      if (Array.isArray(cloudItems)) {
        setCatalogItems(cloudItems);
      }

      const cloudClients = await supabaseService.fetchClients(compCode, compId);
      if (Array.isArray(cloudClients)) {
        setClients(cloudClients);
      }

      setCloudStatus({
        connected: true,
        tablesReady: true,
        syncing: false,
        message: `Tersinkronisasi (${session?.companyName || 'Cloud'})`,
        lastSynced: new Date().toLocaleTimeString('id-ID')
      });
    } catch (err) {
      setCloudStatus({ connected: false, tablesReady: false, syncing: false, message: err.message });
    }
  };

  // Continuous connectivity monitoring (100% online)
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncWithCloud();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setCloudStatus(prev => ({
        ...prev,
        connected: false,
        syncing: false,
        message: 'Perangkat terputus dari jaringan internet.'
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check & interval heartbeat
    syncWithCloud();
    const interval = setInterval(() => {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        syncWithCloud();
      } else {
        setIsOnline(false);
      }
    }, 15000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [session?.companyCode, session?.companyId]);

  // Helper UUID generator yang kompatibel dengan kolom UUID Supabase
  const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  // CRUD for Invoice (Guarded by Online Status)
  const createInvoice = (invoiceData) => {
    if (typeof navigator !== 'undefined' && (!navigator.onLine || !cloudStatus.connected)) {
      alert('Aplikasi beroperasi 100% Online. Harap pastikan koneksi internet dan server database aktif untuk menerbitkan invoice.');
      throw new Error('Aplikasi sedang offline');
    }

    const next = getNextNumber('INV');
    const newInvoice = {
      ...invoiceData,
      id: generateUUID(),
      type: 'INV',
      companyId: session?.companyId,
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
    const target = invoices.find(inv => inv.id === id);
    localStorage.setItem(`io101_demo_seeded_${session?.companyCode || 'default'}`, 'true');
    setInvoices(prev => prev.filter(inv => inv.id !== id));
    supabaseService.deleteInvoice(id, target?.number);
  };

  // CRUD for Quotation
  const createQuotation = (quotationData) => {
    if (typeof navigator !== 'undefined' && (!navigator.onLine || !cloudStatus.connected)) {
      alert('Aplikasi beroperasi 100% Online. Harap pastikan koneksi internet dan server database aktif untuk menerbitkan penawaran.');
      throw new Error('Aplikasi sedang offline');
    }

    const next = getNextNumber('QUO');
    const newQuotation = {
      ...quotationData,
      id: generateUUID(),
      type: 'QUO',
      companyId: session?.companyId,
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
    const target = quotations.find(q => q.id === id);
    localStorage.setItem(`io101_demo_seeded_${session?.companyCode || 'default'}`, 'true');
    setQuotations(prev => prev.filter(q => q.id !== id));
    supabaseService.deleteQuotation(id, target?.number);
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
      id: generateUUID(),
      number: next.documentNumber,
      sequenceNumber: next.sequenceNumber,
      companyId: session?.companyId,
      companyCode: session?.companyCode || 'IO101',
      companyName: session?.companyName || 'Perusahaan',
      issueDate: today,
      dueDate: dueDate,
      status: 'UNPAID',
      client: quote.client,
      items: quote.items,
      subtotal: quote.subtotal,
      discountPercent: quote.discountPercent,
      discountAmount: quote.discountAmount,
      taxPercent: quote.taxPercent,
      taxAmount: quote.taxAmount,
      grandTotal: quote.grandTotal,
      notes: quote.notes || `Dikonversi dari Penawaran nomor ${quote.number}`,
      paymentTerms: quote.paymentTerms,
      linkedQuotationNumber: quote.number,
      createdAt: new Date().toISOString()
    };

    setInvoices(prev => [newInvoice, ...prev]);
    supabaseService.saveInvoice(newInvoice);

    // Update status quotation to ACCEPTED
    updateQuotation(quotationId, {
      status: 'ACCEPTED',
      convertedToInvoiceNumber: newInvoice.number
    });

    return newInvoice;
  };

  // Client Management CRUD
  const addClient = (clientData) => {
    const newClient = {
      ...clientData,
      id: generateUUID(),
      companyId: session?.companyId,
      companyCode: session?.companyCode,
      createdAt: new Date().toISOString()
    };
    setClients(prev => [...prev, newClient]);
    supabaseService.saveClient(newClient, session?.companyCode, session?.companyId);
    return newClient;
  };

  const updateClient = (id, updatedData) => {
    setClients(prev => {
      const nextList = prev.map(c => {
        if (c.id === id) {
          const updated = { 
            ...c, 
            ...updatedData, 
            companyId: c.companyId || session?.companyId,
            companyCode: c.companyCode || session?.companyCode,
            updatedAt: new Date().toISOString() 
          };
          supabaseService.saveClient(updated, session?.companyCode, session?.companyId);
          return updated;
        }
        return c;
      });
      return nextList;
    });
  };

  const deleteClient = (id) => {
    setClients(prev => prev.filter(c => c.id !== id));
    supabaseService.deleteClient(id);
  };

  // Catalog (Barang & Jasa) CRUD
  const addCatalogItem = (itemData) => {
    const newItem = {
      ...itemData,
      id: generateUUID(),
      companyId: session?.companyId,
      companyCode: session?.companyCode,
      createdAt: new Date().toISOString()
    };
    setCatalogItems(prev => [newItem, ...prev]);
    supabaseService.saveCatalogItem(newItem, session?.companyCode, session?.companyId);
    return newItem;
  };

  const updateCatalogItem = (id, updatedData) => {
    setCatalogItems(prev => {
      const nextList = prev.map(item => {
        if (item.id === id) {
          const updated = { 
            ...item, 
            ...updatedData, 
            companyId: item.companyId || session?.companyId,
            companyCode: item.companyCode || session?.companyCode,
            updatedAt: new Date().toISOString() 
          };
          supabaseService.saveCatalogItem(updated, session?.companyCode, session?.companyId);
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
      isOnline,
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
      updateClient,
      deleteClient,
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
