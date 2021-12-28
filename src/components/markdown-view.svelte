<script>
  import { marked } from 'marked';
  import 'github-markdown-css/github-markdown.css';

  export let content = '';
</script>

<div class="markdown-body">
  {@html marked(content)}
</div>
