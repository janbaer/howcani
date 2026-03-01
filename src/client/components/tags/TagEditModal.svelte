<script lang="ts">
import type { TagWithCount } from '../../lib/items.svelte';
import ColorPicker from './ColorPicker.svelte';

interface Props {
  tag: TagWithCount | null;
  existingTags: string[];
  onSave: (id: string, data: { name: string; color: string }) => Promise<void>;
  onClose: () => void;
}

const { tag, existingTags, onSave, onClose }: Props = $props();

let dialogElement: HTMLDialogElement;
let nameInput: HTMLInputElement;

let editedName = $state('');
let editedColor = $state('');
let loading = $state(false);
let error = $state('');

// Open/close modal when tag prop changes
$effect(() => {
  if (tag) {
    editedName = tag.name;
    editedColor = tag.color;
    loading = false;
    error = '';
    dialogElement?.showModal();
    // Focus name input after modal opens
    setTimeout(() => nameInput?.focus(), 100);
  } else {
    dialogElement?.close();
  }
});

function validateName(name: string): string {
  const trimmed = name.trim();

  if (!trimmed) {
    return 'Tag name cannot be empty';
  }

  // Check for duplicate (case-insensitive), but allow keeping the same name
  if (trimmed.toLowerCase() !== tag?.name.toLowerCase()) {
    const duplicate = existingTags.find((t) => t.toLowerCase() === trimmed.toLowerCase());
    if (duplicate) {
      return `Tag '${trimmed}' already exists`;
    }
  }

  return '';
}

async function handleSave() {
  if (!tag) return;

  const validationError = validateName(editedName);
  if (validationError) {
    error = validationError;
    nameInput?.focus();
    return;
  }

  loading = true;
  error = '';

  try {
    await onSave(tag.id, {
      name: editedName.trim(),
      color: editedColor,
    });
    onClose();
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to update tag';
    loading = false;
  }
}

function handleCancel() {
  if (!loading) {
    onClose();
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !loading) {
    e.preventDefault();
    handleSave();
  }
}
</script>

<dialog
  bind:this={dialogElement}
  class="dialog max-w-md w-full"
  onclose={handleCancel}
>
  {#if tag}
    <div class="p-6">
      <!-- Header -->
      <div class="mb-6">
        <h2 class="dialog-title">Edit Tag</h2>
        <p class="dialog-subtitle">
          Update the tag name and color
        </p>
      </div>

      <!-- Form -->
      <div class="space-y-5">
        <!-- Tag Name Input -->
        <div>
          <label for="tag-name" class="form-label">
            Tag Name *
          </label>
          <input
            bind:this={nameInput}
            id="tag-name"
            type="text"
            bind:value={editedName}
            onkeydown={handleKeydown}
            disabled={loading}
            class="w-full rounded-lg border px-3 py-2 font-mono text-sm
              {error ? 'border-red-500 focus:ring-red-500' : 'border-input focus:ring-ring'}
              bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2
              disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="Enter tag name"
          />
        </div>

        <!-- Color Picker -->
        <ColorPicker value={editedColor} onChange={(color) => (editedColor = color)} />

        <!-- Error Message -->
        {#if error}
          <div class="form-error">
            <p class="font-mono text-xs text-red-500">{error}</p>
          </div>
        {/if}
      </div>

      <!-- Actions -->
      <div class="modal-actions">
        <button
          type="button"
          onclick={handleCancel}
          disabled={loading}
          class="modal-cancel"
        >
          Cancel
        </button>
        <button
          type="button"
          onclick={handleSave}
          disabled={loading}
          class="modal-submit"
        >
          {#if loading}
            <svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          {/if}
          Save
        </button>
      </div>
    </div>
  {/if}
</dialog>
