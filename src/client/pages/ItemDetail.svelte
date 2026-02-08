<script lang="ts">
import MarkdownRenderer from "../components/MarkdownRenderer.svelte";
import TagBadge from "../components/TagBadge.svelte";
import { getAuthState } from "../lib/auth.svelte";
import { fetchItem, formatDate, type Item } from "../lib/items.svelte";
import { link } from "../lib/router.svelte";

interface Props {
  params: Record<string, string>;
}

const { params }: Props = $props();
const authState = getAuthState();

let item = $state<Item | null>(null);
let loading = $state(true);
let notFound = $state(false);

const username = $derived(params.username);
const itemId = $derived(params.id);
const isOwner = $derived(authState.isAuthenticated && authState.user?.username === username);

async function loadItem() {
  loading = true;
  notFound = false;
  try {
    item = await fetchItem(username, itemId);
  } catch {
    notFound = true;
  }
  loading = false;
}

$effect(() => {
  // Read derived values to track them as dependencies
  void username;
  void itemId;
  loadItem();
});
</script>

<div class="mx-auto max-w-4xl">
  <!-- Back link -->
  <a
    href="/{username}/items"
    use:link
    class="inline-flex items-center gap-1.5 font-mono text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
  >
    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
    Back to questions
  </a>

  <!-- Loading state -->
  {#if loading}
    <div class="space-y-4">
      <div class="skeleton h-8 w-3/4"></div>
      <div class="flex gap-2">
        <div class="skeleton h-5 w-16 rounded-full"></div>
        <div class="skeleton h-5 w-20 rounded-full"></div>
      </div>
      <div class="skeleton h-4 w-1/3 mt-2"></div>
      <div class="mt-6 space-y-3">
        <div class="skeleton h-4 w-full"></div>
        <div class="skeleton h-4 w-full"></div>
        <div class="skeleton h-4 w-5/6"></div>
        <div class="skeleton h-4 w-3/4"></div>
      </div>
    </div>

  <!-- Not found -->
  {:else if notFound}
    <div class="py-16 text-center">
      <p class="font-mono text-4xl font-bold text-muted-foreground mb-2">404</p>
      <p class="text-muted-foreground">Question not found</p>
    </div>

  <!-- Item detail -->
  {:else if item}
    <article class="fade-in rounded-xl border border-border bg-card p-6 md:p-8">
      <!-- Header with checkmark and question -->
      <div class="flex gap-3 mb-4">
        <svg class="h-6 w-6 shrink-0 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
        <h1 class="font-mono text-lg md:text-xl font-bold text-card-foreground leading-snug">
          {item.question}
        </h1>
      </div>

      <!-- Tags and metadata -->
      <div class="flex flex-wrap items-center gap-2 mb-6 pb-6 border-b border-border">
        {#if item.tags.length > 0}
          {#each item.tags as tag}
            <TagBadge name={tag.name} color={tag.color} />
          {/each}
        {/if}

        <div class="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
          <div class="flex items-center gap-1">
            <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <span class="font-mono">Created {formatDate(item.created_at)}</span>
          </div>
          {#if item.updated_at !== item.created_at}
            <span>&middot;</span>
            <span class="font-mono">Updated {formatDate(item.updated_at)}</span>
          {/if}

          {#if isOwner}
            <button
              disabled
              class="ml-2 rounded p-1 hover:bg-muted transition-colors opacity-50 cursor-not-allowed"
              title="Coming soon"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
              </svg>
            </button>
          {/if}
        </div>
      </div>

      <!-- Answer content -->
      {#if item.answer}
        <MarkdownRenderer content={item.answer} />
      {:else}
        <p class="text-muted-foreground italic text-sm">No answer yet.</p>
      {/if}
    </article>
  {/if}
</div>
