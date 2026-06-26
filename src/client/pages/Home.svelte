<script lang="ts">
import Button from '../components/common/Button.svelte';
import LogoMark from '../components/common/LogoMark.svelte';
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
  <div class="mx-auto flex min-h-[calc(100dvh-10rem)] max-w-2xl items-center">
    <div class="card fade-in w-full p-8 md:p-12 text-center">
      <div class="flex justify-center mb-5">
        <LogoMark class="h-16 w-16" />
      </div>

      <h1 class="font-mono text-3xl font-bold text-card-foreground mb-3">HowCanI</h1>
      <p class="text-lg text-muted-foreground mb-10 leading-relaxed">
        Your personal knowledge base. Collect questions, write answers, organize with tags.
      </p>

      <div class="mb-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div class="flex flex-col items-center gap-2">
          <svg class="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
          </svg>
          <p class="font-mono text-xs font-semibold text-card-foreground">Collect</p>
          <p class="text-xs text-muted-foreground leading-snug">Capture questions and answers in Markdown</p>
        </div>
        <div class="flex flex-col items-center gap-2">
          <svg class="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6Z" />
          </svg>
          <p class="font-mono text-xs font-semibold text-card-foreground">Organize</p>
          <p class="text-xs text-muted-foreground leading-snug">Group everything with colored tags</p>
        </div>
        <div class="flex flex-col items-center gap-2">
          <svg class="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <p class="font-mono text-xs font-semibold text-card-foreground">Find</p>
          <p class="text-xs text-muted-foreground leading-snug">Full-text and semantic search across notes</p>
        </div>
      </div>

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
