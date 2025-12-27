import App from "./App.svelte";
import { mount, unmount } from "svelte";

const target = document.getElementById("app")!;
let app = mount(App, { target });

// Hot Module Replacement support
if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    if (app) {
      unmount(app);
    }
    app = mount(App, { target });
  });
}

export default app;
