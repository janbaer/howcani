<script lang="ts">
import Button from '../components/common/Button.svelte';
import { getAuthState } from '../lib/auth.svelte';
import { navigate } from '../lib/router.svelte';

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
  <div class="mx-auto max-w-lg py-16">
    <div class="card p-8 md:p-12 text-center">
      <div class="flex justify-center mb-4">
        <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
          <span class="font-mono text-2xl font-bold text-primary-foreground">H</span>
        </div>
      </div>

      <h1 class="font-mono text-3xl font-bold text-card-foreground mb-3">HowCanI</h1>
      <p class="text-lg text-muted-foreground mb-8 leading-relaxed">
        Your personal knowledge base. Collect questions, write answers, organize with tags.
      </p>

      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <Button href="/login" size="lg">
          Login
        </Button>
        <Button href="/register" variant="secondary" size="lg">
          Create Account
        </Button>
      </div>
    </div>
  </div>
{/if}
