<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import ModalDialog from '/@/components/modal-dialog.svelte';
  import FormInput from '/@/components/form-input.svelte';
  import QuestionDetailsContent from './question-details-content.svelte';

  export let isActive = false;
  export let question = null;

  let isTitleValid = true;
  let isLabelsValid = true;
  let labelNames = '';

  const dispatchEvent = createEventDispatcher();

  onMount(() => {
    labelNames = question.labels.map((l) => l.name).join(', ');
  });

  $: {
    isTitleValid = !!question.title;
  }

  function beforeClose(e) {
    e.detail.canClose = isTitleValid;
  }

  function closeModalDialog({ detail: isCancelled }) {
    if (!isCancelled) {
    }
    dispatchEvent('closeQuestionDetails', isCancelled);
  }
</script>

{#if question && isActive}
  <ModalDialog {isActive} on:close={closeModalDialog} on:beforeClose={beforeClose}>
    <div class="QuestionDetailsContent-container" slot="content">
      <FormInput name="title" caption="Title" isValid={isTitleValid} bind:value={question.title} />
      <QuestionDetailsContent content={question.body} />
      <FormInput name="labels" caption="Labels" isValid={isLabelsValid} bind:value={labelNames} />
    </div>
  </ModalDialog>
{/if}

<style type="postcss">
  .QuestionDetailsContent-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
</style>
