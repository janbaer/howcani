<script lang="ts">
  import { register, getAuthState, clearError } from "../lib/auth.svelte";
  import { navigate } from "../lib/router.svelte";

  let username = $state("");
  let password = $state("");
  let confirmPassword = $state("");
  let isSubmitting = $state(false);
  let validationError = $state("");

  const authState = getAuthState();

  async function handleSubmit(e: Event) {
    e.preventDefault();
    validationError = "";

    if (!username || !password) {
      validationError = "Please fill in all required fields";
      return;
    }

    if (password !== confirmPassword) {
      validationError = "Passwords do not match";
      return;
    }

    if (password.length < 8) {
      validationError = "Password must be at least 8 characters";
      return;
    }

    isSubmitting = true;
    await register(username, password);
    isSubmitting = false;
  }

  function goToLogin() {
    clearError();
    navigate("/login");
  }
</script>

<div class="max-w-md w-full mx-auto">
  <div class="rounded-lg border border-border bg-card p-6 shadow-sm">
    <h2 class="mb-6 text-2xl font-light text-card-foreground">Create Account</h2>

    {#if authState.error || validationError}
      <div class="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
        {authState.error || validationError}
      </div>
    {/if}

    <form onsubmit={handleSubmit} class="space-y-4">
      <div>
        <label for="username" class="block text-sm font-medium text-card-foreground mb-1">
          Username <span class="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="username"
          bind:value={username}
          class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Choose a username"
          required
          minlength="3"
          maxlength="20"
        />
      </div>

      <div>
        <label for="password" class="block text-sm font-medium text-card-foreground mb-1">
          Password <span class="text-red-500">*</span>
        </label>
        <input
          type="password"
          id="password"
          bind:value={password}
          class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="At least 8 characters"
          required
          minlength="8"
        />
      </div>

      <div>
        <label for="confirmPassword" class="block text-sm font-medium text-card-foreground mb-1">
          Confirm Password <span class="text-red-500">*</span>
        </label>
        <input
          type="password"
          id="confirmPassword"
          bind:value={confirmPassword}
          class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Repeat your password"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !username || !password || !confirmPassword}
        class="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium uppercase tracking-wide text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Creating account..." : "Create Account"}
      </button>
    </form>

    <div class="mt-6 text-center text-sm text-muted-foreground">
      Already have an account?
      <button
        type="button"
        onclick={goToLogin}
        class="ml-1 text-primary hover:underline font-medium"
      >
        Login
      </button>
    </div>
  </div>
</div>
