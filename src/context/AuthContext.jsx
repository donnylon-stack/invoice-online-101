import React, { createContext, useContext, useState, useEffect } from 'react';
import { generateCompanyAcronym } from '../utils/numbering';
import { supabaseService } from '../lib/supabaseService';

const AuthContext = createContext();

const SESSION_KEY = 'io101_auth_session';
const USERS_DB_KEY = 'io101_users_database';
const COMPANIES_DB_KEY = 'io101_companies_database';

const DEFAULT_SEED_COMPANIES = [
  {
    id: 'c101-homycare-default',
    company_name: 'Homy Care Manado',
    company_code: 'HCM',
    phone: '0812-4567-8901',
    email: 'homycaremanado@gmail.com',
    address: 'Jl. Sam Ratulangi No. 101, Manado, Sulawesi Utara',
    bank_name: 'BCA',
    account_number: '7890123456',
    account_holder: 'Homy Care Manado',
    signature_name: 'Tri HomyCare',
    signature_title: 'Direktur Utama',
    logo_url: '/logo.jpg',
    signature_url: '',
    stamp_url: '',
    created_at: new Date().toISOString()
  }
];

export function AuthProvider({ children }) {
  // Load users from storage or initialize empty
  const [allUsers, setAllUsers] = useState(() => {
    try {
      const saved = localStorage.getItem(USERS_DB_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load users DB', e);
    }
    return [];
  });

  // Load companies from storage or initialize with defaults
  const [companies, setCompanies] = useState(() => {
    try {
      const saved = localStorage.getItem(COMPANIES_DB_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load companies DB', e);
    }
    return DEFAULT_SEED_COMPANIES;
  });

  // Current logged in session
  const [session, setSession] = useState(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load auth session', e);
    }
    return null;
  });

  // Save session changes
  useEffect(() => {
    if (session) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }, [session]);

  // Save users database
  useEffect(() => {
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(allUsers));
  }, [allUsers]);

  // Save companies database
  useEffect(() => {
    localStorage.setItem(COMPANIES_DB_KEY, JSON.stringify(companies));
  }, [companies]);

  // Normalizer helper: removes spaces and converts to lowercase
  const normalizeCompany = (name) => {
    if (!name) return '';
    return name.trim().toLowerCase().replace(/\s+/g, '');
  };

  // Sync companies from Supabase
  const fetchCompaniesList = async () => {
    try {
      const dbCompanies = await supabaseService.fetchCompanies();
      if (Array.isArray(dbCompanies) && dbCompanies.length > 0) {
        setCompanies(dbCompanies);
        localStorage.setItem(COMPANIES_DB_KEY, JSON.stringify(dbCompanies));
      }
    } catch (err) {
      console.warn('Sync companies warning:', err.message);
    }
  };

  useEffect(() => {
    fetchCompaniesList();
  }, []);

  // Fetch users from Supabase when logged in
  useEffect(() => {
    if (session?.companyCode && session?.companyCode !== 'HQ') {
      supabaseService.fetchUsers(session.companyCode)
        .then(users => {
          if (Array.isArray(users) && users.length > 0) {
            setAllUsers(users);
          }
        })
        .catch(err => console.warn('Fetch Supabase users warning:', err.message));
    }
  }, [session]);

  // Listen for Supabase OAuth callback (e.g. from Google sign-in redirect)
  useEffect(() => {
    import('../lib/supabase').then(({ supabase }) => {
      supabase.auth.getSession().then(({ data: { session: supaSession } }) => {
        if (supaSession?.user && !session) {
          const u = supaSession.user;
          loginWithGoogle({
            email: u.email,
            name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0],
            avatar: u.user_metadata?.avatar_url,
            company: 'Homy Care Manado'
          }).catch(e => console.warn('Auto google sync error:', e));
        }
      });

      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, supaSession) => {
        if (event === 'SIGNED_IN' && supaSession?.user) {
          const u = supaSession.user;
          try {
            await loginWithGoogle({
              email: u.email,
              name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0],
              avatar: u.user_metadata?.avatar_url,
              company: 'Homy Care Manado'
            });
          } catch (e) {
            console.warn('OAuth sign in backend sync error:', e);
          }
        }
      });

      return () => {
        authListener?.subscription?.unsubscribe();
      };
    }).catch(err => console.warn('Supabase auth listener init error:', err));
  }, []);

  /**
   * Login via direct Supabase client (100% Client-Side Serverless)
   */
  const login = async (companyInput, userInput, passwordInput) => {
    if (!companyInput?.trim() || !userInput?.trim()) {
      throw new Error('Nama Perusahaan dan Nama User wajib diisi!');
    }

    const { user, company } = await supabaseService.loginUser(companyInput, userInput, passwordInput);

    const isSA = (user.role || '').toLowerCase().includes('super admin') || user.isSuperAdmin === true;

    const userSession = {
      userId: user.id,
      companyId: company.id,
      companyMatch: normalizeCompany(company.name),
      companyName: company.name,
      companyCode: company.code,
      userName: user.name,
      username: user.username,
      role: user.role,
      isSuperAdmin: isSA,
      isSwitched: false,
      email: user.email,
      provider: user.provider || 'password',
      phone: company.phone || '0812-4567-8901',
      address: company.address || 'Manado, Sulawesi Utara',
      logoUrl: company.logoUrl || '/logo.jpg',
      signatureUrl: company.signatureUrl || '',
      stampUrl: company.stampUrl || '',
      bankInfo: company.bankInfo || {
        bankName: 'BCA',
        accountNumber: '7890123456',
        accountHolder: company.name
      },
      signatureName: company.signatureName || user.name,
      signatureTitle: company.signatureTitle || user.role,
      loggedInAt: new Date().toISOString()
    };

    setSession(userSession);
    return userSession;
  };

  /**
   * Login as Super Admin (Multi-Tenant Master Portal)
   */
  const loginSuperAdmin = async (userInput, passwordInput) => {
    if (!userInput?.trim() || !passwordInput?.trim()) {
      throw new Error('Username dan Password Super Admin wajib diisi!');
    }

    const { user } = await supabaseService.loginSuperAdmin(userInput, passwordInput);

    const superAdminSession = {
      userId: user.id,
      companyId: null,
      companyMatch: 'superadmin',
      companyName: 'Super Admin HQ',
      companyCode: 'HQ',
      userName: user.name,
      username: user.username,
      role: 'Super Admin',
      isSuperAdmin: true,
      isSwitched: false,
      email: user.email,
      provider: 'superadmin',
      phone: '0812-4567-8901',
      address: 'Pusat Kontrol Sistem Multi-Perusahaan',
      logoUrl: '/logo.jpg',
      signatureUrl: '',
      stampUrl: '',
      bankInfo: {
        bankName: 'BCA',
        accountNumber: '-',
        accountHolder: 'Pusat Kontrol Multi-Perusahaan'
      },
      signatureName: user.name,
      signatureTitle: 'Super Administrator',
      loggedInAt: new Date().toISOString()
    };

    setSession(superAdminSession);
    return superAdminSession;
  };

  /**
   * Switch Context to Impersonate / Manage a Company (Super Admin Feature)
   */
  const switchCompany = (targetCompany) => {
    if (!session?.isSuperAdmin) return;
    setSession(prev => ({
      ...prev,
      companyId: targetCompany.id,
      companyMatch: normalizeCompany(targetCompany.company_name || targetCompany.name),
      companyName: targetCompany.company_name || targetCompany.name,
      companyCode: targetCompany.company_code || targetCompany.code,
      phone: targetCompany.phone || '0812-4567-8901',
      email: targetCompany.email || prev.email,
      address: targetCompany.address || 'Manado, Sulawesi Utara',
      logoUrl: targetCompany.logo_url || targetCompany.logoUrl || '/logo.jpg',
      signatureUrl: targetCompany.signature_url || targetCompany.signatureUrl || '',
      stampUrl: targetCompany.stamp_url || targetCompany.stampUrl || '',
      bankInfo: {
        bankName: targetCompany.bank_name || targetCompany.bankInfo?.bankName || 'BCA',
        accountNumber: targetCompany.account_number || targetCompany.bankInfo?.accountNumber || '',
        accountHolder: targetCompany.account_holder || targetCompany.bankInfo?.accountHolder || (targetCompany.company_name || targetCompany.name)
      },
      signatureName: targetCompany.signature_name || targetCompany.signatureName || prev.userName,
      signatureTitle: targetCompany.signature_title || targetCompany.signatureTitle || 'Direktur',
      isSuperAdmin: true,
      isSwitched: true
    }));
  };

  /**
   * Exit Company Switch and return to Super Admin HQ
   */
  const exitCompanySwitch = () => {
    if (!session?.isSuperAdmin) return;
    setSession(prev => ({
      ...prev,
      companyId: null,
      companyMatch: 'superadmin',
      companyName: 'Super Admin HQ',
      companyCode: 'HQ',
      isSwitched: false
    }));
  };

  /**
   * Login with Google / Gmail via direct Supabase client
   */
  const loginWithGoogle = async ({ email, name, avatar, company }) => {
    if (!email || !email.includes('@')) {
      throw new Error('Alamat email Gmail tidak valid!');
    }

    const { user, company: comp } = await supabaseService.loginGoogleUser({
      email: email.trim(),
      name: name ? name.trim() : email.split('@')[0],
      avatar: avatar || null,
      company: company ? company.trim() : 'Homy Care Manado'
    });

    const userSession = {
      userId: user.id,
      companyId: comp.id,
      companyMatch: normalizeCompany(comp.name),
      companyName: comp.name,
      companyCode: comp.code,
      userName: user.name,
      username: user.username,
      role: user.role,
      email: user.email,
      avatar: user.avatar,
      provider: 'google',
      phone: comp.phone || '0812-4567-8901',
      address: comp.address || 'Manado, Sulawesi Utara',
      logoUrl: comp.logoUrl || '/logo.jpg',
      signatureUrl: comp.signatureUrl || '',
      stampUrl: comp.stampUrl || '',
      bankInfo: comp.bankInfo || {
        bankName: 'BCA',
        accountNumber: '7890123456',
        accountHolder: comp.name
      },
      signatureName: comp.signatureName || user.name,
      signatureTitle: comp.signatureTitle || user.role,
      loggedInAt: new Date().toISOString()
    };

    setSession(userSession);
    return userSession;
  };

  /**
   * Dedicated Superadmin Login
   */
  const loginSuperadmin = async (username, password, pin) => {
    const { user, company } = await supabaseService.loginSuperadmin(username, password, pin);

    const userSession = {
      userId: user.id,
      companyId: company.id,
      companyMatch: 'all',
      companyName: company.name,
      companyCode: company.code,
      userName: user.name,
      username: user.username,
      role: 'Superadmin',
      isSuperadmin: true,
      email: user.email,
      provider: 'superadmin',
      phone: company.phone || '0812-4567-8901',
      address: company.address || 'Pusat Kontrol Superadmin Invoice Online 101',
      logoUrl: company.logoUrl || '/logo.jpg',
      signatureUrl: company.signatureUrl || '',
      stampUrl: company.stampUrl || '',
      bankInfo: company.bankInfo || {
        bankName: 'BCA',
        accountNumber: '7890123456',
        accountHolder: company.name
      },
      signatureName: company.signatureName || user.name,
      signatureTitle: 'Super Administrator',
      loggedInAt: new Date().toISOString()
    };

    setSession(userSession);
    return userSession;
  };

  const logout = async () => {
    try {
      const { supabase } = await import('../lib/supabase');
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase signOut notice:', e.message);
    }
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
  };

  const updateProfile = (updatedData) => {
    setSession(prev => {
      const next = {
        ...prev,
        ...updatedData
      };
      if (next.companyCode) {
        supabaseService.updateCompanyProfile(next.companyCode, next);
      }
      return next;
    });
  };

  // --- CRUD USER MANAGEMENT (DIRECT SUPABASE CLIENT) ---
  const companyUsers = allUsers;

  const addUser = async (userData) => {
    if (!session) return;
    const newUser = await supabaseService.addUser({
      company: session.companyName,
      companyCode: session.companyCode,
      ...userData
    });

    if (newUser) {
      setAllUsers(prev => [newUser, ...prev]);
    }
    return newUser;
  };

  const updateUser = async (id, updatedFields) => {
    const updated = await supabaseService.updateUser(id, updatedFields);
    if (updated) {
      setAllUsers(prev => prev.map(u => (u.id === id ? updated : u)));
    }

    if (session && session.userId === id) {
      setSession(s => ({
        ...s,
        userName: updated?.name || s.userName,
        role: updated?.role || s.role,
        signatureName: updated?.name || s.signatureName
      }));
    }
    return updated;
  };

  const deleteUser = async (id) => {
    if (session && session.userId === id) {
      throw new Error('Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif!');
    }

    await supabaseService.deleteUser(id);
    setAllUsers(prev => prev.filter(u => u.id !== id));
  };

  // --- CRUD COMPANY MANAGEMENT (SUPER ADMIN) ---
  const createCompany = async (companyData) => {
    const saved = await supabaseService.createCompany(companyData);
    if (saved) {
      setCompanies(prev => {
        const next = [saved, ...prev.filter(c => c.id !== saved.id)];
        localStorage.setItem(COMPANIES_DB_KEY, JSON.stringify(next));
        return next;
      });
    }
    return saved;
  };

  const updateCompany = async (id, updatedFields) => {
    const updated = await supabaseService.updateCompany(id, updatedFields);
    if (updated) {
      setCompanies(prev => {
        const next = prev.map(c => (c.id === id ? { ...c, ...updated } : c));
        localStorage.setItem(COMPANIES_DB_KEY, JSON.stringify(next));
        return next;
      });

      // Jika Super Admin sedang aktif mengelola perusahaan ini, perbarui sesi aktif juga
      if (session && session.companyId === id) {
        setSession(prev => ({
          ...prev,
          companyName: updated.company_name || prev.companyName,
          companyCode: updated.company_code || prev.companyCode,
          phone: updated.phone !== undefined ? updated.phone : prev.phone,
          email: updated.email !== undefined ? updated.email : prev.email,
          address: updated.address !== undefined ? updated.address : prev.address,
          logoUrl: updated.logo_url !== undefined ? updated.logo_url : prev.logoUrl,
          bankInfo: {
            bankName: updated.bank_name || prev.bankInfo?.bankName,
            accountNumber: updated.account_number || prev.bankInfo?.accountNumber,
            accountHolder: updated.account_holder || prev.bankInfo?.accountHolder
          },
          signatureName: updated.signature_name || prev.signatureName,
          signatureTitle: updated.signature_title || prev.signatureTitle
        }));
      }
    }
    return updated;
  };

  const deleteCompany = async (id) => {
    if (session && session.companyId === id && !session.isSwitched) {
      throw new Error('Anda tidak dapat menghapus perusahaan yang sedang aktif!');
    }

    await supabaseService.deleteCompany(id);
    setCompanies(prev => {
      const next = prev.filter(c => c.id !== id);
      localStorage.setItem(COMPANIES_DB_KEY, JSON.stringify(next));
      return next;
    });

    if (session && session.companyId === id && session.isSwitched) {
      exitCompanySwitch();
    }
    return true;
  };

  return (
    <AuthContext.Provider value={{
      session,
      isAuthenticated: !!session,
      isSuperadmin: session?.role === 'Superadmin' || session?.isSuperadmin === true || Boolean(session?.isSuperAdmin),
      isSuperAdmin: session?.role === 'Superadmin' || session?.isSuperadmin === true || Boolean(session?.isSuperAdmin),
      login,
      loginSuperAdmin,
      loginWithGoogle,
      loginSuperadmin,
      logout,
      updateProfile,
      switchCompany,
      exitCompanySwitch,
      // Company Management (Super Admin)
      companies,
      fetchCompaniesList,
      createCompany,
      updateCompany,
      deleteCompany,
      // User Management
      companyUsers,
      addUser,
      updateUser,
      deleteUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
