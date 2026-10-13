import React, { createContext, useContext, useState, useEffect } from 'react';
import { generateCompanyAcronym } from '../utils/numbering';
import { supabaseService } from '../lib/supabaseService';

const AuthContext = createContext();

const SESSION_KEY = 'io101_auth_session';
const USERS_DB_KEY = 'io101_users_database';

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

  // Companies state for Superadmin
  const [companies, setCompanies] = useState([]);

  // Save session changes
  useEffect(() => {
    if (session) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      if (session.isSuperadmin) {
        supabaseService.fetchCompanies().then(setCompanies).catch(() => {});
        supabaseService.fetchUsers('ALL').then(setAllUsers).catch(() => {});
      }
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }, [session]);

  // Save users database
  useEffect(() => {
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(allUsers));
  }, [allUsers]);

  // Normalizer helper: removes spaces and converts to lowercase
  const normalizeCompany = (name) => {
    if (!name) return '';
    return name.trim().toLowerCase().replace(/\s+/g, '');
  };

  // Fetch users from Supabase when logged in
  useEffect(() => {
    if (session?.companyCode) {
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

    const userSession = {
      userId: user.id,
      companyId: company.id,
      companyMatch: normalizeCompany(company.name),
      companyName: company.name,
      companyCode: company.code,
      userName: user.name,
      username: user.username,
      role: user.role,
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

  // --- CRUD COMPANIES & STATUS (SUPERADMIN ONLY) ---
  const fetchCompanies = async () => {
    const list = await supabaseService.fetchCompanies();
    setCompanies(list);
    return list;
  };

  const createCompany = async (compData) => {
    const created = await supabaseService.createCompany(compData);
    if (created) {
      setCompanies(prev => [created, ...prev]);
    }
    return created;
  };

  const updateCompany = async (id, compData) => {
    const updated = await supabaseService.updateCompany(id, compData);
    if (updated) {
      setCompanies(prev => prev.map(c => c.id === id ? updated : c));
    }
    return updated;
  };

  const toggleCompanyStatus = async (id, newStatus) => {
    const updated = await supabaseService.toggleCompanyStatus(id, newStatus);
    if (updated) {
      setCompanies(prev => prev.map(c => c.id === id ? updated : c));
    }
    return updated;
  };

  const deleteCompany = async (id) => {
    await supabaseService.deleteCompany(id);
    setCompanies(prev => prev.filter(c => c.id !== id));
  };

  const switchCompany = (comp) => {
    if (!comp) return;
    setSession(prev => ({
      ...prev,
      companyId: comp.id,
      companyName: comp.company_name || comp.name,
      companyCode: comp.company_code || comp.code,
      phone: comp.phone || prev?.phone,
      email: comp.email || prev?.email,
      address: comp.address || prev?.address,
      bankInfo: {
        bankName: comp.bank_name || 'BCA',
        accountNumber: comp.account_number || '',
        accountHolder: comp.account_holder || comp.company_name
      },
      logoUrl: comp.logo_url || prev?.logoUrl
    }));
  };

  const fetchAllUsers = async () => {
    const users = await supabaseService.fetchUsers('ALL');
    setAllUsers(users);
    return users;
  };

  return (
    <AuthContext.Provider value={{
      session,
      isAuthenticated: !!session,
      isSuperadmin: session?.role === 'Superadmin' || session?.isSuperadmin === true,
      login,
      loginWithGoogle,
      loginSuperadmin,
      logout,
      updateProfile,
      // User Management
      allUsers,
      fetchAllUsers,
      companyUsers,
      addUser,
      updateUser,
      deleteUser,
      // Company Management (Superadmin Only)
      companies,
      fetchCompanies,
      createCompany,
      updateCompany,
      toggleCompanyStatus,
      deleteCompany,
      switchCompany
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
