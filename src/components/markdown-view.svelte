<script>
  import { marked } from 'marked';
  import 'github-markdown-css/github-markdown-light.css';

  /**
   * @typedef {Object} Props
   * @property {string} [content]
   */

  /** @type {Props} */
  let { content = '' } = $props();

  const markedOptions = { mangle: false, headerIds: false, headerPrefix: false };
</script>

<div class="markdown-body">
  {@html marked(content, markedOptions)}
</div>
