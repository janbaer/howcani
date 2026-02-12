<script lang="ts">
import type { Item } from '../lib/items.svelte';

interface Props {
  item: Item | null;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
}

const { item, onDelete, onClose }: Props = $props();

let dialogElement: HTMLDialogElement;
let cancelButton: HTMLButtonElement;

let loading = $state(false);
let error = $state('');

// Open/close modal when item prop changes
$effect(() => {
  if (item) {
    loading = false;
    error = '';
    dialogElement?.showModal();
    // Focus cancel button by default (safer)
    setTimeout(() => cancelButton?.focus(), 100);
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
	class="rounded-xl border border-border bg-card p-0 shadow-2xl backdrop:bg-black/50 max-w-md w-full"
	onclose={handleCancel}
>
	{#if item}
		<div class="p-6">
			<!-- Header -->
			<div class="mb-6">
				<h2 class="font-mono text-lg font-bold text-card-foreground">Delete Question?</h2>
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
					<div class="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
						<p class="font-mono text-xs text-red-500">{error}</p>
					</div>
				{/if}
			</div>

			<!-- Actions -->
			<div class="mt-6 flex justify-end gap-3">
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
