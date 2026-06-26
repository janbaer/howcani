import { THEME_KEY } from './config';

type Theme = 'light' | 'dark';

// Browser-chrome color per theme. Kept in sync with the meta tag in index.html
// so the in-app toggle — not just the OS preference — drives the address bar.
const THEME_COLORS: Record<Theme, string> = {
  light: '#ffffff',
  dark: '#1d2326',
};

let current: Theme = $state(getInitialTheme());

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme]);
}

applyTheme(current);

export function isDark(): boolean {
  return current === 'dark';
}

export function toggleTheme() {
  current = current === 'dark' ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, current);
  if (document.startViewTransition) {
    document.startViewTransition(() => applyTheme(current));
  } else {
    applyTheme(current);
  }
}
