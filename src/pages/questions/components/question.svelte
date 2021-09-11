<script>
  import marked from 'marked';
  import { createEventDispatcher } from 'svelte';
  import ModalDialog from '/@/components/modal/modal.svelte';
  import Tag from '/@/assets/svg/tag.svg?component';

  export let question;

  let isModalActive = false;

  function showQuestionModal() {
    isModalActive = true;
  }

  function closeModalQuestion({ detail: isCancelled }) {
    isModalActive = false;
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
      <Tag class="SvgImage" />
      {#each question.labels as label}
        <span class="Question-label" style="color: #{label.color}">{label.name}</span>
      {/each}
    </div>
  </div>
</div>

{#if isModalActive}
  <ModalDialog isActive={isModalActive} on:close={closeModalQuestion}>
    <p class="text-2xl font-bold" slot="header">{question.title}</p>
    <div slot="content">Hello modal</div>
  </ModalDialog>
{/if}

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
