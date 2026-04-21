import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

// Filtro de errores globales en desarrollo para evitar que errores externos
// (scripts de navegador/extensiones) rompan el overlay de React.
if (process.env.NODE_ENV === 'development') {
  const shouldIgnoreError = (source, message, stack) => {
    const src = String(source || '').toLowerCase();
    const msg = String(message || '').toLowerCase();
    const stk = String(stack || '').toLowerCase();

    // Si el stack/filename NO menciona nuestro código fuente, y el mensaje es genérico,
    // asumimos que viene de un script externo (extensión, devtools, etc).
    const isFromOurCode =
      src.includes('/src/') ||
      src.includes('localhost') ||
      stk.includes('/src/') ||
      stk.includes('localhost');

    if (isFromOurCode) return false;

    // Patrones típicos que estás viendo
    if (src.includes('ewe-content') || src.includes('apex') || src.includes('toolset')) {
      return true;
    }
    if (msg.includes('internal error') || msg.includes('unknownerror')) {
      return true;
    }

    return false;
  };

  window.addEventListener('error', (event) => {
    if (shouldIgnoreError(event.filename, event.message, event.error?.stack)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason || {};
    const message = reason.message || String(reason);
    const stack = reason.stack || '';
    if (shouldIgnoreError('', message, stack)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);

// PWA deshabilitado: no registramos service worker
