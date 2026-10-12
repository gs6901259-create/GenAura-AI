import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { Router } from './app/router';
import { initializeTheme } from './lib/theme';

// Initialize persisted theme before first paint to prevent flash
try {
  const persisted = localStorage.getItem('genaura-store');
  const parsed = persisted ? JSON.parse(persisted) : null;
  initializeTheme(parsed?.state?.theme || 'dark');
} catch (e) {
  initializeTheme('dark');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router />
  </StrictMode>
);
