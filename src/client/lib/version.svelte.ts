declare const APP_VERSION: string | undefined;

const state = $state({ updateAvailable: false, dismissed: false });

let registration: ServiceWorkerRegistration | null = null;

function onUpdateAvailable() {
  state.updateAvailable = true;
}

function watchRegistration(reg: ServiceWorkerRegistration) {
  registration = reg;

  if (reg.waiting) {
    onUpdateAvailable();
    return;
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
