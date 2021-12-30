<script>
  import { createEventDispatcher } from 'svelte';
  import 'codemirror';
  import 'codemirror/lib/codemirror.css';
  import 'codemirror/mode/gfm/gfm';
  import Editor from '@svelte-parts/editor';
  import '@svelte-parts/editor/md-light.css';

  import { cubicInOut } from 'svelte/easing';
  import fadeScale from '/@/helpers/fade-scale.animation';

  import EditorSvg from '/@/assets/svg/edit.svg';
  import MarkdownView from '/@/components/markdown-view.svelte';

  export let content;

  const dispatchEvent = createEventDispatcher();
  const config = {
    lineNumbers: true,
    lineWrapping: true,
    mode: {
      name: 'gfm',
      highlightFormatting: true,
    },
  };

  let showEditor = false;
  let showEditButtons = true;

  function onChange(newValue) {
    dispatchEvent('change', newValue);
  }

  function toggleEditor() {
    showEditor = !showEditor;
  }
</script>

<div
  class="QuestionContent-container"
  class:QuestionContent-markdown={!showEditor}
  class:QuestionContent-editor={showEditor}
>
  {#if showEditButtons}
    <button
      class="QuestionContent-toggleEditorButton"
      on:click={toggleEditor}
      title="Toggle editor"
    >
      <EditorSvg class="SvgImage" />
    </button>
  {/if}
  {#if showEditor}
    <Editor {config} initialValue={content} {onChange} theme="md-light" />
  {:else}
    <MarkdownView {content} />
  {/if}
</div>

<style type="postcss">
  .QuestionContent-container {
    height: calc(100vh - 440px);
  }
  .QuestionContent-editor {
    /* @apply rounded border shadow; */
  }
  .QuestionContent-markdown {
    overflow-y: auto;
  }

  .QuestionContent-toggleEditorButton {
    position: fixed;
    top: 175px;
    right: 40px;
    transition: opacity 0.8s ease-in-out;
    opacity: 0.2;
    z-index: 99;
  }
  @media (min-width: 1024px) {
    .QuestionContent-toggleEditorButton {
      right: 100px;
    }
  }
  .QuestionContent-toggleEditorButton:hover {
    transition: opacity 0.8s ease-in-out;
    opacity: 1;
  }
</style>
