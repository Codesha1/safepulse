import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource-variable/plus-jakarta-sans';
import '@fontsource/ibm-plex-sans-arabic/400.css';
import '@fontsource/ibm-plex-sans-arabic/500.css';
import '@fontsource/ibm-plex-sans-arabic/600.css';
import '@fontsource/ibm-plex-sans-arabic/700.css';
import './styles/index.css';
import App from './App';
import { I18nProvider } from './i18n';
import { AuthProvider } from './features/auth/AuthContext';
import { ToastProvider } from './components/ui';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <I18nProvider><ToastProvider><AuthProvider><App /></AuthProvider></ToastProvider></I18nProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
