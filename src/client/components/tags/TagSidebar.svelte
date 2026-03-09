<script lang="ts">
import { getAuthState } from '../../lib/auth.svelte';
import type { TagWithCount } from '../../lib/items.svelte';
import { deleteTag as deleteTagService, updateTag as updateTagService } from '../../lib/items.svelte';
import TagDeleteConfirmModal from './TagDeleteConfirmModal.svelte';
import TagEditModal from './TagEditModal.svelte';

interface Props {
  tags: TagWithCount[];
  selectedTags: string[];
  onToggleTag: (tagName: string) => void;
  onTagsChanged: () => Promise<void>;
  isOwner: boolean;
}

const { tags, selectedTags, onToggleTag, onTagsChanged, isOwner }: Props = $props();

const authState = getAuthState();

let editingTag = $state<TagWithCount | null>(null);
let deletingTag = $state<TagWithCount | null>(null);

const existingTagNames = $derived(tags.map((t) => t.name));

function handleEditClick(tag: TagWithCount, e: MouseEvent) {
  e.stopPropagation();
  editingTag = tag;
}

function handleDeleteClick(tag: TagWithCount, e: MouseEvent) {
  e.stopPropagation();
  deletingTag = tag;
}

async function handleSaveTag(id: string, data: { name: string; color: string }) {
  if (!authState.user) return;

  await updateTagService(authState.user.username, id, data);
  await onTagsChanged();
}

async function handleDeleteTag(id: string) {
  if (!authState.user) return;

  await deleteTagService(authState.user.username, id);
  await onTagsChanged();
}

function closeModals() {
  editingTag = null;
  deletingTag = null;
}

function handleKeyDown(tag: TagWithCount, e: KeyboardEvent) {
  if (!isOwner) return;

  if (e.key === 'Enter') {
    e.preventDefault();
    editingTag = tag;
  } else if (e.key === 'Delete' || e.key === 'Backspace') {
    e.preventDefault();
    deletingTag = tag;
  }
}
</script>

<aside class="w-52 shrink-0 h-full">
  <nav class="h-full overflow-y-auto">
    <ul class="space-y-0.5">
      {#each tags as tag}
        {@const isSelected = selectedTags.includes(tag.name)}
        <li>
          <button
            onclick={() => onToggleTag(tag.name)}
            onkeydown={(e) => handleKeyDown(tag, e)}
            class="group tag-nav-item {isSelected ? 'bg-primary/10 text-primary font-medium' : 'text-sidebar-foreground hover:bg-muted'}"
          >
            <!-- Checkbox indicator -->
            <span class="tag-nav-checkbox {isSelected ? 'border-primary bg-primary' : 'border-border'}">
              {#if isSelected}
                <svg class="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              {/if}
            </span>

            <span class="truncate font-mono text-xs">{tag.name}</span>

            {#if isOwner}
              <span class="ml-auto flex shrink-0 gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onclick={(e) => handleEditClick(tag, e)}
                  class="rounded p-0.5 hover:bg-muted transition-colors"
                  aria-label="Edit tag '{tag.name}'"
                  title="Edit tag"
                >
                  <svg class="h-3 w-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onclick={(e) => handleDeleteClick(tag, e)}
                  class="rounded p-0.5 hover:bg-muted transition-colors"
                  aria-label="Delete tag '{tag.name}'"
                  title="Delete tag"
                >
                  <svg class="h-3 w-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                </button>
              </span>
            {/if}
          </button>
        </li>
      {/each}
    </ul>
  </nav>
</aside>

<!-- Modals -->
<TagEditModal
  tag={editingTag}
  existingTags={existingTagNames}
  onSave={handleSaveTag}
  onClose={closeModals}
/>

<TagDeleteConfirmModal
  tag={deletingTag}
  onDelete={handleDeleteTag}
  onClose={closeModals}
/>
