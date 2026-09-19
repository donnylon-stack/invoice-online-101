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

  // Network & Cloud Sync Status (100% Online Enforcement)
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
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
    return [];
  });

  // Catalog of Barang & Jasa (Products & Services)
  const [catalogItems, setCatalogItems] = useState(() => {
    try {
      const saved = localStorage.getItem(ITEMS_STORAGE);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
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

  // Sync with Supabase Cloud (100% Online Mode)
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

      // If tables are ready, fetch live cloud data
      const cloudInvoices = await supabaseService.fetchInvoices(session?.companyCode);
      if (Array.isArray(cloudInvoices)) {
        if (cloudInvoices.length > 0) {
          setInvoices(cloudInvoices);
        } else {
          // Jika cloud masih kosong tapi ada invoice lokal, sinkronkan ke cloud agar tersimpan
          const localSaved = localStorage.getItem(INVOICES_STORAGE);
          if (localSaved) {
            try {
              const parsed = JSON.parse(localSaved);
              if (Array.isArray(parsed) && parsed.length > 0) {
                for (const inv of parsed) {
                  await supabaseService.saveInvoice(inv);
                }
                const refreshed = await supabaseService.fetchInvoices(session?.companyCode);
                if (Array.isArray(refreshed) && refreshed.length > 0) {
                  setInvoices(refreshed);
                }
              }
            } catch (e) {
              console.warn('Sync local invoices error:', e);
            }
          }
        }
      }

      const cloudQuotes = await supabaseService.fetchQuotations(session?.companyCode);
      if (Array.isArray(cloudQuotes)) {
        if (cloudQuotes.length > 0) {
          setQuotations(cloudQuotes);
        } else {
          // Jika cloud masih kosong tapi ada penawaran lokal, sinkronkan ke cloud
          const localSaved = localStorage.getItem(QUOTATIONS_STORAGE);
          if (localSaved) {
            try {
              const parsed = JSON.parse(localSaved);
              if (Array.isArray(parsed) && parsed.length > 0) {
                for (const quo of parsed) {
                  await supabaseService.saveQuotation(quo);
                }
                const refreshed = await supabaseService.fetchQuotations(session?.companyCode);
                if (Array.isArray(refreshed) && refreshed.length > 0) {
                  setQuotations(refreshed);
                }
              }
            } catch (e) {
              console.warn('Sync local quotations error:', e);
            }
          }
        }
      }

      const cloudItems = await supabaseService.fetchCatalogItems();
      if (Array.isArray(cloudItems) && cloudItems.length > 0) {
        setCatalogItems(cloudItems);
      }

      const cloudClients = await supabaseService.fetchClients();
      if (Array.isArray(cloudClients) && cloudClients.length > 0) {
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
  }, [session?.companyCode]);

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
      id: 'client-' + Date.now(),
      createdAt: new Date().toISOString()
    };
    setClients(prev => [...prev, newClient]);
    supabaseService.saveClient(newClient);
    return newClient;
  };

  const updateClient = (id, updatedData) => {
    setClients(prev => {
      const nextList = prev.map(c => {
        if (c.id === id) {
          const updated = { ...c, ...updatedData, updatedAt: new Date().toISOString() };
          supabaseService.saveClient(updated);
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
