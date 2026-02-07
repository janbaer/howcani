<script lang="ts">
import { getAuthState } from "../lib/auth.svelte";
import { link, navigate } from "../lib/router.svelte";

interface Props {
  params?: Record<string, string>;
}

const { params }: Props = $props();
const authState = getAuthState();

// If authenticated, redirect to their items page
$effect(() => {
  if (authState.isAuthenticated && authState.user) {
    navigate(`/${authState.user.username}/items`);
  }
});
</script>

{#if !authState.isAuthenticated}
  <div class="mx-auto max-w-lg py-16 text-center">
    <h1 class="font-mono text-3xl font-bold text-foreground mb-3">HowCanI</h1>
    <p class="text-lg text-muted-foreground mb-8 leading-relaxed">
      Your personal knowledge base. Collect questions, write answers, organize with tags.
    </p>

    <div class="flex gap-3 justify-center">
      <a
        href="/login"
        use:link
        class="font-mono text-sm rounded-md bg-primary px-6 py-2.5 text-primary-foreground hover:opacity-90 transition-opacity"
      >
        Login
      </a>
      <a
        href="/register"
        use:link
        class="font-mono text-sm rounded-md border border-border px-6 py-2.5 text-foreground hover:bg-muted transition-colors"
      >
        Create Account
      </a>
    </div>
  </div>
{/if}
