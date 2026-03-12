<script lang="ts">
import { type BackupEntry, settings } from '../../lib/api';

let backups = $state<BackupEntry[]>([]);
let loading = $state(true);
let error = $state<string | null>(null);

let fileInput: HTMLInputElement | null = null;
let selectedFile = $state<File | null>(null);
let clearBeforeRestore = $state(false);
let restoring = $state(false);
let restoreResult = $state<string | null>(null);
let restoreError = $state<string | null>(null);

$effect(() => {
  settings.listBackups().then((res) => {
    if (res.data) {
      backups = res.data;
    } else {
      error = res.error?.message ?? 'Failed to load backups';
    }
    loading = false;
  });
});

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function downloadBackup(filename: string) {
  const blob = await settings.downloadBackup(filename);
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  selectedFile = input.files?.[0] ?? null;
}

async function restoreFromBackup() {
  if (!selectedFile) return;
  restoring = true;
  restoreResult = null;
  restoreError = null;
  const res = await settings.restoreBackup(selectedFile, clearBeforeRestore);
  restoring = false;
  if (res.data) {
    restoreResult = `${res.data.imported} item${res.data.imported === 1 ? '' : 's'} imported successfully.`;
    selectedFile = null;
    clearBeforeRestore = false;
    if (fileInput) fileInput.value = '';
  } else {
    restoreError = res.error?.message ?? 'Restore failed';
  }
}
</script>

<div class="mt-6">
  <h2 class="section-header mb-3">Restore from backup</h2>
  <div class="card px-5 py-4 space-y-3">
    <p class="font-mono text-xs text-muted-foreground">
      Upload a backup file to restore your items. Existing items with matching IDs will be overwritten.
    </p>
    <label class="cursor-pointer rounded-lg border border-border px-4 py-2 font-mono text-sm text-card-foreground hover:bg-muted transition-colors inline-block">
      <input type="file" accept="application/json,.json" class="sr-only" bind:this={fileInput} onchange={onFileSelected} />
      {selectedFile ? selectedFile.name : 'Choose backup file'}
    </label>
    {#if selectedFile}
      <label class="flex items-center gap-2 font-mono text-sm text-card-foreground cursor-pointer">
        <input type="checkbox" bind:checked={clearBeforeRestore} class="rounded" />
        Delete existing data before restoring
      </label>
      <button
        type="button"
        onclick={restoreFromBackup}
        disabled={restoring}
        class="rounded-lg bg-primary px-4 py-2 font-mono text-sm text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {restoring ? 'Restoring…' : 'Restore'}
      </button>
    {/if}
    {#if restoreResult}
      <div class="rounded-lg border border-green-500/50 bg-green-500/10 px-4 py-3 font-mono text-sm text-green-700 dark:text-green-400">
        {restoreResult}
      </div>
    {/if}
    {#if restoreError}
      <div class="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 font-mono text-sm text-destructive">
        {restoreError}
      </div>
    {/if}
  </div>
</div>

<div class="mt-6">
  <h2 class="section-header mb-3">Your backups</h2>
  {#if loading}
    <div class="font-mono text-sm text-muted-foreground">Loading...</div>
  {:else if error}
    <div class="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive font-mono">
      {error}
    </div>
  {:else if backups.length === 0}
    <div class="card px-5 py-4 font-mono text-sm text-muted-foreground">
      No backups available yet.
    </div>
  {:else}
    <div class="card divide-y divide-border">
      {#each backups as backup (backup.filename)}
        <div class="flex items-center justify-between px-5 py-3">
          <div>
            <div class="font-mono text-sm text-card-foreground">{backup.date}</div>
            <div class="font-mono text-xs text-muted-foreground">{formatBytes(backup.sizeBytes)}</div>
          </div>
          <button
            type="button"
            onclick={() => downloadBackup(backup.filename)}
            class="cursor-pointer text-muted-foreground hover:text-card-foreground transition-colors"
            title="Download backup"
            aria-label="Download backup"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
              <path fill="hsl(var(--primary))" d="M2 12H4V17H20V12H22V17C22 18.11 21.11 19 20 19H4C2.9 19 2 18.11 2 17V12Z" />
              <path fill="currentColor" d="M12 15L17.55 9.54L16.13 8.13L13 11.25V2H11V11.25L7.88 8.13L6.46 9.55L12 15Z" />
            </svg>
          </button>
        </div>
      {/each}
    </div>
  {/if}
</div>
