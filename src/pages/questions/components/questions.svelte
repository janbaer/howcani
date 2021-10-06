<script>
  import { createEventDispatcher } from 'svelte';
  import viewport from '/@/actions/view-port.action.js';
  import Question from './question.svelte';
  import Spinner from '/@/components/spinner.svelte';

  export let questions = [];
  export let loading = false;
  export let hasMoreData = false;

  const dispatchEvent = createEventDispatcher();
</script>

<div class="Questions-container">
  {#each questions as question (question.id)}
    <div class="Question-container">
      <Question {question} />
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
