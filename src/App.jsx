import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import AuthView from './components/AuthView';
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

export default function App() {
  const { isAuthenticated } = useAuth();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [previewDocument, setPreviewDocument] = useState(null);
  const [editorConfig, setEditorConfig] = useState({
    open: false,
    type: 'INV',
    data: null
  });

  if (!isAuthenticated) {
    return <AuthView />;
  }

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
  );
}
