declare const APP_VERSION: string | undefined;

const state = $state({ updateAvailable: false, dismissed: false });

let registration: ServiceWorkerRegistration | null = null;

async function onUpdateAvailable() {
  if (state.updateAvailable) return;

  try {
    const res = await fetch('/api/health');
    if (!res.ok) return;
    const data: { version?: string } = await res.json();
    if (data.version === APP_VERSION) return;
  } catch {
    // fetch or parse error — suppress banner to avoid false positives
    return;
  }

  state.updateAvailable = true;
}

function watchRegistration(reg: ServiceWorkerRegistration) {
  registration = reg;

  if (reg.waiting) {
    onUpdateAvailable();
  }

  setInterval(() => reg.update(), 5 * 60 * 1000);

  reg.addEventListener('updatefound', () => {
    const sw = reg.installing;
    if (!sw) return;
    sw.addEventListener('statechange', () => {
      if (sw.state === 'installed' && navigator.serviceWorker.controller) {
        onUpdateAvailable();
      }
    });
  });
}

export function initVersionCheck() {
  if (typeof APP_VERSION === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker
    .register('/sw.js')
    .then(watchRegistration)
    .catch(() => {});
}

export function getVersionState() {
  return state;
}

export function refresh() {
  registration?.waiting?.postMessage('SKIP_WAITING');
  const timeout = setTimeout(() => window.location.reload(), 5000);
  navigator.serviceWorker.addEventListener(
    'controllerchange',
    () => {
      clearTimeout(timeout);
      window.location.reload();
    },
    { once: true },
  );
}

export function dismiss() {
  state.dismissed = true;
}
