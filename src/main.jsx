import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './context/AuthContext.jsx';
import { InvoiceProvider } from './context/InvoiceContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <InvoiceProvider>
        <App />
      </InvoiceProvider>
    </AuthProvider>
  </React.StrictMode>,
);
