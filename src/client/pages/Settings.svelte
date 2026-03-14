<script lang="ts">
import Button from '../components/common/Button.svelte';
import BackupSection from '../components/settings/BackupSection.svelte';
import DuplicatesSection from '../components/settings/DuplicatesSection.svelte';
import { settings } from '../lib/api';
import { getAuthState } from '../lib/auth.svelte';
import { navigate } from '../lib/router.svelte';

interface Props {
  params?: Record<string, string>;
}

const { params }: Props = $props();
const authState = getAuthState();

let semanticSearchEnabled = $state(false);
let duplicateThreshold = $state(80);
let savedThreshold = $state(80);
let backupEnabled = $state(false);
let backupRetentionDays = $state(7);
let backupTime = $state('20:00');
let loading = $state(true);
let saving = $state(false);
let error = $state<string | null>(null);
let thresholdTimer: ReturnType<typeof setTimeout> | null = null;
let retentionTimer: ReturnType<typeof setTimeout> | null = null;

$effect(() => {
  if (!authState.isAuthenticated) {
    navigate('/login');
    return;
  }
  settings.get().then((res) => {
    if (res.data) {
      semanticSearchEnabled = res.data.semanticSearchEnabled;
      duplicateThreshold = res.data.duplicateThreshold;
      savedThreshold = res.data.duplicateThreshold;
      backupEnabled = res.data.backupEnabled;
      backupRetentionDays = res.data.backupRetentionDays;
      backupTime = res.data.backupTime;
    } else {
      error = res.error?.message ?? 'Failed to load settings';
    }
    loading = false;
  });
});

async function saveThresholdAndRefresh(threshold: number) {
  const res = await settings.update({ duplicateThreshold: threshold });
  if (!res.data) {
    error = res.error?.message ?? 'Failed to save threshold';
    return;
  }
  savedThreshold = threshold;
}

function onDuplicateThresholdInput() {
  if (thresholdTimer) clearTimeout(thresholdTimer);
  thresholdTimer = setTimeout(async () => {
    thresholdTimer = null;
    const clamped = Math.min(100, Math.max(50, duplicateThreshold));
    if (clamped !== duplicateThreshold) duplicateThreshold = clamped;
    await saveThresholdAndRefresh(clamped);
  }, 800);
}

async function onDuplicateThresholdBlur() {
  if (thresholdTimer) {
    clearTimeout(thresholdTimer);
    thresholdTimer = null;
  }
  const clamped = Math.min(100, Math.max(50, duplicateThreshold));
  if (clamped !== duplicateThreshold) duplicateThreshold = clamped;
  await saveThresholdAndRefresh(clamped);
}

async function toggleBackup() {
  saving = true;
  const newValue = !backupEnabled;
  const res = await settings.update({ backupEnabled: newValue });
  if (res.data) {
    backupEnabled = res.data.backupEnabled;
  } else {
    error = res.error?.message ?? 'Failed to save settings';
  }
  saving = false;
}

function onRetentionInput() {
  if (retentionTimer) clearTimeout(retentionTimer);
  retentionTimer = setTimeout(async () => {
    retentionTimer = null;
    const clamped = Math.min(30, Math.max(1, backupRetentionDays));
    if (clamped !== backupRetentionDays) backupRetentionDays = clamped;
    const res = await settings.update({ backupRetentionDays: clamped });
    if (!res.data) {
      error = res.error?.message ?? 'Failed to save retention days';
    }
  }, 800);
}

async function onRetentionBlur() {
  if (retentionTimer) {
    clearTimeout(retentionTimer);
    retentionTimer = null;
  }
  const clamped = Math.min(30, Math.max(1, backupRetentionDays));
  if (clamped !== backupRetentionDays) backupRetentionDays = clamped;
  const res = await settings.update({ backupRetentionDays: clamped });
  if (!res.data) {
    error = res.error?.message ?? 'Failed to save retention days';
  }
}

async function onBackupTimeBlur() {
  const res = await settings.update({ backupTime });
  if (!res.data) {
    error = res.error?.message ?? 'Failed to save backup time';
  } else {
    backupTime = res.data.backupTime;
  }
}

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

      <div class="px-5 py-4">
        <div class="flex items-center justify-between">
          <div>
            <div class="font-mono text-sm font-medium text-card-foreground">Duplicate threshold</div>
            <div class="font-mono text-xs text-muted-foreground mt-0.5">
              Minimum similarity (50–100%) to consider two items duplicates
            </div>
          </div>
          <input
            type="number"
            min="50"
            max="100"
            bind:value={duplicateThreshold}
            oninput={onDuplicateThresholdInput}
            onblur={onDuplicateThresholdBlur}
            class="w-20 rounded-md border border-input bg-background px-3 py-1.5 font-mono text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div class="flex items-center justify-between px-5 py-4">
        <div>
          <div class="font-mono text-sm font-medium text-card-foreground">Daily backups</div>
          <div class="font-mono text-xs text-muted-foreground mt-0.5">
            Automatically back up your items once a day
          </div>
        </div>
        <button
          onclick={toggleBackup}
          disabled={saving}
          class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 {backupEnabled ? 'bg-primary' : 'bg-input'}"
          role="switch"
          aria-checked={backupEnabled}
        >
          <span
            class="pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform duration-200 {backupEnabled ? 'translate-x-5' : 'translate-x-0'}"
          ></span>
        </button>
      </div>

      {#if backupEnabled}
        <div class="px-5 py-4">
          <div class="flex items-center justify-between">
            <div>
              <div class="font-mono text-sm font-medium text-card-foreground">Backup time</div>
              <div class="font-mono text-xs text-muted-foreground mt-0.5">
                Time of day to run the backup (HH:MM, server local time)
              </div>
            </div>
            <input
              type="time"
              bind:value={backupTime}
              onblur={onBackupTimeBlur}
              class="w-36 rounded-md border border-input bg-background px-3 py-1.5 font-mono text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div class="px-5 py-4">
          <div class="flex items-center justify-between">
            <div>
              <div class="font-mono text-sm font-medium text-card-foreground">Retention period</div>
              <div class="font-mono text-xs text-muted-foreground mt-0.5">
                Number of days to keep backup files (1–30)
              </div>
            </div>
            <input
              type="number"
              min="1"
              max="30"
              bind:value={backupRetentionDays}
              oninput={onRetentionInput}
              onblur={onRetentionBlur}
              class="w-20 rounded-md border border-input bg-background px-3 py-1.5 font-mono text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      {/if}
    </div>

    <BackupSection />

    <DuplicatesSection username={authState.user?.username} {savedThreshold} />
  {/if}
</div>
