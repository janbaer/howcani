<script>
  import { createEventDispatcher } from 'svelte';
  import 'codemirror';
  import 'codemirror/lib/codemirror.css';
  import 'codemirror/mode/gfm/gfm';
  import Editor from '@svelte-parts/editor';
  import '@svelte-parts/editor/md-light.css';

  const dispatchEvent = createEventDispatcher();

  export let content;

  const config = {
    lineNumbers: true,
    lineWrapping: true,
    mode: {
      name: 'gfm',
      highlightFormatting: true,
    },
  };

  function onChange(newValue) {
    dispatchEvent('change', newValue);
  }
</script>

<div class="QuestionContent-container">
  <Editor {config} initialValue={content} {onChange} theme="md-light" />
</div>

<style type="postcss">
  .QuestionContent-container {
    height: calc(100vh - 440px);
    @apply rounded border shadow;
  }
</style>
