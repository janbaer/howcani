<script lang="ts">
import { getAuthState } from "../lib/auth.svelte";
import { getCurrentPath, link } from "../lib/router.svelte";

const authState = getAuthState();

const username = $derived(authState.user?.username);
const currentPath = $derived(getCurrentPath());
</script>

{#if authState.isAuthenticated && username}
  <nav class="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card z-50">
    <div class="flex h-14 items-stretch justify-around">
      <a
        href="/{username}/items"
        use:link
        class="flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-mono
          {currentPath.includes('/items') && !currentPath.includes('/items/') ? 'text-primary' : 'text-muted-foreground'}"
      >
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
        Home
      </a>

      <button
        disabled
        class="flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-mono text-muted-foreground opacity-50"
      >
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        Search
      </button>

      <button
        disabled
        class="flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-mono text-muted-foreground opacity-50"
      >
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
        Add
      </button>

      <a
        href="/{username}/items"
        use:link
        class="flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-mono text-muted-foreground"
      >
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
        Profile
      </a>
    </div>
  </nav>
{/if}
