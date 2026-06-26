<script lang="ts">
import DOMPurify from 'dompurify';
import { marked } from 'marked';

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
  if (token.href && (token.href.startsWith('http://') || token.href.startsWith('https://'))) {
    return html.replace('<a ', '<a target="_blank" rel="noopener noreferrer" ');
  }
  return html;
};

function renderMarkdown(md: string): string {
  const raw = marked.parse(md, { renderer }) as string;
  return DOMPurify.sanitize(raw, {
    ADD_ATTR: ['target', 'rel'],
  });
}

const html = $derived(renderMarkdown(content));

let container: HTMLElement | undefined;

const COPY_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>';
const CHECK_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';

$effect(() => {
  // Track html as a reactive dependency so effect re-runs on content changes.
  // Guard on empty html (no code blocks possible) and missing container.
  if (!container || !html) return;

  const preElements = container.querySelectorAll<HTMLPreElement>('pre');
  const cleanups: Array<() => void> = [];

  for (const pre of preElements) {
    // Wrap pre in a non-scrolling container so the button stays in the
    // top-right corner of the visible area when the code is scrolled sideways.
    if (!pre.parentNode) continue;
    const wrapper = document.createElement('div');
    wrapper.className = 'code-block-wrapper';
    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(pre);

    const lang = pre.querySelector('code')?.className.match(/language-([\w+-]+)/)?.[1];
    if (lang) {
      const label = document.createElement('span');
      label.className = 'code-lang';
      label.textContent = lang;
      wrapper.appendChild(label);
    }

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy-btn';
    btn.setAttribute('aria-label', 'Copy code');
    btn.innerHTML = COPY_ICON;
    wrapper.appendChild(btn);

    const showBtn = () => btn.classList.add('visible');
    const hideBtn = () => btn.classList.remove('visible');
    wrapper.addEventListener('mouseenter', showBtn);
    wrapper.addEventListener('mouseleave', hideBtn);

    let timeout: ReturnType<typeof setTimeout> | null = null;
    const copy = async () => {
      const code = pre.querySelector('code')?.textContent ?? pre.textContent ?? '';
      try {
        await navigator.clipboard.writeText(code);
        btn.innerHTML = CHECK_ICON;
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
          btn.innerHTML = COPY_ICON;
          timeout = null;
        }, 2000);
      } catch {
        // Clipboard API unavailable — fail silently
      }
    };
    btn.addEventListener('click', copy);

    cleanups.push(() => {
      if (timeout) clearTimeout(timeout);
      wrapper.removeEventListener('mouseenter', showBtn);
      wrapper.removeEventListener('mouseleave', hideBtn);
      btn.removeEventListener('click', copy);
      if (wrapper.parentNode) {
        wrapper.parentNode.insertBefore(pre, wrapper);
        wrapper.remove();
      }
    });
  }

  return () => {
    for (const cleanup of cleanups) cleanup();
  };
});
</script>

<div class="prose" bind:this={container}>
  {@html html}
</div>

<style>
  :global(.code-block-wrapper) {
    position: relative;
  }

  :global(.copy-btn) {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    padding: 0.35rem;
    border-radius: 0.25rem;
    background-color: rgba(0, 0, 0, 0.4);
    color: #e2e8f0;
    border: none;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }

  :global(.copy-btn.visible) {
    opacity: 1;
  }

  :global(.copy-btn:hover) {
    background-color: rgba(0, 0, 0, 0.65);
  }

  /* Code blocks render on a fixed dark background in both themes,
     so the label colors are intentionally theme-independent. */
  :global(.code-lang) {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    padding: 0.1rem 0.4rem;
    border-radius: 0.25rem;
    background-color: rgba(255, 255, 255, 0.08);
    color: #94a3b8;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.625rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    line-height: 1.4;
    pointer-events: none;
    transition: opacity 0.15s ease;
  }

  /* The copy button takes the same corner on hover — fade the label out of its way.
     Gated to hover-capable devices: on touch, :hover sticks after a tap and would
     hide the label without the copy button (mouseenter-only) ever replacing it. */
  @media (hover: hover) {
    :global(.code-block-wrapper:hover .code-lang) {
      opacity: 0;
    }
  }
</style>
