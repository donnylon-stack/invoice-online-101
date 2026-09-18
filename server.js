import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Supabase Server Client
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_API_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

app.use(cors());
app.use(express.json());

// Persistent storage file for company users
const USERS_FILE = path.resolve('data/company_users.json');

function loadLocalUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, 'utf-8');
      return JSON.parse(raw || '[]');
    }
  } catch (e) {
    console.warn('Load local users warning:', e.message);
  }
  return [];
}

function saveLocalUsers(users) {
  try {
    const dir = path.dirname(USERS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Save local users warning:', e.message);
  }
}

// Fetch users from Supabase table `company_users` or fallback file DB
async function getCompanyUsersFromDatabase() {
  try {
    const { data: dbUsers, error } = await supabase
      .from('company_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(dbUsers) && dbUsers.length > 0) {
      return dbUsers;
    }
  } catch (e) {
    console.warn('Query company_users from Supabase:', e.message);
  }
  return loadLocalUsers();
}

// Normalize company string helper
function normalizeCompany(str) {
  if (!str) return '';
  return str.trim().toLowerCase().replace(/\s+/g, '');
}

// ==========================================
// 1. HEALTH CHECK & STATUS
// ==========================================
app.get('/api/health', async (req, res) => {
  try {
    const { data, error } = await supabase.from('companies').select('count', { count: 'exact', head: true });
    res.json({
      status: 'online',
      backend: 'Express Node.js Server',
      database: error ? 'error: ' + error.message : 'connected to Supabase lzjonriodmldardqlhit',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ==========================================
// 2. AUTHENTICATION (100% FROM DATABASE, NO HARDCODE)
// ==========================================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { company, username, password } = req.body;
    if (!company || !username || !password) {
      return res.status(400).json({ error: 'Nama/Kode Perusahaan, Username, dan Password wajib diisi!' });
    }

    const normCompany = normalizeCompany(company);
    const normUser = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    // 1. Ambil data perusahaan murni dari tabel 'companies' di database Supabase
    let { data: companies, error: compErr } = await supabase.from('companies').select('*');
    if (compErr) {
      console.warn('Supabase fetch companies error:', compErr.message);
    }

    // Cari perusahaan berdasarkan nama atau kode yang tersimpan di database
    let companyData = (companies || []).find(c => 
      normalizeCompany(c.company_name) === normCompany || 
      c.company_code?.toLowerCase() === normCompany
    );

    if (!companyData) {
      return res.status(404).json({
        error: `Perusahaan "${company}" tidak ditemukan di database. Pastikan nama atau kode perusahaan sudah terdaftar di database Supabase.`
      });
    }

    // 2. Ambil data pengguna murni dari database (Supabase company_users / database store)
    const allUsers = await getCompanyUsersFromDatabase();
    
    // Cari user yang sesuai dengan username dan perusahaan
    const userRow = allUsers.find(u => {
      const matchUser = u.username?.trim().toLowerCase() === normUser;
      const matchComp = 
        normalizeCompany(u.company_name) === normalizeCompany(companyData.company_name) ||
        u.company_code?.toLowerCase() === companyData.company_code?.toLowerCase() ||
        u.company_id === companyData.id;
      return matchUser && matchComp;
    });

    if (!userRow) {
      return res.status(404).json({
        error: `User "${username}" tidak terdaftar di database untuk perusahaan ${companyData.company_name}.`
      });
    }

    // 3. Verifikasi password dari record database (TIDAK DI-HARDCODE)
    if (userRow.password !== cleanPassword) {
      return res.status(401).json({ error: 'Password salah! Silakan periksa kembali password yang tersimpan di database.' });
    }

    // 4. Verifikasi status akun dari database
    if (userRow.status && userRow.status !== 'Aktif') {
      return res.status(403).json({ error: 'Akun ini berstatus nonaktif di database. Hubungi Administrator.' });
    }

    // 5. Kembalikan session dari data yang tersimpan di database
    return res.json({
      success: true,
      user: {
        id: userRow.id,
        name: userRow.name,
        username: userRow.username,
        role: userRow.role,
        email: userRow.email,
        provider: userRow.auth_provider || 'password'
      },
      company: {
        id: companyData.id,
        name: companyData.company_name,
        code: companyData.company_code,
        phone: companyData.phone,
        email: companyData.email,
        address: companyData.address,
        bankInfo: {
          bankName: companyData.bank_name || 'BCA',
          accountNumber: companyData.account_number || '',
          accountHolder: companyData.account_holder || companyData.company_name
        },
        signatureName: companyData.signature_name || userRow.name,
        signatureTitle: companyData.signature_title || userRow.role
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan sistem: ' + err.message });
  }
});

// ==========================================
// 2B. GOOGLE / GMAIL LOGIN (DARI DATABASE)
// ==========================================
app.post('/api/auth/google', async (req, res) => {
  try {
    const { email, name, avatar, company } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email Google wajib disertakan!' });
    }

    const normCompany = company ? normalizeCompany(company) : '';
    const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');

    // 1. Ambil data perusahaan dari tabel companies di database
    let { data: companies } = await supabase.from('companies').select('*');
    let companyData = (companies || []).find(c => 
      normCompany && (normalizeCompany(c.company_name) === normCompany || c.company_code?.toLowerCase() === normCompany)
    ) || (companies && companies[0]);

    if (!companyData) {
      return res.status(404).json({
        error: 'Data perusahaan belum tersedia di tabel companies database Supabase.'
      });
    }

    // 2. Simpan atau perbarui user di database company_users
    let userRow = {
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

    try {
      const { data: upserted, error: upErr } = await supabase.from('company_users').upsert(userRow).select();
      if (!upErr && upserted && upserted[0]) {
        userRow = upserted[0];
      } else {
        throw new Error(upErr?.message || 'Fallback to file storage');
      }
    } catch (e) {
      const localUsers = loadLocalUsers();
      const existingIdx = localUsers.findIndex(u => u.email === email && u.company_code === companyData.company_code);
      if (existingIdx !== -1) {
        localUsers[existingIdx] = { ...localUsers[existingIdx], ...userRow };
        userRow = localUsers[existingIdx];
      } else {
        userRow.id = 'usr-google-' + Date.now();
        userRow.created_at = new Date().toISOString();
        localUsers.push(userRow);
      }
      saveLocalUsers(localUsers);
    }

    return res.json({
      success: true,
      user: {
        id: userRow.id,
        name: userRow.name,
        username: userRow.username,
        email: userRow.email,
        avatar: avatar || null,
        role: userRow.role,
        provider: 'google'
      },
      company: {
        id: companyData.id,
        name: companyData.company_name,
        code: companyData.company_code,
        phone: companyData.phone,
        email: companyData.email,
        address: companyData.address,
        bankInfo: {
          bankName: companyData.bank_name || 'BCA',
          accountNumber: companyData.account_number || '',
          accountHolder: companyData.account_holder || companyData.company_name
        },
        signatureName: companyData.signature_name || name,
        signatureTitle: companyData.signature_title || 'Owner / Direktur'
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. USER MANAGEMENT (CRUD DI DATABASE)
// ==========================================
app.get('/api/users', async (req, res) => {
  try {
    const { company } = req.query;
    let users = await getCompanyUsersFromDatabase();
    if (company) {
      const norm = normalizeCompany(company);
      users = users.filter(u => normalizeCompany(u.company_name) === norm || u.company_code?.toLowerCase() === norm);
    }
    res.json(users);
  } catch (e) {
    res.json(loadLocalUsers());
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { company, companyCode, name, username, password, role, email, status } = req.body;
    const normUser = username.trim().toLowerCase();

    const row = {
      company_name: company,
      company_code: companyCode,
      name: name.trim(),
      username: normUser,
      password: password ? password.trim() : '123456',
      role: role || 'Staff Administrasi',
      email: email || '',
      status: status || 'Aktif',
      auth_provider: 'password',
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase.from('company_users').insert(row).select();
      if (!error && data && data[0]) {
        return res.json(data[0]);
      }
    } catch (e) {
      // ignore
    }

    const localUsers = loadLocalUsers();
    const mem = { id: 'usr-' + Date.now(), ...row };
    localUsers.unshift(mem);
    saveLocalUsers(localUsers);
    res.json(mem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body, updated_at: new Date().toISOString() };
    delete updates.id;

    try {
      const { data, error } = await supabase.from('company_users').update(updates).eq('id', id).select();
      if (!error && data && data[0]) {
        return res.json(data[0]);
      }
    } catch (e) {
      // ignore
    }

    const localUsers = loadLocalUsers();
    const idx = localUsers.findIndex(u => u.id === id);
    if (idx !== -1) {
      localUsers[idx] = { ...localUsers[idx], ...updates };
      saveLocalUsers(localUsers);
      return res.json(localUsers[idx]);
    }
    res.json({ id, ...updates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    try {
      await supabase.from('company_users').delete().eq('id', id);
    } catch (e) {
      // ignore
    }
    const localUsers = loadLocalUsers();
    const filtered = localUsers.filter(u => u.id !== id);
    saveLocalUsers(filtered);
    res.json({ success: true, message: 'User berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. INVOICES (SERVER-SIDE WITH SUPABASE)
// ==========================================
app.get('/api/invoices', async (req, res) => {
  try {
    const { companyCode } = req.query;
    let query = supabase.from('invoices').select('*').order('created_at', { ascending: false });
    if (companyCode) {
      query = query.eq('company_code', companyCode);
    }
    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/invoices', async (req, res) => {
  try {
    const inv = req.body;
    const currentYear = new Date().getFullYear();
    const code = inv.company_code || inv.companyCode || 'HCM';

    // Calculate next sequence on backend server
    const { data: existing } = await supabase
      .from('invoices')
      .select('sequence_number')
      .eq('company_code', code);

    const maxSeq = (existing || []).reduce((max, item) => {
      const seq = Number(item.sequence_number) || 0;
      return seq > max ? seq : max;
    }, 0);

    const nextSeq = maxSeq + 1;
    const formattedNumber = `INV-${code}-${currentYear}-${String(nextSeq).padStart(6, '0')}`;

    const row = {
      number: inv.number || formattedNumber,
      sequence_number: nextSeq,
      company_code: code,
      company_name: inv.company_name || inv.companyName || 'Homy Care Manado',
      issue_date: inv.issue_date || inv.issueDate || new Date().toISOString().split('T')[0],
      due_date: inv.due_date || inv.dueDate,
      status: inv.status || 'UNPAID',
      client_data: inv.client_data || inv.client,
      items: inv.items,
      subtotal: inv.subtotal,
      discount_percent: inv.discount_percent || inv.discountPercent || 0,
      discount_amount: inv.discount_amount || inv.discountAmount || 0,
      tax_percent: inv.tax_percent !== undefined ? inv.tax_percent : 11,
      tax_amount: inv.tax_amount || inv.taxAmount || 0,
      grand_total: inv.grand_total || inv.grandTotal,
      notes: inv.notes || '',
      payment_terms: inv.payment_terms || inv.paymentTerms || '',
      linked_quotation_number: inv.linked_quotation_number || inv.linkedQuotationNumber || null,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from('invoices').insert(row).select();
    if (error) throw error;
    res.json(data ? data[0] : row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/invoices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body, updated_at: new Date().toISOString() };
    delete updates.id;
    const { data, error } = await supabase.from('invoices').update(updates).eq('id', id).select();
    if (error) throw error;
    res.json(data ? data[0] : updates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/invoices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. QUOTATIONS (SERVER-SIDE WITH SUPABASE)
// ==========================================
app.get('/api/quotations', async (req, res) => {
  try {
    const { companyCode } = req.query;
    let query = supabase.from('quotations').select('*').order('created_at', { ascending: false });
    if (companyCode) {
      query = query.eq('company_code', companyCode);
    }
    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/quotations', async (req, res) => {
  try {
    const quo = req.body;
    const currentYear = new Date().getFullYear();
    const code = quo.company_code || quo.companyCode || 'HCM';

    // Sequence calculation on server
    const { data: existing } = await supabase
      .from('quotations')
      .select('sequence_number')
      .eq('company_code', code);

    const maxSeq = (existing || []).reduce((max, item) => {
      const seq = Number(item.sequence_number) || 0;
      return seq > max ? seq : max;
    }, 0);

    const nextSeq = maxSeq + 1;
    const formattedNumber = `QUO-${code}-${currentYear}-${String(nextSeq).padStart(6, '0')}`;

    const row = {
      number: quo.number || formattedNumber,
      sequence_number: nextSeq,
      company_code: code,
      company_name: quo.company_name || quo.companyName || 'Homy Care Manado',
      issue_date: quo.issue_date || quo.issueDate || new Date().toISOString().split('T')[0],
      valid_until: quo.valid_until || quo.validUntil,
      status: quo.status || 'SENT',
      client_data: quo.client_data || quo.client,
      items: quo.items,
      subtotal: quo.subtotal,
      discount_percent: quo.discount_percent || quo.discountPercent || 0,
      discount_amount: quo.discount_amount || quo.discountAmount || 0,
      tax_percent: quo.tax_percent !== undefined ? quo.tax_percent : 11,
      tax_amount: quo.tax_amount || quo.taxAmount || 0,
      grand_total: quo.grand_total || quo.grandTotal,
      notes: quo.notes || '',
      payment_terms: quo.payment_terms || quo.paymentTerms || '',
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from('quotations').insert(row).select();
    if (error) throw error;
    res.json(data ? data[0] : row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/quotations/:id/convert', async (req, res) => {
  try {
    const { id } = req.params;
    const { data: quoRows, error: fetchErr } = await supabase.from('quotations').select('*').eq('id', id);
    if (fetchErr || !quoRows || quoRows.length === 0) {
      return res.status(404).json({ error: 'Penawaran tidak ditemukan' });
    }
    const quote = quoRows[0];
    const currentYear = new Date().getFullYear();
    const code = quote.company_code || 'HCM';

    // Sequence calculation for invoice
    const { data: existingInvs } = await supabase
      .from('invoices')
      .select('sequence_number')
      .eq('company_code', code);

    const maxSeq = (existingInvs || []).reduce((max, item) => {
      const seq = Number(item.sequence_number) || 0;
      return seq > max ? seq : max;
    }, 0);
    const nextSeq = maxSeq + 1;
    const invNumber = `INV-${code}-${currentYear}-${String(nextSeq).padStart(6, '0')}`;

    const newInvoice = {
      number: invNumber,
      sequence_number: nextSeq,
      company_code: code,
      company_name: quote.company_name,
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'UNPAID',
      client_data: quote.client_data,
      items: quote.items,
      subtotal: quote.subtotal,
      discount_percent: quote.discount_percent,
      discount_amount: quote.discount_amount,
      tax_percent: quote.tax_percent,
      tax_amount: quote.tax_amount,
      grand_total: quote.grand_total,
      notes: `Dikonversi dari Penawaran #${quote.number}. ${quote.notes || ''}`,
      payment_terms: quote.payment_terms,
      linked_quotation_number: quote.number,
      created_at: new Date().toISOString()
    };

    const { data: createdInv, error: invErr } = await supabase.from('invoices').insert(newInvoice).select();
    if (invErr) throw invErr;

    // Update quotation status
    await supabase.from('quotations').update({
      status: 'ACCEPTED',
      converted_to_invoice_number: invNumber,
      updated_at: new Date().toISOString()
    }).eq('id', id);

    res.json(createdInv ? createdInv[0] : newInvoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6. CATALOG ITEMS (BARANG & JASA)
// ==========================================
app.get('/api/catalog', async (req, res) => {
  try {
    const { data, error } = await supabase.from('catalog_items').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/catalog', async (req, res) => {
  try {
    const item = req.body;
    const row = {
      type: item.type || 'JASA',
      code: item.code,
      name: item.name,
      category: item.category,
      price: item.price || 0,
      unit: item.unit || 'Unit',
      description: item.description || '',
      created_at: new Date().toISOString()
    };
    const { data, error } = await supabase.from('catalog_items').insert(row).select();
    if (error) throw error;
    res.json(data ? data[0] : row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/catalog/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('catalog_items').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 7. CLIENTS
// ==========================================
app.get('/api/clients', async (req, res) => {
  try {
    const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/clients', async (req, res) => {
  try {
    const c = req.body;
    const row = {
      name: c.name,
      contact_person: c.contactPerson || c.contact_person,
      email: c.email,
      phone: c.phone,
      address: c.address,
      created_at: new Date().toISOString()
    };
    const { data, error } = await supabase.from('clients').insert(row).select();
    if (error) throw error;
    res.json(data ? data[0] : row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Invoice Online 101 Backend Server running on http://localhost:${PORT}`);
  console.log(`🔗 Connected to Supabase: ${supabaseUrl}`);
});
