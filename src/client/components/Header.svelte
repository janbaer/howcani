<script lang="ts">
  interface Props {
    title?: string;
  }

  let { title = "HowCanI" }: Props = $props();
</script>

<header class="bg-primary text-primary-foreground">
  <div class="mx-auto flex h-12 max-w-7xl items-center px-4">
    <a href="/" class="text-lg font-semibold">{title}</a>
  </div>
</header>
