<script>
  import marked from 'marked';
  import { createEventDispatcher } from 'svelte';

  export let question;

  const dispatchEvent = createEventDispatcher();

  function showQuestionModal() {
    dispatchEvent('showQuestionModal', question);
  }
</script>

<div class="Question-card">
  <div class="Question-header" on:click={showQuestionModal}>
    <h2>{question.title}</h2>
  </div>
  <hr />
  <div class="Question-body markdown-body">
    {@html marked(question.body)}
  </div>
  <div class="Question-footer">
    <div>
      {#each question.labels as label}
        <span class="Question-label" style="color: #{label.color}">{label.name}</span>
      {/each}
    </div>
  </div>
</div>

<style>
  .Question-card {
    @apply border border-gray-200 p-6 rounded-lg shadow-md;
  }
  .Question-header {
    @apply m-4 cursor-pointer;
  }
  h2 {
    @apply font-normal leading-normal mt-0 mb-2 text-purple-800;
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
