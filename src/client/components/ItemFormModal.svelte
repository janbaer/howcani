<script lang="ts">
import type { Item, TagWithCount } from '../lib/items.svelte';
import MarkdownEditor from './MarkdownEditor.svelte';

interface Props {
  item: Item | null;
  onSave: (data: { question: string; answer: string; tags: string[] }) => Promise<void>;
  onClose: () => void;
  existingTags: TagWithCount[];
}

const { item, onSave, onClose, existingTags }: Props = $props();

let dialogElement: HTMLDialogElement;
let questionInput: HTMLInputElement;

let question = $state('');
let answer = $state('');
let selectedTags = $state<string[]>([]);
let tagInput = $state('');
let showTagDropdown = $state(false);
let loading = $state(false);
let error = $state('');

// Debounce timer for tag input
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

// Filter tags based on input
const filteredTags = $derived.by(() => {
  if (!tagInput.trim()) return existingTags;
  const query = tagInput.toLowerCase();
  return existingTags.filter((t) => t.name.toLowerCase().includes(query) && !selectedTags.includes(t.name));
});

// Check if we should show "Create new" option
const shouldShowCreate = $derived.by(() => {
  const trimmed = tagInput.trim();
  if (!trimmed) return false;
  const exists = existingTags.some((t) => t.name.toLowerCase() === trimmed.toLowerCase());
  return !exists && !selectedTags.includes(trimmed);
});

// Open/close modal when item prop changes
$effect(() => {
  if (item) {
    // Edit mode
    question = item.question;
    answer = item.answer;
    selectedTags = item.tags.map((t) => t.name);
    tagInput = '';
    loading = false;
    error = '';
    dialogElement?.showModal();
    questionInput?.focus();
  } else if (item === null) {
    // Create mode
    question = '';
    answer = '';
    selectedTags = [];
    tagInput = '';
    loading = false;
    error = '';
    dialogElement?.showModal();
    questionInput?.focus();
  } else {
    // item is undefined - close modal
    dialogElement?.close();
  }
});

function validateQuestion(q: string): string {
  const trimmed = q.trim();
  if (!trimmed) {
    return 'Question cannot be empty';
  }
  return '';
}

async function handleSave() {
  const validationError = validateQuestion(question);
  if (validationError) {
    error = validationError;
    questionInput?.focus();
    return;
  }

  loading = true;
  error = '';

  try {
    await onSave({
      question: question.trim(),
      answer: answer.trim(),
      tags: selectedTags,
    });
    onClose();
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to save question';
    loading = false;
  }
}

function handleCancel() {
  if (!loading) {
    onClose();
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && e.ctrlKey && !loading) {
    e.preventDefault();
    handleSave();
  }
}

function handleTagInputKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault();
    const trimmed = tagInput.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      selectedTags = [...selectedTags, trimmed];
      tagInput = '';
      showTagDropdown = false;
    }
  } else if (e.key === 'Backspace' && !tagInput && selectedTags.length > 0) {
    // Remove last tag when backspace on empty input
    selectedTags = selectedTags.slice(0, -1);
  } else if (e.key === 'Escape') {
    showTagDropdown = false;
  }
}

function handleTagInputChange() {
  // Debounce to reduce filtering frequency
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    showTagDropdown = tagInput.length > 0;
  }, 300);
}

function selectTag(tagName: string) {
  if (!selectedTags.includes(tagName)) {
    selectedTags = [...selectedTags, tagName];
  }
  tagInput = '';
  showTagDropdown = false;
}

function removeTag(tagName: string) {
  selectedTags = selectedTags.filter((t) => t !== tagName);
}
</script>

<dialog
	bind:this={dialogElement}
	class="rounded-xl border border-border bg-card p-0 shadow-2xl backdrop:bg-black/50 max-w-4xl w-full"
	onclose={handleCancel}
	onkeydown={handleKeydown}
