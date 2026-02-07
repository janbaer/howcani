<script lang="ts">
import { getAuthState, logout } from "../lib/auth.svelte";
import { link } from "../lib/router.svelte";

const authState = getAuthState();
</script>

<header class="border-b border-border bg-card">
  <div class="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
    <a href="/" use:link class="font-mono text-lg font-bold tracking-tight text-foreground">
      HowCanI
    </a>

    <nav class="flex items-center gap-4">
      {#if authState.isAuthenticated && authState.user}
        <a
          href="/{authState.user.username}/items"
          use:link
          class="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          My Items
        </a>
        <span class="text-sm text-muted-foreground">{authState.user.username}</span>
        <button
          onclick={logout}
          class="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Logout
        </button>
      {:else if !authState.isLoading}
        <a href="/login" use:link class="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors">
          Login
        </a>
      {/if}
    </nav>
  </div>
</header>
