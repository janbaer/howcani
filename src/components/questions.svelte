<script>
  import { createEventDispatcher } from 'svelte';
  import viewport from './../actions/view-port.action.js';
  import Question from './question.svelte';

  export let questions = [];
  export let loading = false;
  export let hasMoreData = false;

  const dispatch = createEventDispatcher();
</script>

<div class="Questions-container">
  <ul>
    {#each questions as question (question.id)}
      <li>
        <Question {question} />
      </li>
    {/each}
    {#if hasMoreData}
      <li use:viewport on:enterViewport={() => dispatch('loadMore')}>
        {#if loading}
          Loading...
        {/if}
      </li>
    {/if}
  </ul>
</div>

<style>
  .Questions-container {
    height: 100%;
    overflow-y: scroll;
  }
</style>