>
	{#if item !== undefined}
		<div class="p-6">
			<!-- Header -->
			<div class="mb-6">
				<h2 class="font-mono text-lg font-bold text-card-foreground">
					{item ? "Edit Question" : "Create Question"}
				</h2>
				<p class="mt-1 font-mono text-xs text-muted-foreground">
					{item ? "Update the question details" : "Add a new question to your knowledge base"}
				</p>
			</div>

			<!-- Form -->
			<div class="space-y-5">
				<!-- Question Input -->
				<div>
					<label for="question" class="block font-mono text-xs text-muted-foreground mb-2">
						Question *
					</label>
					<input
						bind:this={questionInput}
						id="question"
						type="text"
						bind:value={question}
						disabled={loading}
						class="w-full rounded-lg border px-3 py-2 font-mono text-sm
							{error && !question.trim() ? 'border-red-500 focus:ring-red-500' : 'border-input focus:ring-ring'}
							bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2
							disabled:opacity-50 disabled:cursor-not-allowed"
						placeholder="How do I...?"
					/>
				</div>

				<!-- Answer Editor -->
				<div>
					<label class="block font-mono text-xs text-muted-foreground mb-2">
						Answer (Markdown)
					</label>
					<MarkdownEditor
						value={answer}
						onChange={(val) => answer = val}
						disabled={loading}
						placeholder="Enter your answer in Markdown format..."
					/>
				</div>

				<!-- Tag Input -->
				<div>
					<label for="tag-input" class="block font-mono text-xs text-muted-foreground mb-2">
						Tags
					</label>

					<!-- Selected tags as chips -->
					{#if selectedTags.length > 0}
						<div class="flex flex-wrap gap-2 mb-2">
							{#each selectedTags as tag}
								<span class="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 font-mono text-xs text-primary">
									{tag}
									<button
										type="button"
										onclick={() => removeTag(tag)}
										disabled={loading}
										class="hover:text-primary/80 disabled:opacity-50"
										aria-label="Remove tag {tag}"
									>
										<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
											<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
										</svg>
									</button>
								</span>
							{/each}
						</div>
					{/if}

					<!-- Tag input with dropdown -->
					<div class="relative">
						<input
							id="tag-input"
							type="text"
							bind:value={tagInput}
							oninput={handleTagInputChange}
							onkeydown={handleTagInputKeydown}
							onfocus={() => showTagDropdown = tagInput.length > 0}
							disabled={loading}
							class="w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm
								placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring
								disabled:opacity-50 disabled:cursor-not-allowed"
							placeholder="Type to add tags..."
						/>

						<!-- Dropdown -->
						{#if showTagDropdown}
							<div class="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg border border-border bg-card shadow-lg z-10">
								{#if filteredTags.length > 0}
									{#each filteredTags as tag}
										<button
											type="button"
											onclick={() => selectTag(tag.name)}
											class="w-full text-left px-3 py-2 hover:bg-muted font-mono text-sm text-foreground transition-colors"
										>
											{tag.name}
											<span class="text-muted-foreground text-xs ml-2">({tag.item_count})</span>
										</button>
									{/each}
								{/if}
								{#if shouldShowCreate}
									<button
										type="button"
										onclick={() => selectTag(tagInput.trim())}
										class="w-full text-left px-3 py-2 hover:bg-muted font-mono text-sm text-primary transition-colors border-t border-border"
									>
										Create "{tagInput.trim()}"
									</button>
								{/if}
								{#if filteredTags.length === 0 && !shouldShowCreate}
									<div class="px-3 py-2 font-mono text-xs text-muted-foreground">
										No tags found
									</div>
								{/if}
							</div>
						{/if}
					</div>
				</div>

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
					type="button"
					onclick={handleCancel}
					disabled={loading}
					class="rounded-lg px-4 py-2 font-mono text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Cancel
				</button>
				<button
					type="button"
					onclick={handleSave}
					disabled={loading}
					class="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-mono text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
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
