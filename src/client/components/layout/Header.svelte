<script lang="ts">
import { getAuthState, logout } from '../../lib/auth.svelte';
import { openCreateModal } from '../../lib/create-modal.svelte';
import { getCurrentPath, link, navigate } from '../../lib/router.svelte';
import { getSearchQuery, persistSearch, setSearchQuery } from '../../lib/search-state.svelte';
import { getTagOverlayState, toggleTagOverlay } from '../../lib/tag-overlay.svelte';
import { isDark, toggleTheme } from '../../lib/theme.svelte';

const authState = getAuthState();
const overlayState = getTagOverlayState();

let searchQuery = $state('');
let searchTimeout = $state<ReturnType<typeof setTimeout> | null>(null);
let shimmerDone = $state(false);

$effect(() => {
  const timer = setTimeout(() => {
    shimmerDone = true;
  }, 4500);
  return () => clearTimeout(timer);
});

const currentPath = $derived(getCurrentPath());
const isItemsPage = $derived(currentPath.includes('/items') && !currentPath.match(/\/items\/.+$/));

// Sync search box from global search state (e.g. when store restores search on app open)
$effect(() => {
  searchQuery = getSearchQuery();
});

function handleSearch(e: Event) {
  const value = (e.target as HTMLInputElement).value;
  searchQuery = value;

  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    setSearchQuery(value);
    if (authState.user) persistSearch(authState.user.username, value);
  }, 300);
}

function clearSearch() {
  searchQuery = '';
  setSearchQuery('');
  if (authState.user) persistSearch(authState.user.username, '');
}
</script>

