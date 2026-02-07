<script lang="ts">
import { clearError, getAuthState, login } from "../lib/auth.svelte";
import { link } from "../lib/router.svelte";

interface Props {
  params?: Record<string, string>;
}

const { params }: Props = $props();

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
</script>

<div class="max-w-sm w-full mx-auto py-8">
  <h2 class="mb-6 font-mono text-xl font-bold text-foreground">Login</h2>

  {#if authState.error}
    <div class="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      {authState.error}
    </div>
  {/if}

  <form onsubmit={handleSubmit} class="space-y-4">
    <div>
      <label for="username" class="block font-mono text-xs font-medium text-muted-foreground mb-1.5">
        Username
      </label>
      <input
        type="text"
        id="username"
        bind:value={username}
        class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        placeholder="Enter your username"
        required
      />
    </div>

    <div>
      <label for="password" class="block font-mono text-xs font-medium text-muted-foreground mb-1.5">
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

    <button
      type="submit"
      disabled={isSubmitting || !username || !password}
      class="w-full font-mono text-sm rounded-md bg-primary px-4 py-2.5 text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isSubmitting ? "Logging in..." : "Login"}
    </button>
  </form>

  <div class="mt-6 text-center text-sm text-muted-foreground">
    Don't have an account?
    <a href="/register" use:link onclick={() => clearError()} class="ml-1 text-primary hover:underline font-medium">
      Create one
    </a>
  </div>
</div>
