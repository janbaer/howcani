<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import 'codemirror';
  import 'codemirror/lib/codemirror.css';
  import 'codemirror/mode/gfm/gfm';
  import Editor from '@svelte-parts/editor';
  import '@svelte-parts/editor/md-light.css';
  import { Icon } from 'svelte-materialify';
  import { mdiPencil } from '@mdi/js';

  import EditorSvg from '/@/assets/svg/edit.svg';
  import MarkdownView from '/@/components/markdown-view.svelte';

  export let content;
  export let initialShowEditor = true;

  let showEditor = false;

  onMount(() => {
    showEditor = initialShowEditor;
  });

  const dispatchEvent = createEventDispatcher();
  const config = {
    lineNumbers: true,
    lineWrapping: true,
    theme: 'md-light',
    mode: {
      name: 'gfm',
      highlightFormatting: true,
    },
  };

  function onChange(newValue) {
    dispatchEvent('change', newValue);
  }

  function toggleEditor() {
    showEditor = !showEditor;
  }
</script>

<button class="QuestionContent-toggleEditorButton" on:click={toggleEditor} title="Toggle editor">
  <Icon path={mdiPencil} size="24px" />
</button>
<div
  class="QuestionContent-container"
  class:QuestionContent-markdown={!showEditor}
  class:QuestionContent-editor={showEditor}
>
  {#if showEditor}
    <Editor {config} initialValue={content} {onChange} />
  {:else}
    <MarkdownView {content} />
  {/if}
</div>

<style type="postcss">
  .QuestionContent-container {
    height: calc(100vh - 440px);

    --tw-ring-offset-shadow: 0 0 #0000;
    --tw-ring-shadow: 0 0 #0000;
    --tw-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);

    border-radius: 0.25rem;
    border-width: 1px;
    box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000),
      var(--tw-shadow);
  }
  .QuestionContent-markdown {
    overflow-y: auto;
  }

  .QuestionContent-toggleEditorButton {
    transition: opacity 0.8s ease-in-out;
    opacity: 0.2;
    z-index: 99;
  }
  .QuestionContent-toggleEditorButton:hover {
    transition: opacity 0.8s ease-in-out;
    opacity: 1;
  }

  /* Some style fixes for the svelte-tags element */
  :global(.svelte-tags-input-layout) {
    gap: var(--margin-width);
    border: solid 0 var(--theme-text-fields-border) !important;
    border-width: 0 0 thin 0 !important;
  }
  :global(.svelte-tags-input-layout:focus) {
    border-color: #6200ee !important;
  }

  :global(.svelte-tags-input-layout > label) {
    display: none;
  }

  :global(.svelte-tags-input-layout > input) {
    line-height: 20px;
    padding: 8px 0;
    max-width: 100%;
    min-width: 0;
    width: 100%;
    color: var(--theme-text-primary);
  }

  :global(.svelte-tags-input-layout > .svelte-tags-input-tag) {
    background-color: BurlyWood !important;
    color: black !important;
  }

  :global(.svelte-tags-input-matchs) {
    z-index: 99;
  }
</style>
