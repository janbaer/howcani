<script lang="ts">
interface Props {
  name: string;
  color?: string;
  onclick?: () => void;
}

const { name, color = '#6366f1', onclick }: Props = $props();

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  const r = Number.parseInt(h.substring(0, 2), 16);
  const g = Number.parseInt(h.substring(2, 4), 16);
  const b = Number.parseInt(h.substring(4, 6), 16);
  return `${r} ${g} ${b}`;
}

function isLightColor(hex: string): boolean {
  const h = hex.replace('#', '');
  const r = Number.parseInt(h.substring(0, 2), 16);
  const g = Number.parseInt(h.substring(2, 4), 16);
  const b = Number.parseInt(h.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
}
</script>

{#if onclick}
  <button
    type="button"
    {onclick}
    class="inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-xs font-medium transition-opacity hover:opacity-80"
    style="background-color: rgb({hexToRgb(color)} / 0.15); color: rgb({hexToRgb(color)}); border: 1px solid rgb({hexToRgb(color)} / 0.25);"
  >
    {name}
  </button>
{:else}
  <span
    class="inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-xs font-medium"
    style="background-color: rgb({hexToRgb(color)} / 0.15); color: rgb({hexToRgb(color)}); border: 1px solid rgb({hexToRgb(color)} / 0.25);"
  >
    {name}
  </span>
{/if}
