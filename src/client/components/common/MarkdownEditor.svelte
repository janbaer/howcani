<script lang="ts">
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { languages } from '@codemirror/language-data';
import { Compartment, EditorState } from '@codemirror/state';
import { placeholder as cmPlaceholder, EditorView, lineNumbers } from '@codemirror/view';
import { tags } from '@lezer/highlight';
import { onDestroy, onMount } from 'svelte';

interface Props {
  value: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const { value, onChange, disabled = false, placeholder: placeholderText }: Props = $props();

let containerElement: HTMLDivElement;
let view: EditorView | null = null;
let isExternalUpdate = false;

const readOnlyCompartment = new Compartment();

const highlightStyle = HighlightStyle.define([
  {
    tag: [tags.heading1, tags.heading2, tags.heading3, tags.heading4, tags.heading5, tags.heading6],
    color: '#219',
    fontWeight: 'bold',
  },
  { tag: tags.strong, fontWeight: 'bold' },
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: tags.strikethrough, textDecoration: 'line-through' },
  { tag: tags.monospace, color: '#d14' },
  { tag: tags.link, color: '#219', textDecoration: 'underline' },
  { tag: tags.url, color: '#219' },
  { tag: tags.meta, color: '#555' },
  { tag: tags.comment, color: '#940' },
  { tag: tags.keyword, color: '#708' },
  { tag: [tags.string, tags.deleted], color: '#a11' },
  { tag: [tags.regexp, tags.escape], color: '#e40' },
  { tag: [tags.number, tags.bool, tags.null], color: '#164' },
  { tag: tags.invalid, color: '#f00' },
]);

onMount(() => {
  const state = EditorState.create({
    doc: value || '',
    extensions: [
      lineNumbers(),
      EditorView.lineWrapping,
      cmPlaceholder(placeholderText || 'Enter markdown here...'),
      markdown({ base: markdownLanguage, codeLanguages: languages }),
      syntaxHighlighting(highlightStyle),
      readOnlyCompartment.of(EditorState.readOnly.of(disabled)),
      EditorView.updateListener.of((update) => {
        if (update.docChanged && !isExternalUpdate && onChange) {
          onChange(update.state.doc.toString());
        }
      }),
    ],
  });

  view = new EditorView({ state, parent: containerElement });
});

onDestroy(() => {
  if (view) {
    view.destroy();
    view = null;
  }
});

$effect(() => {
  if (view && view.state.doc.toString() !== value) {
    isExternalUpdate = true;
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value || '' } });
    isExternalUpdate = false;
  }
});

$effect(() => {
  if (view) {
    view.dispatch({ effects: readOnlyCompartment.reconfigure(EditorState.readOnly.of(disabled)) });
  }
});
</script>

<div bind:this={containerElement}></div>

<style>
  :global(.cm-editor) {
    height: 300px;
    font-family: 'JetBrains Mono', 'Courier New', monospace;
    font-size: 0.875rem;
    border: 1px solid hsl(var(--border));
    border-radius: 0.5rem;
    background: hsl(var(--background));
    color: hsl(var(--foreground));
  }

  :global(.cm-scroller),
  :global(.cm-content) {
    background: hsl(var(--background));
  }

  :global(.cm-gutters) {
    background: hsl(var(--muted));
    border-right: 1px solid hsl(var(--border));
  }

  :global(.cm-lineNumbers .cm-gutterElement) {
    color: hsl(var(--muted-foreground));
  }

  :global(.cm-cursor) {
    border-left-color: hsl(var(--foreground));
  }

  :global(.cm-selectionBackground) {
    background: hsl(var(--accent) / 0.3) !important;
  }

  :global(.cm-focused .cm-selectionBackground) {
    background: hsl(var(--accent) / 0.5) !important;
  }
</style>
