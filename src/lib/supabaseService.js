import { supabase } from './supabase.js';

/**
 * Service to interact with Cloud Database
 */

export const supabaseService = {
  // Test connection
  async testConnection() {
    try {
      const { data, error } = await supabase.from('invoices').select('id').limit(1);
      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
          return {
            connected: true,
            tablesReady: false,
            message: 'Terhubung ke Server Cloud! Tabel database belum siap.'
          };
        }
        return { connected: false, tablesReady: false, message: 'Gagal terhubung ke database cloud.' };
      }
      return { connected: true, tablesReady: true, message: 'Terhubung aktif ke Server Database' };
    } catch (err) {
      return { connected: false, tablesReady: false, message: err.message };
    }
  },

  // Invoices
  async fetchInvoices(companyCode) {
    try {
      let query = supabase.from('invoices').select('*').order('created_at', { ascending: false });
      if (companyCode) {
        query = query.eq('company_code', companyCode);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        number: row.number,
        sequenceNumber: row.sequence_number,
        companyCode: row.company_code,
        companyName: row.company_name,
        issueDate: row.issue_date,
        dueDate: row.due_date,
        status: row.status,
        client: row.client_data,
        items: row.items,
        subtotal: Number(row.subtotal),
        discountPercent: Number(row.discount_percent),
        discountAmount: Number(row.discount_amount),
        taxPercent: Number(row.tax_percent),
        taxAmount: Number(row.tax_amount),
        grandTotal: Number(row.grand_total),
        notes: row.notes,
        paymentTerms: row.payment_terms,
        linkedQuotationNumber: row.linked_quotation_number,
        createdAt: row.created_at
      }));
    } catch (e) {
      console.warn('Supabase fetchInvoices:', e.message);
      return null;
    }
  },

  async saveInvoice(inv) {
    try {
      const row = {
        id: (inv.id && typeof inv.id === 'string' && inv.id.length === 36) ? inv.id : undefined, // only if UUID
        number: inv.number,
        sequence_number: Number(inv.sequenceNumber) || 1,
        company_code: inv.companyCode,
        company_name: inv.companyName,
        issue_date: inv.issueDate,
        due_date: inv.dueDate,
        status: inv.status,
        client_data: inv.client,
        items: inv.items,
        subtotal: inv.subtotal,
        discount_percent: inv.discountPercent,
        discount_amount: inv.discountAmount,
        tax_percent: inv.taxPercent,
        tax_amount: inv.taxAmount,
        grand_total: inv.grandTotal,
        notes: inv.notes,
        payment_terms: inv.paymentTerms,
        linked_quotation_number: inv.linkedQuotationNumber,
        updated_at: new Date().toISOString()
      };
      const { data, error } = await supabase.from('invoices').upsert(row).select();
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn('Supabase saveInvoice:', e.message);
      return null;
    }
  },

  async deleteInvoice(id) {
    try {
      const { error } = await supabase.from('invoices').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn('Supabase deleteInvoice:', e.message);
      return false;
    }
  },

  // Quotations
  async fetchQuotations(companyCode) {
    try {
      let query = supabase.from('quotations').select('*').order('created_at', { ascending: false });
      if (companyCode) {
        query = query.eq('company_code', companyCode);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        number: row.number,
        sequenceNumber: row.sequence_number,
        companyCode: row.company_code,
        companyName: row.company_name,
        issueDate: row.issue_date,
        validUntil: row.valid_until,
        status: row.status,
        client: row.client_data,
        items: row.items,
        subtotal: Number(row.subtotal),
        discountPercent: Number(row.discount_percent),
        discountAmount: Number(row.discount_amount),
        taxPercent: Number(row.tax_percent),
        taxAmount: Number(row.tax_amount),
        grandTotal: Number(row.grand_total),
        notes: row.notes,
        paymentTerms: row.payment_terms,
        convertedToInvoiceNumber: row.converted_to_invoice_number,
        createdAt: row.created_at
      }));
    } catch (e) {
      console.warn('Supabase fetchQuotations:', e.message);
      return null;
    }
  },

  async saveQuotation(quo) {
    try {
      const row = {
        id: (quo.id && typeof quo.id === 'string' && quo.id.length === 36) ? quo.id : undefined,
        number: quo.number,
        sequence_number: Number(quo.sequenceNumber) || 1,
        company_code: quo.companyCode,
        company_name: quo.companyName,
        issue_date: quo.issueDate,
        valid_until: quo.validUntil,
        status: quo.status,
        client_data: quo.client,
        items: quo.items,
        subtotal: quo.subtotal,
        discount_percent: quo.discountPercent,
        discount_amount: quo.discountAmount,
        tax_percent: quo.taxPercent,
        tax_amount: quo.taxAmount,
        grand_total: quo.grandTotal,
        notes: quo.notes,
        payment_terms: quo.paymentTerms,
        converted_to_invoice_number: quo.convertedToInvoiceNumber,
        updated_at: new Date().toISOString()
      };
      const { data, error } = await supabase.from('quotations').upsert(row).select();
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn('Supabase saveQuotation:', e.message);
      return null;
    }
  },

  async deleteQuotation(id) {
    try {
      const { error } = await supabase.from('quotations').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn('Supabase deleteQuotation:', e.message);
      return false;
    }
  },

  // Catalog Items
  async fetchCatalogItems() {
    try {
      const { data, error } = await supabase.from('catalog_items').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        type: row.type,
        code: row.code,
        name: row.name,
        category: row.category,
        price: Number(row.price),
        unit: row.unit,
        description: row.description,
        createdAt: row.created_at
      }));
    } catch (e) {
      console.warn('Supabase fetchCatalogItems:', e.message);
      return null;
    }
  },

  async saveCatalogItem(item) {
    try {
      const row = {
        id: (item.id && typeof item.id === 'string' && item.id.length === 36) ? item.id : undefined,
        type: item.type,
        code: item.code,
        name: item.name,
        category: item.category,
        price: item.price,
        unit: item.unit,
        description: item.description,
        updated_at: new Date().toISOString()
      };
      const { data, error } = await supabase.from('catalog_items').upsert(row).select();
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn('Supabase saveCatalogItem:', e.message);
      return null;
    }
  },

  async deleteCatalogItem(id) {
    try {
      const { error } = await supabase.from('catalog_items').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn('Supabase deleteCatalogItem:', e.message);
      return false;
    }
  },

  // Clients
  async fetchClients() {
    try {
      const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        name: row.name,
        contactPerson: row.contact_person,
        email: row.email,
        phone: row.phone,
        address: row.address,
        createdAt: row.created_at
      }));
    } catch (e) {
      console.warn('Supabase fetchClients:', e.message);
      return null;
    }
  },

  async saveClient(client) {
    try {
      const row = {
        id: (client.id && typeof client.id === 'string' && client.id.length === 36) ? client.id : undefined,
        name: client.name,
        contact_person: client.contactPerson,
        email: client.email,
        phone: client.phone,
        address: client.address
      };
      const { data, error } = await supabase.from('clients').upsert(row).select();
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn('Supabase saveClient:', e.message);
      return null;
    }
  },

  async deleteClient(id) {
    try {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn('Supabase deleteClient:', e.message);
      return false;
    }
  },

  // ==========================================
  // DIRECT CLIENT AUTHENTICATION (SUPABASE)
  // ==========================================
  async loginUser(companyInput, usernameInput, passwordInput) {
    const normCompany = (companyInput || '').trim().toLowerCase().replace(/\s+/g, '');
    const normUser = (usernameInput || '').trim().toLowerCase();
    const cleanPassword = (passwordInput || '').trim();

    // 1. Ambil data perusahaan dari tabel companies
    const { data: companies, error: compErr } = await supabase.from('companies').select('*');
    if (compErr) {
      console.warn('Login companies query error:', compErr);
      throw new Error('Gagal mengakses server database cloud. Silakan periksa koneksi internet Anda.');
    }

    const companyData = (companies || []).find(c => {
      const cName = (c.company_name || '').toLowerCase().replace(/\s+/g, '');
      const cCode = (c.company_code || '').toLowerCase();
      return cName === normCompany || cCode === normCompany;
    });

    if (!companyData) {
      throw new Error(`Perusahaan "${companyInput}" tidak ditemukan di database.`);
    }

    // 2. Ambil data user dari tabel company_users
    const { data: users, error: userErr } = await supabase
      .from('company_users')
      .select('*')
      .ilike('username', normUser);

    if (userErr) {
      console.warn('Login users query error:', userErr);
      throw new Error('Gagal membaca data akun di server cloud.');
    }

    const matchedUser = (users || []).find(u => {
      const matchComp = 
        (u.company_name || '').toLowerCase().replace(/\s+/g, '') === (companyData.company_name || '').toLowerCase().replace(/\s+/g, '') ||
        (u.company_code || '').toLowerCase() === (companyData.company_code || '').toLowerCase() ||
        u.company_id === companyData.id;
      return matchComp;
    });

    if (!matchedUser) {
      throw new Error(`User "${usernameInput}" tidak terdaftar di database untuk ${companyData.company_name}.`);
    }

    // 3. Validasi password dari Supabase
    if (matchedUser.password !== cleanPassword) {
      throw new Error('Password salah! Silakan periksa kembali password Anda.');
    }

    if (matchedUser.status && matchedUser.status !== 'Aktif') {
      throw new Error('Akun ini sedang dinonaktifkan oleh Administrator.');
    }

    return {
      user: {
        id: matchedUser.id,
        name: matchedUser.name,
        username: matchedUser.username,
        role: matchedUser.role,
        email: matchedUser.email,
        provider: matchedUser.auth_provider || 'password'
      },
      company: {
        id: companyData.id,
        name: companyData.company_name,
        code: companyData.company_code,
        phone: companyData.phone || '0812-4567-8901',
        email: companyData.email || matchedUser.email,
        address: companyData.address || 'Manado, Sulawesi Utara',
        bankInfo: {
          bankName: companyData.bank_name || 'BCA',
          accountNumber: companyData.account_number || '7890123456',
          accountHolder: companyData.account_holder || companyData.company_name
        },
        signatureName: companyData.signature_name || matchedUser.name,
        signatureTitle: companyData.signature_title || matchedUser.role,
        logoUrl: companyData.logo_url || '/logo.jpg',
        signatureUrl: companyData.signature_url || '',
        stampUrl: companyData.stamp_url || ''
      }
    };
  },

  async loginGoogleUser({ email, name, avatar, company }) {
    const normCompany = (company || '').trim().toLowerCase().replace(/\s+/g, '');
    const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');

    // 1. Ambil perusahaan dari Supabase
    const { data: companies } = await supabase.from('companies').select('*');
    const companyData = (companies || []).find(c => {
      const cName = (c.company_name || '').toLowerCase().replace(/\s+/g, '');
      const cCode = (c.company_code || '').toLowerCase();
      return cName === normCompany || cCode === normCompany;
    }) || (companies && companies[0]);

    if (!companyData) {
      throw new Error('Data perusahaan belum terdaftar di database cloud.');
    }

    // 2. Simpan user ke tabel company_users Supabase
    const userPayload = {
      company_id: companyData.id,
      company_name: companyData.company_name,
      company_code: companyData.company_code,
      name: name || username,
      username: username,
      email: email,
      role: 'Admin / Owner',
      status: 'Aktif',
      auth_provider: 'google',
      updated_at: new Date().toISOString()
    };

    let userRow = null;
    try {
      const { data: upserted } = await supabase.from('company_users').upsert(userPayload).select();
      if (upserted && upserted[0]) userRow = upserted[0];
    } catch (e) {
      console.warn('Upsert google user error:', e);
    }

    return {
      user: {
        id: userRow?.id || 'usr-google-' + Date.now(),
        name: name || username,
        username: username,
        email: email,
        avatar: avatar || null,
        role: 'Admin / Owner',
        provider: 'google'
      },
      company: {
        id: companyData.id,
        name: companyData.company_name,
        code: companyData.company_code,
        phone: companyData.phone || '0812-4567-8901',
        email: companyData.email || email,
        address: companyData.address || 'Manado, Sulawesi Utara',
        bankInfo: {
          bankName: companyData.bank_name || 'BCA',
          accountNumber: companyData.account_number || '',
          accountHolder: companyData.account_holder || companyData.company_name
        },
        signatureName: companyData.signature_name || name,
        signatureTitle: companyData.signature_title || 'Owner / Direktur',
        logoUrl: companyData.logo_url || '/logo.jpg',
        signatureUrl: companyData.signature_url || '',
        stampUrl: companyData.stamp_url || ''
      }
    };
  },

  // Company Profile Update in Supabase
  async updateCompanyProfile(companyCode, profileData) {
    try {
      const payload = {
        company_name: profileData.companyName,
        company_code: profileData.companyCode,
        phone: profileData.phone,
        email: profileData.email,
        address: profileData.address,
        bank_name: profileData.bankInfo?.bankName,
        account_number: profileData.bankInfo?.accountNumber,
        account_holder: profileData.bankInfo?.accountHolder,
        signature_name: profileData.signatureName,
        signature_title: profileData.signatureTitle,
        logo_url: profileData.logoUrl,
        signature_url: profileData.signatureUrl,
        stamp_url: profileData.stampUrl
      };

      let query = supabase.from('companies').update(payload);
      if (profileData.companyId) {
        query = query.eq('id', profileData.companyId);
      } else {
        query = query.eq('company_code', companyCode);
      }

      const { data, error } = await query.select();
      if (error) throw error;
      return data && data[0];
    } catch (e) {
      console.warn('Supabase updateCompanyProfile error:', e.message);
      return null;
    }
  },

  // User Management CRUD
  async fetchUsers(companyCode) {
    try {
      let query = supabase.from('company_users').select('*').order('created_at', { ascending: false });
      if (companyCode) {
        query = query.eq('company_code', companyCode);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn('fetchUsers Supabase error:', e.message);
      return [];
    }
  },

  async addUser(userData) {
    const { data, error } = await supabase.from('company_users').insert({
      company_name: userData.company,
      company_code: userData.companyCode,
      name: userData.name,
      username: (userData.username || '').toLowerCase().trim(),
      password: userData.password || '123456',
      role: userData.role || 'Staff Administrasi',
      email: userData.email || '',
      status: userData.status || 'Aktif',
      auth_provider: 'password',
      created_at: new Date().toISOString()
    }).select();

    if (error) throw error;
    return data && data[0];
  },

  async updateUser(id, updates) {
    const payload = { ...updates, updated_at: new Date().toISOString() };
    delete payload.id;
    const { data, error } = await supabase.from('company_users').update(payload).eq('id', id).select();
    if (error) throw error;
    return data && data[0];
  },

  async deleteUser(id) {
    const { error } = await supabase.from('company_users').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
};