<!-- Desktop header -->
<header class="sticky top-0 z-50 hidden md:block border-b border-border bg-card">
  <div class="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
    <!-- Logo -->
    <a href="/" use:link class="shrink-0">
      <svg class="h-8" style="aspect-ratio: 500/120" viewBox="0 0 500 120" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="cometShimmer" gradientUnits="userSpaceOnUse">
            <animate attributeName="x1" values="-40; 100" dur="1.5s" repeatCount="3" />
            <animate attributeName="y1" values="-40; 100" dur="1.5s" repeatCount="3" />
            <animate attributeName="x2" values="10; 150" dur="1.5s" repeatCount="3" />
            <animate attributeName="y2" values="10; 150" dur="1.5s" repeatCount="3" />

            <stop offset="0%" stop-color="hsl(var(--primary-foreground))" stop-opacity="0.1" />
            <stop offset="70%" stop-color="hsl(var(--primary-foreground))" stop-opacity="0.3" />
            <stop offset="90%" stop-color="hsl(var(--primary-foreground))" stop-opacity="1" />
            <stop offset="95%" stop-color="hsl(var(--primary-foreground))" stop-opacity="0.1" />
            <stop offset="100%" stop-color="hsl(var(--primary-foreground))" stop-opacity="0.1" />
          </linearGradient>
        </defs>
        <rect fill="hsl(var(--primary))" x="10" y="10" width="100" height="100" rx="25" ry="25"/>
        <g fill={shimmerDone ? 'hsl(var(--primary-foreground))' : 'url(#cometShimmer)'}>
          <rect x="38" y="35" width="14" height="50"/>
          <path d="M 82 35 L 82 85 L 68 85 L 68 62 C 68 62 60 68 52 64 L 52 52 C 60 55 68 45 68 35 Z" />
        </g> 
        <text x="130" y="85" style="font-size:72px;font-family:Arial,Helvetica,sans-serif;font-weight:bold" fill="currentColor">How</text>
        <text x="285" y="85" style="font-size:72px;font-family:Arial,Helvetica,sans-serif;font-weight:bold" fill="hsl(var(--primary))">CanI</text>
      </svg>
    </a>

    <!-- Search bar (centered, only on items pages) -->
    {#if isItemsPage}
      <div class="flex-1 max-w-md mx-auto">
        <div class="relative">
          <svg class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            oninput={handleSearch}
            placeholder="Search HowCanI..."
            class="input pl-9 pr-8 py-1.5 font-mono"
          />
          {#if searchQuery}
            <button
              onclick={clearSearch}
              class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          {/if}
        </div>
      </div>
    {:else}
      <div class="flex-1"></div>
    {/if}

    <!-- Right actions -->
    <nav class="flex items-center gap-2">
      {#if authState.isAuthenticated && authState.user && isItemsPage}
        <button
          onclick={openCreateModal}
          class="flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 font-mono text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          title="Create a new question"
        >
          <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Question
        </button>
      {/if}

      <!-- Dark mode toggle -->
      <button
        onclick={toggleTheme}
        class="btn-icon"
        title="Toggle dark mode"
      >
        {#if isDark()}
          <svg class="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
          </svg>
        {:else}
          <svg class="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
          </svg>
        {/if}
      </button>

      <!-- Settings link -->
      {#if authState.isAuthenticated}
        <a
          href="/settings"
          use:link
          class="btn-icon"
          title="Settings"
        >
          <svg class="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
        </a>
      {/if}

      <!-- User icon (always visible, rightmost) -->
      {#if authState.isAuthenticated && authState.user}
        <button
          onclick={logout}
          class="btn-icon"
          title={authState.user.username}
        >
          <svg class="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="currentColor">
            <path fill-rule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clip-rule="evenodd" />
          </svg>
        </button>
      {:else if !authState.isLoading}
        <button
          onclick={() => navigate('/login')}
          class="btn-icon"
        >
          <svg class="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
        </button>
      {/if}
    </nav>
  </div>
</header>

<!-- Mobile header -->
<header class="sticky top-0 z-50 md:hidden bg-primary">
  <div class="flex h-14 items-center justify-between px-4">
    <div class="flex items-center gap-3">
      <!-- Hamburger button (only shown on items pages with tags) -->
      {#if isItemsPage && overlayState.isAvailable}
        <button
          onclick={toggleTagOverlay}
          class="btn-mobile-icon hover:bg-primary-foreground/10 lg:hidden"
          aria-label="Toggle tag menu"
        >
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
      {/if}

      <a href="/" use:link>
        <svg class="h-7" viewBox="0 0 500 120" xmlns="http://www.w3.org/2000/svg">
        <rect fill="hsl(var(--primary-foreground))" x="10" y="10" width="100" height="100" rx="25" ry="25"/>
        <rect fill="hsl(var(--primary))" x="38" y="35" width="14" height="50"/>
        <path fill="hsl(var(--primary))" d="M 82 35 L 82 85 L 68 85 L 68 62 C 68 62 60 68 52 64 L 52 52 C 60 55 68 45 68 35 Z" />
        <text x="130" y="85" style="font-size:72px;font-family:Arial,Helvetica,sans-serif;font-weight:bold" fill="hsl(var(--primary-foreground))">How</text>
        <text x="285" y="85" style="font-size:72px;font-family:Arial,Helvetica,sans-serif;font-weight:bold" fill="hsl(var(--primary-foreground))">CanI</text>
      </svg>
      </a>
    </div>
    <div class="flex items-center gap-2">
      <button
        onclick={toggleTheme}
        class="btn-mobile-icon"
      >
        {#if isDark()}
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
          </svg>
        {:else}
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
          </svg>
        {/if}
      </button>
      {#if authState.isAuthenticated}
        <a
          href="/settings"
          use:link
          class="btn-mobile-icon"
          title="Settings"
        >
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
        </a>
      {/if}
      {#if authState.isAuthenticated && authState.user}
        <button
          onclick={logout}
          class="btn-mobile-user"
          title={authState.user.username}
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path fill-rule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clip-rule="evenodd" />
          </svg>
        </button>
      {:else if !authState.isLoading}
        <button
          onclick={() => navigate('/login')}
          class="btn-mobile-user"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
        </button>
      {/if}
    </div>
  </div>

  <!-- Mobile search bar (below header on items pages) -->
  {#if isItemsPage}
    <div class="border-t border-primary-foreground/10 bg-background px-4 py-2">
      <div class="relative">
        <svg class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          oninput={handleSearch}
          placeholder="Search HowCanI..."
          class="input pl-9 pr-8 py-2 bg-card font-mono"
        />
        {#if searchQuery}
          <button
            onclick={clearSearch}
            class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        {/if}
      </div>
    </div>
  {/if}
</header>

