<script lang="ts">
import Button from '../common/Button.svelte';

interface Props {
  token: string | null;
  creating: boolean;
  error: string | null;
  copied: boolean;
  oncreate: (days: number) => void;
  oncopy: () => void;
}

const { token, creating, error, copied, oncreate, oncopy }: Props = $props();

let days = $state(90);
</script>

<div class="mt-6">
  <h2 class="section-header mb-3">API token</h2>
  <div class="card px-5 py-4 space-y-3">
    <p class="font-mono text-xs text-muted-foreground">
      Create a token for MCP clients. It is shown only once, copy it before leaving this page.
    </p>
    <div class="flex items-center gap-3">
      <label class="flex items-center gap-2 font-mono text-sm text-card-foreground">
        Valid for
        <input
          type="number"
          min="1"
          max="365"
          bind:value={days}
          class="w-20 rounded-lg border border-border bg-background px-2 py-1 font-mono text-sm"
        />
        days
      </label>
      <Button onclick={() => oncreate(days)} disabled={creating} size="sm">
        {creating ? 'Creating…' : 'Create API token'}
      </Button>
    </div>
    {#if token}
      <div class="flex items-center gap-2">
        <input
          type="text"
          readonly
          value={token}
          aria-label="API token"
          class="flex-1 rounded-lg border border-border bg-muted px-2 py-1 font-mono text-xs"
        />
        <Button variant="secondary" size="sm" onclick={oncopy}>{copied ? 'Copied' : 'Copy'}</Button>
      </div>
    {/if}
    {#if error}
      <div class="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 font-mono text-sm text-destructive">
        {error}
      </div>
    {/if}
  </div>
</div>
