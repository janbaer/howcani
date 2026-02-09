<script lang="ts">
import { getAuthState, logout } from "../lib/auth.svelte";
import { openCreateModal } from "../lib/create-modal.svelte";
import { getCurrentPath, getCurrentQuery, link, navigate } from "../lib/router.svelte";
import { isDark, toggleTheme } from "../lib/theme.svelte";

const authState = getAuthState();

let searchQuery = $state("");
let searchTimeout = $state<ReturnType<typeof setTimeout> | null>(null);

const currentPath = $derived(getCurrentPath());
const isItemsPage = $derived(currentPath.includes("/items") && !currentPath.match(/\/items\/\d+$/));

// Sync search from URL
$effect(() => {
  if (isItemsPage) {
    const query = getCurrentQuery();
    searchQuery = query.search || "";
  }
});

function handleSearch(e: Event) {
  const value = (e.target as HTMLInputElement).value;
  searchQuery = value;

  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    const currentQuery = getCurrentQuery();
    const newParams = new URLSearchParams();

    if (value) newParams.set("search", value);
    if (currentQuery.tags) newParams.set("tags", currentQuery.tags);

    const queryString = newParams.toString();
    navigate(`${currentPath}${queryString ? `?${queryString}` : ""}`);
  }, 300);
}

function clearSearch() {
  searchQuery = "";
  const currentQuery = getCurrentQuery();
  const newParams = new URLSearchParams();

  if (currentQuery.tags) newParams.set("tags", currentQuery.tags);

  const queryString = newParams.toString();
  navigate(`${currentPath}${queryString ? `?${queryString}` : ""}`);
}
</script>

<!-- Desktop header -->
<header class="sticky top-0 z-50 hidden md:block border-b border-border bg-card">
  <div class="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
    <!-- Logo -->
    <a href="/" use:link class="flex items-center gap-2 shrink-0">
      <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
        <span class="font-mono text-sm font-bold text-primary-foreground">H</span>
      </div>
      <span class="font-mono text-lg font-bold text-foreground">HowCanI</span>
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
            class="w-full rounded-lg border border-input bg-background pl-9 pr-8 py-1.5 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
      {#if authState.isAuthenticated && authState.user}
        <a
          href="/{authState.user.username}/items"
          use:link
          class="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="My Questions"
        >
          <svg class="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
        </a>
      {/if}

      <!-- Dark mode toggle -->
      <button
        onclick={toggleTheme}
        class="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
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

      {#if authState.isAuthenticated && authState.user}
        <button
          onclick={openCreateModal}
          class="ml-1 flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 font-mono text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          title="Create a new question"
        >
          <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Question
        </button>
        <button
          onclick={logout}
          class="flex h-8 items-center rounded-lg px-2.5 font-mono text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          Logout
        </button>
      {:else if !authState.isLoading}
        <a
          href="/login"
          use:link
          class="flex h-8 items-center rounded-lg bg-primary px-4 font-mono text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Login
        </a>
      {/if}
    </nav>
  </div>
</header>

<!-- Mobile header -->
<header class="sticky top-0 z-50 md:hidden bg-primary">
  <div class="flex h-14 items-center justify-between px-4">
    <a href="/" use:link class="font-mono text-xl font-bold text-primary-foreground">
      HowCanI
    </a>
    <div class="flex items-center gap-2">
      <button
        onclick={toggleTheme}
        class="flex h-8 w-8 items-center justify-center rounded-lg text-primary-foreground/80 hover:text-primary-foreground transition-colors"
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
      {#if authState.isAuthenticated && authState.user}
        <a
          href="/{authState.user.username}/items"
          use:link
          class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/20 text-primary-foreground"
        >
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
        </a>
      {:else if !authState.isLoading}
        <a
          href="/login"
          use:link
          class="flex h-8 items-center rounded-lg bg-primary-foreground/20 px-3 font-mono text-xs font-medium text-primary-foreground"
        >
          Login
        </a>
      {/if}
    </div>
  </div>

  <!-- Mobile search bar (below header on items pages) -->
  {#if isItemsPage}
    <div class="border-t border-primary-foreground/10 bg-background px-4 py-3">
      <div class="relative">
        <svg class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          oninput={handleSearch}
          placeholder="Search HowCanI..."
          class="w-full rounded-lg border border-input bg-card pl-9 pr-8 py-2 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
