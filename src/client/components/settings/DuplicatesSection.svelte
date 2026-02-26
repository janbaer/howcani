<script lang="ts">
import { untrack } from 'svelte';
import type { DuplicateGroup } from '../../lib/api';
import { duplicates } from '../../lib/api';
import { link } from '../../lib/router.svelte';

interface Props {
  username: string | undefined;
  savedThreshold: number;
}

const { username, savedThreshold }: Props = $props();

let duplicatesOpen = $state(false);
let duplicatesFetched = $state(false);
let loadingDuplicates = $state(false);
let duplicateGroups = $state<DuplicateGroup[]>([]);

$effect(() => {
  savedThreshold; // track threshold changes as the only reactive dependency
  untrack(() => {
    if (duplicatesOpen) fetchDuplicates();
  });
});

async function fetchDuplicates() {
  if (!username) return;
  loadingDuplicates = true;
  const res = await duplicates.getAll(username);
  if (res.data) {
    duplicateGroups = res.data.groups;
  }
  loadingDuplicates = false;
}

function toggleDuplicates() {
  duplicatesOpen = !duplicatesOpen;
  if (duplicatesOpen && !duplicatesFetched) {
    duplicatesFetched = true;
    fetchDuplicates();
  }
}
</script>

<div class="mt-6">
  <button
    onclick={toggleDuplicates}
    class="flex w-full items-center justify-between font-mono text-sm font-medium text-card-foreground mb-3"
  >
    Possible duplicates across your knowledge base
    <svg
      class="h-4 w-4 transition-transform duration-200 {duplicatesOpen ? 'rotate-180' : ''}"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="m19 9-7 7-7-7" />
    </svg>
  </button>

  {#if duplicatesOpen}
    {#if loadingDuplicates}
      <div class="card px-5 py-4 space-y-3">
        <div class="h-4 w-2/3 rounded bg-muted animate-pulse"></div>
        <div class="h-4 w-1/2 rounded bg-muted animate-pulse ml-8"></div>
        <div class="h-4 w-3/4 rounded bg-muted animate-pulse"></div>
        <div class="h-4 w-1/2 rounded bg-muted animate-pulse ml-8"></div>
      </div>
    {:else if duplicateGroups.length === 0}
      <div class="card px-5 py-4">
        <p class="font-mono text-sm text-muted-foreground">No duplicates found.</p>
      </div>
    {:else}
      <ul class="card divide-y divide-border">
        {#each duplicateGroups as group}
          <li class="px-5 py-3">
            <a
              href="/{username}/items/{group.item.id}"
              use:link
              class="font-mono text-sm font-medium text-primary hover:underline"
            >
              {group.item.question}
            </a>
            <ul class="mt-2 space-y-1.5">
              {#each group.duplicates as dup}
                <li class="ml-8 flex items-center gap-2">
                  <span class="text-muted-foreground">↳</span>
                  <a
                    href="/{username}/items/{dup.id}"
                    use:link
                    class="font-mono text-sm text-muted-foreground hover:text-primary hover:underline"
                  >
                    {dup.question}
                  </a>
                  <span class="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 font-mono text-xs text-primary shrink-0">
                    {dup.relevance}%
                  </span>
                </li>
              {/each}
            </ul>
          </li>
        {/each}
      </ul>
    {/if}
  {/if}
</div>
