<script>
  /* import 'codemirror'; */
  import 'codemirror/lib/codemirror.css';
  import Editor from '@svelte-parts/editor';
  import 'codemirror/mode/gfm/gfm';
  import '@svelte-parts/editor/md-light.css';

  export let content;

  const config = {
    lineNumbers: true,
    lineWrapping: true,
    mode: {
      name: 'gfm',
      highlightFormatting: true,
    },
  };

  function changeContent(newValue) {
    content = newValue;
  }
</script>

<div class="QuestionContent-container">
  <Editor {config} initialValue={content} onChange={changeContent} theme="md-light" />
</div>

<style type="postcss">
  .QuestionContent-container {
    height: calc(100vh - 440px);
    @apply rounded border shadow;
  }
</style>
