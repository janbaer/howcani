import App from "./App.svelte";
import { mount } from "svelte";
import { initLiveReload } from "./lib/live-reload";

// Initialize live reload in development
if (import.meta.env.DEV) {
  initLiveReload();
}

const app = mount(App, {
  target: document.getElementById("app")!,
});

export default app;
