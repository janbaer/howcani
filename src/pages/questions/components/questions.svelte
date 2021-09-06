<script>
  import { createEventDispatcher } from 'svelte';
  import viewport from '/@/actions/view-port.action.js';
  import Question from './question.svelte';
  import Spinner from '/@/components/spinner.svelte';
  import ModalDialog from '/@/components/modal/modal.svelte';

  export let questions = [];
  export let loading = false;
  export let hasMoreData = false;

  const dispatchEvent = createEventDispatcher();

  let isModalActive = false;

  let modalQuestion = null;

  function showQuestionModal({ detail: question }) {
    modalQuestion = question;
    isModalActive = true;
  }

  function closeModalQuestion() {
    isModalActive = false;
    modalQuestion = null;
  }
</script>

<div class="Questions-container">
  {#each questions as question (question.id)}
    <div class="Question-container">
      <Question {question} on:showQuestionModal={showQuestionModal} />
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

{#if modalQuestion}
  <ModalDialog isActive={isModalActive} on:close={closeModalQuestion}>
    <p class="text-2xl font-bold" slot="header">{modalQuestion.title}</p>
    <div slot="content">Hello modal</div>
  </ModalDialog>
{/if}

<style>
  .Questions-container {
    columns: 20rem auto;
    padding: 10px;
  }

  .Question-container {
    width: 100%;
    break-inside: avoid;
    page-break-inside: avoid;
    padding-bottom: 10px;
  }
</style>
