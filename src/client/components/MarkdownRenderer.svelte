<script lang="ts">
import DOMPurify from "dompurify";
import { marked } from "marked";

interface Props {
  content: string;
}

const { content }: Props = $props();

// Configure marked for safe defaults
marked.setOptions({
  breaks: true,
  gfm: true,
});

// Custom renderer to add target="_blank" to external links
const renderer = new marked.Renderer();
const originalLinkRenderer = renderer.link.bind(renderer);
renderer.link = (token) => {
  const html = originalLinkRenderer(token);
  if (token.href && (token.href.startsWith("http://") || token.href.startsWith("https://"))) {
    return html.replace("<a ", '<a target="_blank" rel="noopener noreferrer" ');
  }
  return html;
};

function renderMarkdown(md: string): string {
  const raw = marked.parse(md, { renderer }) as string;
  return DOMPurify.sanitize(raw, {
    ADD_ATTR: ["target", "rel"],
  });
}

const html = $derived(renderMarkdown(content));
</script>

<div class="prose">
  {@html html}
</div>
