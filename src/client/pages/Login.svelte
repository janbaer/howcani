<script lang="ts">
import { clearError, getAuthState, login } from '../lib/auth.svelte';
import { link } from '../lib/router.svelte';

interface Props {
  params?: Record<string, string>;
}

const { params }: Props = $props();

let username = $state('');
let password = $state('');
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

<div class="max-w-md w-full mx-auto py-8">
  <div class="card p-6 md:p-8">
    <h2 class="auth-title">Login</h2>

    {#if authState.error}
      <div class="mb-4 alert-error">
        {authState.error}
      </div>
    {/if}

    <form onsubmit={handleSubmit} class="space-y-4">
    <div>
      <label for="username" class="auth-label">
        Username
      </label>
      <input
        type="text"
        id="username"
        bind:value={username}
        class="input"
        placeholder="Enter your username"
        required
      />
    </div>

    <div>
      <label for="password" class="auth-label">
        Password
      </label>
      <input
        type="password"
        id="password"
        bind:value={password}
        class="input"
        placeholder="Enter your password"
        required
      />
    </div>

    <button
      type="submit"
      disabled={isSubmitting || !username || !password}
      class="btn-primary w-full py-2.5"
    >
      {isSubmitting ? "Logging in..." : "Login"}
    </button>
  </form>

    <div class="auth-footer">
      Don't have an account?
      <a href="/register" use:link onclick={() => clearError()} class="auth-link ml-1">
        Create one
      </a>
    </div>
  </div>
</div>
