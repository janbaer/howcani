<script>
  import { marked } from 'marked';
  import 'github-markdown-css/github-markdown-light.css';

  export let content = '';

  const markedOptions = { mangle: false, headerIds: false, headerPrefix: false };
</script>

<div class="markdown-body">
  {@html marked(content, markedOptions)}
</div>
