<script>
  import { createEventDispatcher } from 'svelte';
  import { get } from 'svelte/store';
  import viewport from '/@/actions/view-port.action.js';
  import Question from './question.svelte';
  import Spinner from '/@/components/spinner.svelte';
  import QuestionDetails from './details/question-details.svelte';
  import { configStore } from '/@/stores/config.store.js';
  import { createQuestion, updateQuestion } from '/@/stores/questions.store.js';

  export let questions = [];
  export let loading = false;
  export let hasMoreData = false;

  const dispatchEvent = createEventDispatcher();

  let questionDetailsDialog;

  export function addQuestion() {
    const newQuestion = { title: '', body: '', labels: [], isAnswered: false };
    questionDetailsDialog.showModal(newQuestion);
  }

  function onEditQuestion({ detail: question }) {
    questionDetailsDialog.showModal({ ...question });
  }

  function onCloseQuestionDetails({ detail: question }) {
    const config = get(configStore);
    if (!question.id) {
      createQuestion(config, question);
    } else {
      updateQuestion(config, question);
    }
  }
</script>

<div class="Questions-container">
  {#each questions as question (question.id)}
    <div class="Question-container">
      <Question {question} on:editQuestion={onEditQuestion} />
    </div>
  {/each}
  {#if hasMoreData}
    <div class="Question-container" use:viewport on:enterViewport={() => dispatchEvent('loadMore')}>
      {#if loading}
        <Spinner />
      {/if}
    </div>
  {/if}
</div>

<QuestionDetails
  bind:this={questionDetailsDialog}
  on:closeQuestionDetails={onCloseQuestionDetails}
/>

<style type="postcss">
  .Questions-container {
    columns: 25rem auto;
    padding: 10px;
  }

  .Question-container {
    width: 100%;
    break-inside: avoid;
    page-break-inside: avoid;
    padding-bottom: 10px;
  }
</style>
