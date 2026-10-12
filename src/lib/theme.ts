/**
 * GenAura AI — Theme Provider & Helpers
 * =====================================
 * Supports Light, Dark, and System theme modes with persistence
 * and system preference listener.
 */
import { ThemeMode } from '@/types';

export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme: ThemeMode): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'dark';

  const resolved = theme === 'system' ? getSystemTheme() : theme;
  const root = document.documentElement;

  if (resolved === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }

  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
  return resolved;
}

export function initializeTheme(storedTheme?: ThemeMode): ThemeMode {
  const theme = storedTheme || 'dark';
  applyTheme(theme);

  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => {
      // Re-apply if current mode is system
      const currentTheme = document.documentElement.dataset.themeMode;
      if (currentTheme === 'system') {
        applyTheme('system');
      }
    });
  }

  return theme;
}
