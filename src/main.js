import App from './app.svelte';
import './global.css';

const app = new App({
  target: window.document.getElementById('app'),
  // hydrate: true,
});

export default app;
