<script>
  import Router from 'svelte-spa-router';
  import Questions from './pages/questions/index.svelte';
  import Connect from './pages/connect.svelte';

  let year = new Date().getFullYear();

  const routes = {
    '/': Questions,
    '/connect': Connect,
  };
</script>

<main>
  <Router {routes} />
  <footer>
    <span><strong>HowCanI</strong> - Copyright {year} by Jan Baer</span>
  </footer>
</main>

<style>
  main {
    height: 100vh;
    display: grid;

    grid-template-rows: 40px 1fr 30px;
    grid-template-columns: 1fr;
    grid-template-areas:
      'header'
      'content'
      'footer';
  }

  @media (min-width: 1024px) {
    main {
      grid-template-rows: 40px 1fr 30px;
      grid-template-columns: var(--sidebar-width) 1fr;
      grid-template-areas:
        'sidebar header'
        'sidebar content'
        'footer footer';
    }
  }

  footer {
    grid-area: footer;
    background-color: var(--main-bg-color);
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>
