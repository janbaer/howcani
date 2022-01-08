<script>
  import { MaterialApp, Footer } from 'svelte-materialify';
  import Router from 'svelte-spa-router';
  import Questions from './pages/questions/index.svelte';
  import Connect from './pages/connect/index.svelte';

  let theme = 'light';

  let year = new Date().getFullYear();

  const routes = {
    '/': Questions,
    '/connect': Connect,
  };
</script>

<MaterialApp {theme}>
  <Router {routes} />
  <Footer padless class="indigo theme--dark justify-center flex-column">
    <span>HowCanI - Copyright {year} by <b>Jan Baer</b></span>
  </Footer>
</MaterialApp>

<style>
  :global(.s-app) {
    height: 100vh;
    display: grid;

    grid-template-rows: 46px 1fr 30px;
    grid-template-columns: 1fr;
    grid-template-areas:
      'header'
      'content'
      'footer';
  }

  :global(.s-app-bar) {
    grid-area: header;
  }

  :global(.s-footer) {
    grid-area: footer;
    text-align: center;
  }

  @media (min-width: 1024px) {
    :global(.s-app) {
      grid-template-rows: 46px 1fr 30px;
      grid-template-columns: var(--sidebar-width) 1fr;
      grid-template-areas:
        'header header'
        'sidebar content'
        'footer footer';
    }
  }
</style>
