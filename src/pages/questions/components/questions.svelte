<script>
  import viewport from '/@/actions/view-port.action.js';
  import Question from './question.svelte';
  import Spinner from '/@/components/spinner.svelte';
  import QuestionDetails from './details/question-details.svelte';
  import configStore from '/@/stores/config-store.svelte.js';
  import questionStore from '/@/stores/questions-store.svelte.js';

  /**
   * @typedef {Object} Props
   * @property {any} [questions]
   * @property {boolean} [loading]
   * @property {boolean} [hasMoreData]
   */

  /** @type {Props} */
  let { questions = [], loading = false, hasMoreData = false, loadMore } = $props();

  let questionDetailsDialog = $state();

  export function addQuestion() {
    const newQuestion = { title: '', body: '', labels: [], isAnswered: false };
    questionDetailsDialog.showModal(newQuestion);
  }

  function onEditQuestion(question) {
    questionDetailsDialog.showModal({ ...question });
  }

  function onCloseQuestionDetails(question) {
    if (!question.id) {
      questionStore.create(configStore, question);
    } else {
      questionStore.update(configStore, question);
    }
  }
</script>

{#snippet questionSnippet(question)}
  <div class="Question-container">
    <Question {question} editQuestion={onEditQuestion} />
  </div>
{/snippet}

<div class="Questions-container">
  {#each questions as question (question.id)}
    {@render questionSnippet(question)}
  {/each}
  {#if hasMoreData}
    <div class="Question-container" use:viewport onenterViewport={() => loadMore()}>
      {#if loading}
        <Spinner />
      {/if}
    </div>
  {/if}
</div>

<QuestionDetails
  bind:this={questionDetailsDialog}
  {onCloseQuestionDetails}
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
