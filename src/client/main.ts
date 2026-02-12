import { mount, unmount } from 'svelte';
import App from './App.svelte';

const target = document.getElementById('app') as HTMLElement;
let app = mount(App, { target });

// Hot Module Replacement support
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    if (app) {
      unmount(app);
    }
    app = mount(App, { target });
  });
}

export default app;
