<script>
  import { createEventDispatcher } from 'svelte';
  import { get } from 'svelte/store';
  import marked from 'marked';
  import 'github-markdown-css/github-markdown.css';

  import TagSvg from '/@/assets/svg/tag.svg?component';
  import CheckSvg from '/@/assets/svg/check.svg?component';
  import QuestionSvg from '/@/assets/svg/question.svg?component';
  import QuestionDetails from './details/question-details.svelte';

  export let question;

  const dispatchEvent = createEventDispatcher();

  function showQuestionDetailsDialog() {
    dispatchEvent('editQuestion', question);
  }
</script>

<div class="Question-card">
  <div class="Question-header" on:click={showQuestionDetailsDialog}>
    <h2>
      {#if question.isAnswered}
        <CheckSvg class="SvgImage" fill="ForestGreen" />
      {:else}
        <QuestionSvg class="SvgImage" fill="IndianRed" />
      {/if}
      <span>{question.title}</span>
    </h2>
  </div>
  <hr />
  <div class="Question-body markdown-body">
    {@html marked(question.body)}
  </div>
  <div class="Question-footer">
    <div>
      <TagSvg class="SvgImage" fill="DeepSkyBlue" />
      {#each question.labels as label}
        <span class="Question-label" style="color: #{label.color}">{label.name}</span>
      {/each}
    </div>
  </div>
</div>

<style type="postcss">
  .Question-card {
    @apply border border-gray-200 p-4 rounded-lg shadow-md;
  }
  .Question-header {
    @apply cursor-pointer;
  }
  h2 {
    @apply font-normal leading-normal mt-0 mb-2 text-blue-800;
  }
  .Question-body {
    @apply py-2;
  }
  .Question-footer {
  }
  .Question-label {
    @apply mx-2;
  }
</style>
