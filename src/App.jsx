import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { useInvoice } from './context/InvoiceContext';
import AuthView from './components/AuthView';
import SuperAdminConsole from './components/SuperAdminConsole';
import { ShieldAlert, LogOut } from 'lucide-react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import InvoiceList from './components/InvoiceList';
import QuotationList from './components/QuotationList';
import ClientManager from './components/ClientManager';
import ItemManager from './components/ItemManager';
import CompanySettings from './components/CompanySettings';
import DocumentEditor from './components/DocumentEditor';
import DocumentPreview from './components/DocumentPreview';
import MobileBottomNav from './components/MobileBottomNav';
import OfflineBlocker from './components/OfflineBlocker';

export default function App() {
  const { isAuthenticated, session, logout } = useAuth();
  const { cloudStatus, syncWithCloud, isOnline } = useInvoice();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [previewDocument, setPreviewDocument] = useState(null);
  const [editorConfig, setEditorConfig] = useState({
    open: false,
    type: 'INV',
    data: null
  });

  const handleOpenCreate = (type = 'INV') => {
    setEditorConfig({
      open: true,
      type,
      data: null
    });
  };

  const handleOpenEdit = (doc) => {
    setEditorConfig({
      open: true,
      type: doc.type || 'INV',
      data: doc
    });
  };

  const handlePreview = (doc) => {
    setPreviewDocument(doc);
  };

  const handleClosePreview = () => {
    setPreviewDocument(null);
  };

  return (
    <>
      {/* 100% Online Blocker Modal: blocks screen if offline or server is down */}
      <OfflineBlocker 
        isOffline={!isOnline} 
        isServerDown={!cloudStatus?.connected} 
        message={cloudStatus?.message} 
        onRetry={syncWithCloud} 
      />

      {!isAuthenticated ? (
        <AuthView />
      ) : session?.isSuperadmin ? (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
          {/* Superadmin Dedicated Navbar */}
          <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-amber-500/20 shadow-lg px-4 sm:px-8 py-3.5">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
              
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-tr from-amber-500 to-amber-600 rounded-xl text-slate-950 font-bold shadow-md shadow-amber-500/20">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-white tracking-tight text-base sm:text-lg">
                      Invoice Online <span className="text-amber-400">101</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-[10px] uppercase tracking-wider">
                      Root Console
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 -mt-0.5 hidden sm:block">
                    Hanya CRUD Perusahaan, Manajemen User, & Kontrol Aktivasi
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-amber-300">{session?.userName || 'Super Admin Tri'}</div>
                  <div className="text-[10px] text-slate-400 font-mono">@{session?.username || 'superadmintri'}</div>
                </div>

                <button
                  onClick={() => logout()}
                  className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
                  title="Keluar dari Console Super Admin"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar</span>
                </button>
              </div>

            </div>
          </header>

          {/* Main Console Stage */}
          <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8">
            <SuperAdminConsole />
          </main>
        </div>
      ) : (
        <div className="min-h-screen bg-slate-50 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Navbar */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setPreviewDocument(null);
          setActiveTab(tab);
        }}
        onOpenCreate={handleOpenCreate} 
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
        
        {/* Left Sidebar */}
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={(tab) => {
            setPreviewDocument(null);
            setActiveTab(tab);
          }} 
          onOpenCreate={handleOpenCreate} 
        />

        {/* Dynamic Center Stage */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 overflow-y-auto pb-24 md:pb-8">
          {previewDocument ? (
            <DocumentPreview 
              document={previewDocument} 
              onBack={handleClosePreview}
              onEdit={(doc) => {
                handleClosePreview();
                handleOpenEdit(doc);
              }}
            />
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <Dashboard 
                  setActiveTab={setActiveTab}
                  onOpenCreate={handleOpenCreate}
                  onPreviewDocument={handlePreview}
                />
              )}
              {activeTab === 'invoices' && (
                <InvoiceList 
                  onOpenCreate={handleOpenCreate}
                  onPreviewDocument={handlePreview}
                  onEditDocument={handleOpenEdit}
                />
              )}
              {activeTab === 'quotations' && (
                <QuotationList 
                  onOpenCreate={handleOpenCreate}
                  onPreviewDocument={handlePreview}
                  onEditDocument={handleOpenEdit}
                />
              )}
              {activeTab === 'clients' && (
                <ClientManager />
              )}
              {activeTab === 'items' && (
                <ItemManager />
              )}
              {activeTab === 'settings' && (
                <CompanySettings />
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Hidden on desktop) */}
      <MobileBottomNav 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setPreviewDocument(null);
          setActiveTab(tab);
        }} 
        onOpenCreate={handleOpenCreate} 
      />

      {/* Document Creation / Edit Modal */}
      {editorConfig.open && (
        <DocumentEditor 
          type={editorConfig.type}
          initialData={editorConfig.data}
          onClose={() => setEditorConfig({ open: false, type: 'INV', data: null })}
          onSaveSuccess={() => {
            setEditorConfig({ open: false, type: 'INV', data: null });
          }}
        />
      )}
        </div>
      )}
    </>
  );
}

