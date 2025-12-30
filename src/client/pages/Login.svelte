<script lang="ts">
  import { Button } from "bits-ui";
  import { login, getAuthState, clearError } from "../lib/auth.svelte";
  import { navigate } from "../lib/router.svelte";

  let username = $state("");
  let password = $state("");
  let isSubmitting = $state(false);

  const authState = getAuthState();

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!username || !password) return;

    isSubmitting = true;
    await login(username, password);
    isSubmitting = false;
  }

  function goToRegister() {
    clearError();
    navigate("/register");
  }
</script>

<div class="max-w-md w-full mx-auto">
  <div class="rounded-lg border border-border bg-card p-6 shadow-sm">
    <h2 class="mb-6 text-2xl font-light text-card-foreground">Login</h2>

    {#if authState.error}
      <div class="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
        {authState.error}
      </div>
    {/if}

    <form onsubmit={handleSubmit} class="space-y-4">
      <div>
        <label for="username" class="block text-sm font-medium text-card-foreground mb-1">
          Username or Email
        </label>
        <input
          type="text"
          id="username"
          bind:value={username}
          class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Enter your username or email"
          required
        />
      </div>

      <div>
        <label for="password" class="block text-sm font-medium text-card-foreground mb-1">
          Password
        </label>
        <input
          type="password"
          id="password"
          bind:value={password}
          class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Enter your password"
          required
        />
      </div>

      <Button.Root
        type="submit"
        disabled={isSubmitting || !username || !password}
        class="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium uppercase tracking-wide text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Logging in..." : "Login"}
      </Button.Root>
    </form>

    <div class="mt-6 text-center text-sm text-muted-foreground">
      Don't have an account?
      <button
        type="button"
        onclick={goToRegister}
        class="ml-1 text-primary hover:underline font-medium"
      >
        Create one
      </button>
    </div>
  </div>
</div>
