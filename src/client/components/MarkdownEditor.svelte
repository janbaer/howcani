<script lang="ts">
import type * as CodeMirror from "codemirror";
import { onDestroy, onMount } from "svelte";
import "codemirror/lib/codemirror.css";
import "codemirror/mode/gfm/gfm";

interface Props {
  value: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const { value, onChange, disabled = false, placeholder }: Props = $props();

let editorElement: HTMLTextAreaElement;
let editor: CodeMirror.Editor | null = null;

onMount(async () => {
  const CM = await import("codemirror");
  const CodeMirrorConstructor = CM.default || CM;

  editor = CodeMirrorConstructor.fromTextArea(editorElement, {
    lineNumbers: true,
    lineWrapping: true,
    mode: {
      name: "gfm",
      highlightFormatting: true,
    },
    readOnly: disabled,
    placeholder: placeholder || "Enter markdown here...",
  });

  editor.setValue(value || "");

  editor.on("change", () => {
    if (editor && onChange && !disabled) {
      onChange(editor.getValue());
    }
  });
});

onDestroy(() => {
  if (editor) {
    editor.toTextArea();
    editor = null;
  }
});

// Update editor value when prop changes
$effect(() => {
  if (editor && editor.getValue() !== value) {
    const cursor = editor.getCursor();
    editor.setValue(value || "");
    editor.setCursor(cursor);
  }
});

// Update readonly state when disabled prop changes
$effect(() => {
  if (editor) {
    editor.setOption("readOnly", disabled);
  }
});
</script>

<textarea bind:this={editorElement} class="hidden"></textarea>

<style>
  :global(.CodeMirror) {
    height: 300px;
    font-family: 'JetBrains Mono', 'Courier New', monospace;
    font-size: 0.875rem;
    border: 1px solid hsl(var(--border));
    border-radius: 0.5rem;
    background: hsl(var(--background));
    color: hsl(var(--foreground));
  }

  :global(.CodeMirror-gutters) {
    background: hsl(var(--muted));
    border-right: 1px solid hsl(var(--border));
  }

  :global(.CodeMirror-linenumber) {
    color: hsl(var(--muted-foreground));
  }

  :global(.CodeMirror-cursor) {
    border-left-color: hsl(var(--foreground));
  }

  :global(.CodeMirror-selected) {
    background: hsl(var(--accent) / 0.3);
  }

  :global(.CodeMirror-focused .CodeMirror-selected) {
    background: hsl(var(--accent) / 0.5);
  }

  .hidden {
    display: none;
  }
</style>
