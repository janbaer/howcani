<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { get } from 'svelte/store';
  import ModalDialog from '/@/components/modal-dialog.svelte';
  import FormInput from '/@/components/form-input.svelte';
  import QuestionDetailsContent from './question-details-content.svelte';
  import questionService from '/@/services/question.service.js';
  import { labelsStore } from '/@/stores/labels.store.js';
  import { mapLabelNames } from '/@/helpers/labels.helpers.js';

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

  async function closeModalDialog({ detail: isCancelled }) {
    let updatedQuestion;

    if (!isCancelled) {
      const labels = get(labelsStore);

      const selectedLabels = mapLabelNames(
        labels,
        labelNames.split(',').map((label) => label.trim())
      );

      question.labels = selectedLabels;
    }

    dispatchEvent('closeQuestionDetails', { isCancelled, question });
  }

  function changeBody({ detail: newValue }) {
    question.body = newValue;
  }
</script>

{#if question && isActive}
  <ModalDialog {isActive} on:close={closeModalDialog} on:beforeClose={beforeClose}>
    <div class="QuestionDetailsContent-container" slot="content">
      <FormInput name="title" caption="Title" isValid={isTitleValid} bind:value={question.title} />
      <QuestionDetailsContent content={question.body} on:change={changeBody} />
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
