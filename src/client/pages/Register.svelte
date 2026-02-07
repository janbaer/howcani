<script lang="ts">
import { clearError, getAuthState, register } from "../lib/auth.svelte";
import { link } from "../lib/router.svelte";

interface Props {
  params?: Record<string, string>;
}

const { params }: Props = $props();

let username = $state("");
let email = $state("");
let password = $state("");
let confirmPassword = $state("");
let isSubmitting = $state(false);
let validationError = $state("");

const authState = getAuthState();

async function handleSubmit(e: Event) {
  e.preventDefault();
  validationError = "";

  if (!username || !email || !password) {
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
  await register(username, email, password);
  isSubmitting = false;
}
</script>

<div class="max-w-sm w-full mx-auto py-8">
  <h2 class="mb-6 font-mono text-xl font-bold text-foreground">Create Account</h2>

  {#if authState.error || validationError}
    <div class="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      {authState.error || validationError}
    </div>
  {/if}

  <form onsubmit={handleSubmit} class="space-y-4">
    <div>
      <label for="reg-username" class="block font-mono text-xs font-medium text-muted-foreground mb-1.5">
        Username
      </label>
      <input
        type="text"
        id="reg-username"
        bind:value={username}
        class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        placeholder="Choose a username"
        required
        minlength="3"
        maxlength="30"
      />
    </div>

    <div>
      <label for="reg-email" class="block font-mono text-xs font-medium text-muted-foreground mb-1.5">
        Email
      </label>
      <input
        type="email"
        id="reg-email"
        bind:value={email}
        class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        placeholder="your@email.com"
        required
      />
    </div>

    <div>
      <label for="reg-password" class="block font-mono text-xs font-medium text-muted-foreground mb-1.5">
        Password
      </label>
      <input
        type="password"
        id="reg-password"
        bind:value={password}
        class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        placeholder="At least 8 characters"
        required
        minlength="8"
      />
    </div>

    <div>
      <label for="reg-confirm" class="block font-mono text-xs font-medium text-muted-foreground mb-1.5">
        Confirm Password
      </label>
      <input
        type="password"
        id="reg-confirm"
        bind:value={confirmPassword}
        class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        placeholder="Repeat your password"
        required
      />
    </div>

    <button
      type="submit"
      disabled={isSubmitting || !username || !email || !password || !confirmPassword}
      class="w-full font-mono text-sm rounded-md bg-primary px-4 py-2.5 text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isSubmitting ? "Creating account..." : "Create Account"}
    </button>
  </form>

  <div class="mt-6 text-center text-sm text-muted-foreground">
    Already have an account?
    <a href="/login" use:link onclick={() => clearError()} class="ml-1 text-primary hover:underline font-medium">
      Login
    </a>
  </div>
</div>
