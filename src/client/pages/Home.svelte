<script lang="ts">
  import { getAuthState, logout } from "../lib/auth.svelte";
  import { navigate } from "../lib/router.svelte";

  const authState = getAuthState();

  function goToLogin() {
    navigate("/login");
  }

  function goToRegister() {
    navigate("/register");
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

    <button
      onclick={logout}
      class="rounded-md bg-secondary px-6 py-2 text-sm font-medium uppercase tracking-wide text-secondary-foreground hover:bg-secondary/90"
    >
      Logout
    </button>
  </div>
{:else}
  <div class="max-w-2xl rounded-lg border border-border bg-card p-6 shadow-sm">
    <h2 class="mb-4 text-2xl font-light text-card-foreground">Get Started</h2>
    <p class="mb-6 text-muted-foreground">
      To access your personal knowledge base, please login with your account or create a new one.
    </p>

    <div class="flex gap-3">
      <button
        onclick={goToLogin}
        class="flex-1 rounded-md bg-primary px-6 py-2 text-sm font-medium uppercase tracking-wide text-primary-foreground hover:bg-primary/90"
      >
        Login
      </button>
      <button
        onclick={goToRegister}
        class="flex-1 rounded-md border border-primary bg-transparent px-6 py-2 text-sm font-medium uppercase tracking-wide text-primary hover:bg-primary/10"
      >
        Create Account
      </button>
    </div>
  </div>
{/if}
