import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register service worker for Android PWA installability
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Service worker registration failed:', err);
    });
  });
} else if ('serviceWorker' in navigator) {
  // In dev / preview mode, register as well to enable install prompt
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Dev service worker registration:', err);
    });
  });
}

createRoot(document.getElementById('root')!).render(<App />);
