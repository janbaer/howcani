<script lang="ts">
import Button from '../components/common/Button.svelte';
import BackupSection from '../components/settings/BackupSection.svelte';
import DuplicatesSection from '../components/settings/DuplicatesSection.svelte';
import { settings } from '../lib/api';
import { getAuthState } from '../lib/auth.svelte';
import { navigate } from '../lib/router.svelte';

const authState = getAuthState();

let savedThreshold = $state(80);
let loading = $state(true);
let error = $state<string | null>(null);

$effect(() => {
  if (!authState.isAuthenticated) {
    navigate('/login');
    return;
  }
  settings.get().then((res) => {
    if (res.data) {
      savedThreshold = res.data.duplicateThreshold;
    } else {
      error = res.error?.message ?? 'Failed to load settings';
    }
    loading = false;
  });
});
</script>

<div class="mx-auto max-w-2xl py-8 px-4">
  <div class="mb-6">
    <Button
      variant="back"
      onclick={() => history.back()}
    >
      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
      </svg>
      Back
    </Button>
  </div>
  <h1 class="page-title mb-6">Settings</h1>

  {#if loading}
    <div class="text-sm text-muted-foreground font-mono">Loading...</div>
  {:else if error}
    <div class="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive font-mono">
      {error}
    </div>
  {:else}
    <BackupSection />

    <DuplicatesSection username={authState.user?.username} {savedThreshold} />
  {/if}
</div>
