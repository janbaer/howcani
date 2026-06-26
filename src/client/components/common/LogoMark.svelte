<script lang="ts">
interface Props {
  class?: string;
}

const { class: className = '' }: Props = $props();
</script>

<svg class={className} viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <rect fill="hsl(var(--primary))" x="10" y="10" width="100" height="100" rx="25" ry="25" />
  <g fill="hsl(var(--primary-foreground))">
    <rect x="38" y="35" width="14" height="50" />
    <path d="M 82 35 L 82 85 L 68 85 L 68 62 C 68 62 60 68 52 64 L 52 52 C 60 55 68 45 68 35 Z" />
  </g>
</svg>
