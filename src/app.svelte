<script>
  import Router from 'svelte-spa-router';
  import Home from './pages/home.svelte';
  import Connect from './pages/connect.svelte';

  let year = new Date().getFullYear();

  const routes = {
    '/': Home,
    '/connect': Connect,
  };
</script>

<header />
<main>
  <Router {routes} />
</main>
<footer>
  <span><strong>HowCanI</strong> - Copyright {year} by Jan Baer</span>
</footer>

<style>
  header {
    grid-area: toolbar;
    @apply bg-blue-500 text-white;
  }

  main {
    grid-area: content;
    @apply overflow-hidden;
  }

  footer {
    grid-area: footer;
    @apply bg-blue-500 text-white flex justify-center items-center;
  }
</style>
