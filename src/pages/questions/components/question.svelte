<script>
  import { get } from 'svelte/store';
  import marked from 'marked';
  import 'github-markdown-css/github-markdown.css';

  import TagSvg from '/@/assets/svg/tag.svg?component';
  import QuestionDetails from './details/question-details.svelte';
  import { configStore } from '/@/stores/config.store.js';
  import { updateQuestion } from '/@/stores/questions.store.js';

  export let question;

  let isQuestionDetailsShown = false;

  function showQuestionDetailsDialog() {
    isQuestionDetailsShown = true;
  }

  function onCloseQuestionDetails({ detail }) {
    isQuestionDetailsShown = false;
    const { isCancelled, question } = detail;
    if (isCancelled) {
      return;
    }

    const config = get(configStore);
    updateQuestion(config, question);
  }
</script>

<div class="Question-card">
  <div class="Question-header" on:click={showQuestionDetailsDialog}>
    <h2>{question.title}</h2>
  </div>
  <hr />
  <div class="Question-body markdown-body">
    {@html marked(question.body)}
  </div>
  <div class="Question-footer">
    <div>
      <TagSvg class="SvgImage" />
      {#each question.labels as label}
        <span class="Question-label" style="color: #{label.color}">{label.name}</span>
      {/each}
    </div>
  </div>
</div>

{#if isQuestionDetailsShown}
  <QuestionDetails
    question={{ ...question }}
    isActive={isQuestionDetailsShown}
    on:closeQuestionDetails={onCloseQuestionDetails}
  />
{/if}

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
