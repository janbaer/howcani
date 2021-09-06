import App from './app.svelte';
import './global.css';

const app = new App({
  target: document.getElementById('app'),
  // hydrate: true,
});

export default app;
