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

<div class="mx-auto max-w-3xl">
  <!-- Back link -->
  <a
    href="/{username}/items"
    use:link
    class="inline-flex items-center gap-1 font-mono text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
  >
    &larr; Back to items
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
      <p class="text-muted-foreground">Item not found</p>
    </div>

  <!-- Item detail -->
  {:else if item}
    <article class="fade-in">
      <h1 class="font-mono text-xl font-bold text-foreground leading-snug mb-4">
        {item.question}
      </h1>

      {#if item.tags.length > 0}
        <div class="flex flex-wrap gap-2 mb-4">
          {#each item.tags as tag}
            <TagBadge name={tag.name} color={tag.color} />
          {/each}
        </div>
      {/if}

      <div class="flex items-center gap-3 text-xs text-muted-foreground mb-6 pb-6 border-b border-border">
        <span>Created {formatDate(item.created_at)}</span>
        {#if item.updated_at !== item.created_at}
          <span>&middot;</span>
          <span>Updated {formatDate(item.updated_at)}</span>
        {/if}

        {#if isOwner}
          <div class="ml-auto flex gap-3">
            <button
              disabled
              class="font-mono text-xs text-muted-foreground opacity-50 cursor-not-allowed"
              title="Coming soon"
            >
              Edit
            </button>
            <button
              disabled
              class="font-mono text-xs text-muted-foreground opacity-50 cursor-not-allowed"
              title="Coming soon"
            >
              Delete
            </button>
          </div>
        {/if}
      </div>

      {#if item.answer}
        <MarkdownRenderer content={item.answer} />
      {:else}
        <p class="text-muted-foreground italic">No answer yet.</p>
      {/if}
    </article>
  {/if}
</div>
