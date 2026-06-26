<script lang="ts">
import Button from '../components/common/Button.svelte';
import LogoMark from '../components/common/LogoMark.svelte';
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

<div class="mx-auto flex min-h-[calc(100dvh-10rem)] max-w-md w-full items-center">
  <div class="card fade-in w-full p-6 md:p-8">
    <div class="mb-6 flex flex-col items-center gap-3">
      <LogoMark class="h-12 w-12" />
      <h2 class="font-mono text-xl font-bold text-card-foreground">Login</h2>
    </div>

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

    <Button
      type="submit"
      disabled={isSubmitting || !username || !password}
      size="lg"
      class="w-full"
    >
      {isSubmitting ? "Logging in..." : "Login"}
    </Button>
  </form>

    <div class="auth-footer">
      Don't have an account?
      <a href="/register" use:link onclick={() => clearError()} class="auth-link ml-1">
        Create one
      </a>
    </div>
  </div>
</div>
