<script lang="ts">
import { settings } from '../lib/api';
import { getAuthState } from '../lib/auth.svelte';
import { navigate } from '../lib/router.svelte';

interface Props {
  params?: Record<string, string>;
}

const { params }: Props = $props();
const authState = getAuthState();

let semanticSearchEnabled = $state(false);
let loading = $state(true);
let saving = $state(false);
let error = $state<string | null>(null);

$effect(() => {
  if (!authState.isAuthenticated) {
    navigate('/login');
    return;
  }
  settings.get().then((res) => {
    if (res.data) {
      semanticSearchEnabled = res.data.semanticSearchEnabled;
    } else {
      error = res.error?.message ?? 'Failed to load settings';
    }
    loading = false;
  });
});

async function toggleSemanticSearch() {
  saving = true;
  const newValue = !semanticSearchEnabled;
  const res = await settings.update({ semanticSearchEnabled: newValue });
  if (res.data) {
    semanticSearchEnabled = res.data.semanticSearchEnabled;
  } else {
    error = res.error?.message ?? 'Failed to save settings';
  }
  saving = false;
}
</script>

<div class="mx-auto max-w-2xl py-8 px-4">
  <div class="mb-6">
    <button
      onclick={() => history.back()}
      class="btn-back"
    >
      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
      </svg>
      Back
    </button>
  </div>
  <h1 class="page-title mb-6">Settings</h1>

  {#if loading}
    <div class="text-sm text-muted-foreground font-mono">Loading...</div>
  {:else if error}
    <div class="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive font-mono">
      {error}
    </div>
  {:else}
    <div class="card divide-y divide-border">
      <div class="flex items-center justify-between px-5 py-4">
        <div>
          <div class="font-mono text-sm font-medium text-card-foreground">Semantic search</div>
          <div class="font-mono text-xs text-muted-foreground mt-0.5">
            Use AI embeddings to find items by meaning, not just keywords
          </div>
        </div>
        <button
          onclick={toggleSemanticSearch}
          disabled={saving}
          class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 {semanticSearchEnabled ? 'bg-primary' : 'bg-input'}"
          role="switch"
          aria-checked={semanticSearchEnabled}
        >
          <span
            class="pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform duration-200 {semanticSearchEnabled ? 'translate-x-5' : 'translate-x-0'}"
          ></span>
        </button>
      </div>
    </div>
  {/if}
</div>
