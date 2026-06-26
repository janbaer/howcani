<script lang="ts">
import Button from '../components/common/Button.svelte';
import LogoMark from '../components/common/LogoMark.svelte';
import { clearError, getAuthState, register } from '../lib/auth.svelte';
import { link } from '../lib/router.svelte';

interface Props {
  params?: Record<string, string>;
}

const { params }: Props = $props();

let username = $state('');
let email = $state('');
let password = $state('');
let confirmPassword = $state('');
let isSubmitting = $state(false);
let validationError = $state('');

const authState = getAuthState();

async function handleSubmit(e: Event) {
  e.preventDefault();
  validationError = '';

  if (!username || !email || !password) {
    validationError = 'Please fill in all required fields';
    return;
  }

  if (password !== confirmPassword) {
    validationError = 'Passwords do not match';
    return;
  }

  if (password.length < 8) {
    validationError = 'Password must be at least 8 characters';
    return;
  }

  isSubmitting = true;
  await register(username, email, password);
  isSubmitting = false;
}
</script>

<div class="mx-auto flex min-h-[calc(100dvh-10rem)] max-w-md w-full items-center">
  <div class="card fade-in w-full p-6 md:p-8">
    <div class="mb-6 flex flex-col items-center gap-3">
      <LogoMark class="h-12 w-12" />
      <h2 class="font-mono text-xl font-bold text-card-foreground">Create Account</h2>
    </div>

    {#if authState.error || validationError}
      <div class="mb-4 alert-error">
        {authState.error || validationError}
      </div>
    {/if}

    <form onsubmit={handleSubmit} class="space-y-4">
    <div>
      <label for="reg-username" class="auth-label">
        Username
      </label>
      <input
        type="text"
        id="reg-username"
        bind:value={username}
        class="input"
        placeholder="Choose a username"
        required
        minlength="3"
        maxlength="30"
      />
    </div>

    <div>
      <label for="reg-email" class="auth-label">
        Email
      </label>
      <input
        type="email"
        id="reg-email"
        bind:value={email}
        class="input"
        placeholder="your@email.com"
        required
      />
    </div>

    <div>
      <label for="reg-password" class="auth-label">
        Password
      </label>
      <input
        type="password"
        id="reg-password"
        bind:value={password}
        class="input"
        placeholder="At least 8 characters"
        required
        minlength="8"
      />
    </div>

    <div>
      <label for="reg-confirm" class="auth-label">
        Confirm Password
      </label>
      <input
        type="password"
        id="reg-confirm"
        bind:value={confirmPassword}
        class="input"
        placeholder="Repeat your password"
        required
      />
    </div>

    <Button
      type="submit"
      disabled={isSubmitting || !username || !email || !password || !confirmPassword}
      size="lg"
      class="w-full"
    >
      {isSubmitting ? "Creating account..." : "Create Account"}
    </Button>
  </form>

    <div class="auth-footer">
      Already have an account?
      <a href="/login" use:link onclick={() => clearError()} class="auth-link ml-1">
        Login
      </a>
    </div>
  </div>
</div>
