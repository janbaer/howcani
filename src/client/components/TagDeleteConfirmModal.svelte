<script lang="ts">
import type { TagWithCount } from "../lib/items.svelte";

interface Props {
  tag: TagWithCount | null;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
}

const { tag, onDelete, onClose }: Props = $props();

let dialogElement: HTMLDialogElement;
let cancelButton: HTMLButtonElement;

let loading = $state(false);
let error = $state("");

// Open/close modal when tag prop changes
$effect(() => {
  if (tag) {
    error = "";
    dialogElement?.showModal();
    // Focus cancel button (safer default)
    setTimeout(() => cancelButton?.focus(), 100);
  } else {
    dialogElement?.close();
  }
});

async function handleDelete() {
  if (!tag) return;

  loading = true;
  error = "";

  try {
    await onDelete(tag.id);
    onClose();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to delete tag";
    loading = false;
  }
}

function handleCancel() {
  if (!loading) {
    onClose();
  }
}
</script>

<dialog
  bind:this={dialogElement}
  class="rounded-xl border border-border bg-card p-0 shadow-2xl backdrop:bg-black/50 max-w-md w-full"
  onclose={handleCancel}
>
  {#if tag}
    <div class="p-6">
      <!-- Header -->
      <div class="mb-6">
        <h2 class="font-mono text-lg font-bold text-card-foreground">Delete Tag</h2>
        <p class="mt-1 font-mono text-sm text-muted-foreground">
          Delete tag '<span class="font-semibold text-foreground">{tag.name}</span>'?
        </p>
      </div>

      <!-- Warning Message -->
      <div class="mb-6 rounded-lg p-4 {tag.item_count > 0 ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-muted border border-border'}">
        {#if tag.item_count === 0}
          <p class="font-mono text-xs text-muted-foreground">
            This tag is not used by any questions.
          </p>
        {:else}
          <div class="flex gap-3">
            <svg class="h-5 w-5 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <div class="flex-1">
              <p class="font-mono text-xs font-medium text-amber-700 dark:text-amber-400">
                Warning: Tag is in use
              </p>
              <p class="mt-1 font-mono text-xs text-muted-foreground">
                This tag is used by {tag.item_count} question{tag.item_count !== 1 ? "s" : ""}. Deleting it will remove the tag from all questions.
              </p>
            </div>
          </div>
        {/if}
      </div>

      <!-- Error Message -->
      {#if error}
        <div class="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 p-3">
          <p class="font-mono text-xs text-red-500">{error}</p>
        </div>
      {/if}

      <!-- Notice -->
      <p class="mb-6 font-mono text-xs text-muted-foreground">
        This action cannot be undone.
      </p>

      <!-- Actions -->
      <div class="flex justify-end gap-3">
        <button
          bind:this={cancelButton}
          type="button"
          onclick={handleCancel}
          disabled={loading}
          class="rounded-lg px-4 py-2 font-mono text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="button"
          onclick={handleDelete}
          disabled={loading}
          class="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 font-mono text-sm font-medium text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {#if loading}
            <svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          {/if}
          Delete
        </button>
      </div>
    </div>
  {/if}
</dialog>
