<script lang="ts">
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

<div class="max-w-md w-full mx-auto py-8">
  <div class="card p-6 md:p-8">
    <h2 class="auth-title">Create Account</h2>

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

    <button
      type="submit"
      disabled={isSubmitting || !username || !email || !password || !confirmPassword}
      class="btn-primary w-full py-2.5"
    >
      {isSubmitting ? "Creating account..." : "Create Account"}
    </button>
  </form>

    <div class="auth-footer">
      Already have an account?
      <a href="/login" use:link onclick={() => clearError()} class="auth-link ml-1">
        Login
      </a>
    </div>
  </div>
</div>
