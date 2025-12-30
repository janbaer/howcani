<script lang="ts">
  import { Button } from "bits-ui";
  import { getAuthState, logout } from "../lib/auth.svelte";
  import { navigate } from "../lib/router.svelte";

  const authState = getAuthState();

  function goToLogin() {
    navigate("/login");
  }
</script>

{#if authState.isAuthenticated}
  <div class="max-w-2xl rounded-lg border border-border bg-card p-6 shadow-sm">
    <h2 class="mb-4 text-2xl font-light text-card-foreground">
      Welcome, {authState.user?.display_name || authState.user?.username}!
    </h2>
    <p class="mb-6 text-muted-foreground">
      You are now logged in to your personal knowledge base.
    </p>

    <Button.Root
      onclick={logout}
      class="rounded-md bg-secondary px-6 py-2 text-sm font-medium uppercase tracking-wide text-secondary-foreground hover:bg-secondary/90"
    >
      Logout
    </Button.Root>
  </div>
{:else}
  <div class="max-w-2xl rounded-lg border border-border bg-card p-6 shadow-sm">
    <h2 class="mb-4 text-2xl font-light text-card-foreground">Login to get started</h2>
    <p class="mb-6 text-muted-foreground">
      To be able to work with HowCanI you need to login with your account to access your personal knowledge base.
    </p>

    <Button.Root
      onclick={goToLogin}
      class="rounded-md bg-primary px-6 py-2 text-sm font-medium uppercase tracking-wide text-primary-foreground hover:bg-primary/90"
    >
      Login
    </Button.Root>
  </div>
{/if}
