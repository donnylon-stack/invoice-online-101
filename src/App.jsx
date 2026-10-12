import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { useInvoice } from './context/InvoiceContext';
import AuthView from './components/AuthView';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import InvoiceList from './components/InvoiceList';
import QuotationList from './components/QuotationList';
import ClientManager from './components/ClientManager';
import ItemManager from './components/ItemManager';
import CompanySettings from './components/CompanySettings';
import CompanyManager from './components/CompanyManager';
import DocumentEditor from './components/DocumentEditor';
import DocumentPreview from './components/DocumentPreview';
import MobileBottomNav from './components/MobileBottomNav';
import OfflineBlocker from './components/OfflineBlocker';

export default function App() {
  const { isAuthenticated, session, exitCompanySwitch } = useAuth();
  const { cloudStatus, syncWithCloud, isOnline } = useInvoice();
  
  const [activeTab, setActiveTab] = useState(() => {
    // If Super Admin logged in at HQ mode, default to companies tab
    if (session?.isSuperAdmin && !session?.isSwitched) {
      return 'companies';
    }
    return 'dashboard';
  });
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

      {/* Super Admin Switched Company Notification Banner */}
      {session?.isSuperAdmin && session?.isSwitched && (
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border-b border-indigo-500/30 text-white px-4 py-2.5 text-xs no-print shadow-sm">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
              <span className="text-slate-300">
                Mode Super Admin Aktif: Mengelola workspace <strong className="text-white font-bold">{session.companyName}</strong> (Kode: <span className="font-mono text-amber-300 font-bold">{session.companyCode}</span>)
              </span>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  setPreviewDocument(null);
                  setActiveTab('companies');
                }}
                className="px-2.5 py-1 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-semibold rounded-lg text-[11px] transition border border-white/10"
              >
                Ganti Perusahaan
              </button>
              <button
                type="button"
                onClick={() => {
                  exitCompanySwitch();
                  setPreviewDocument(null);
                  setActiveTab('companies');
                }}
                className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-900 font-bold rounded-lg text-[11px] transition shadow-xs"
              >
                Keluar ke HQ
              </button>
            </div>
          </div>
        </div>
      )}

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
              {activeTab === 'companies' && (
                <CompanyManager 
                  onSelectCompany={() => setActiveTab('dashboard')}
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

