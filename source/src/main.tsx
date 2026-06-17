import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
if ('serviceWorker' in navigator) { navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister())).catch(() => {}); }
if (window.caches) { caches.keys().then(ks => ks.forEach(k => caches.delete(k))).catch(() => {}); }
createRoot(document.getElementById('root')!).render(<App />);
