<script lang="ts">
import { dismiss, getVersionState, refresh } from '../../lib/version.svelte';

const version = getVersionState();
</script>

{#if version.updateAvailable && !version.dismissed}
  <div class="fixed bottom-16 left-0 right-0 z-50 flex justify-center px-4">
    <div class="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-lg">
      <span class="text-sm text-card-foreground">A new version is available.</span>
      <button type="button" onclick={refresh} class="btn-primary py-1.5 text-xs">
        Refresh
      </button>
      <button type="button" onclick={dismiss} class="btn-secondary py-1.5 text-xs">
        Dismiss
      </button>
    </div>
  </div>
{/if}
