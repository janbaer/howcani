<script lang="ts">
import type { Item } from '../../lib/items.svelte';
import Button from './Button.svelte';

interface Props {
  item: Item | null;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
}

const { item, onDelete, onClose }: Props = $props();

let dialogElement: HTMLDialogElement;

let loading = $state(false);
let error = $state('');

// Open/close modal when item prop changes
$effect(() => {
  if (item) {
    loading = false;
    error = '';
    dialogElement?.showModal();
    setTimeout(() => dialogElement?.querySelector<HTMLButtonElement>('button')?.focus(), 100);
  } else {
    dialogElement?.close();
  }
});

async function handleDelete() {
  if (!item) return;

  loading = true;
  error = '';

  try {
    await onDelete(item.id);
    onClose();
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to delete question';
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
  class="dialog max-w-md w-full"
  onclose={handleCancel}
>
  {#if item}
    <div class="p-6">
      <!-- Header -->
      <div class="mb-6">
        <h2 class="dialog-title">Delete Question?</h2>
      </div>

      <!-- Message -->
      <div class="space-y-4">
        <p class="font-mono text-sm text-muted-foreground">
          Are you sure you want to delete this question?
        </p>

        <div class="rounded-lg bg-muted p-3">
          <p class="font-mono text-sm text-card-foreground font-medium">
            {item.question}
          </p>
        </div>

        <p class="font-mono text-xs text-red-500">
          This action cannot be undone.
        </p>

        <!-- Error Message -->
        {#if error}
          <div class="form-error">
            <p class="font-mono text-xs text-red-500">{error}</p>
          </div>
        {/if}
      </div>

      <!-- Actions -->
      <div class="modal-actions">
        <Button
          type="button"
          variant="cancel"
          onclick={handleCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="delete-action"
          onclick={handleDelete}
          disabled={loading}
        >
          {#if loading}
            <svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          {/if}
          Delete
        </Button>
      </div>
    </div>
  {/if}
</dialog>
