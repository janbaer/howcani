<script>
  import { fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { toggleSidebarStore } from '/@/stores/sidebar-toggle.store.js';

  const resizeObserver = new ResizeObserver((entries) => {
    if (window.innerWidth >= 1024) {
      toggleSidebarStore.set(true);
    } else {
      toggleSidebarStore.set(false);
    }
  });
  resizeObserver.observe(document.scrollingElement);
</script>

<header class="Header-container">
  <slot name="header" />
</header>

{#if $toggleSidebarStore}
  <div
    class="Sidebar-container"
    transition:fly={{ delay: 50, duration: 400, x: -230, y: 0, opacity: 0.5, easing: quintOut }}
  >
    <div class="Sidebar-logo">
      <img src="/images/favicon-32x32.png" alt="HowCanI" />
      <a href="#">
        <span class="text-2xl font-extrabold">HowCanI</span>
      </a>
    </div>

    <nav class="Sidebar-nav">
      <slot name="sidebar" />
    </nav>
  </div>
{/if}

<div class="Content-container">
  <slot name="content" />
</div>

<style type="postcss">
  .Header-container {
    grid-area: header;
    background-color: var(--main-bg-color);

    display: flex;
    align-items: center;
    padding-right: 10px;
  }

  .Sidebar-container {
    background-color: var(--main-bg-color);
    width: var(--sidebar-width);
    top: 0;
    position: fixed;
    height: calc(100vh - var(--footer-height));
    display: flex;
    flex-direction: column;
  }

  @media (min-width: 1024px) {
    .Sidebar-container {
      position: relative;
      grid-area: sidebar;
    }
  }

  .Sidebar-logo {
    display: flex;
    color: white;
    margin: 5px 5px;
    align-self: center;
  }

  .Sidebar-logo img {
    margin-right: 5px;
  }

  .Content-container {
    grid-area: content;
    overflow-y: scroll;
    overflow-x: hidden;
    background-color: white;
  }

  .Sidebar-nav {
    flex: 1;
  }
</style>
