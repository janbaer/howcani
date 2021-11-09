<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { get } from 'svelte/store';
  import Tags from 'svelte-tags-input';
  import ModalDialog from '/@/components/modal-dialog.svelte';
  import FormInput from '/@/components/form-input.svelte';
  import QuestionDetailsContent from './question-details-content.svelte';
  import questionService from '/@/services/question.service.js';
  import { labelsStore } from '/@/stores/labels.store.js';
  import { mapLabelNames } from '/@/helpers/labels.helpers.js';

  export let isActive = false;
  export let question = null;

  let isTitleValid = true;

  let allLabelNames = [];
  let selectedLabelNames = [];

  const dispatchEvent = createEventDispatcher();

  $: {
    if (question) {
      isTitleValid = !!question.title;
    }
  }

  export function showModal(q) {
    question = q;

    allLabelNames = get(labelsStore).map((l) => l.name);
    selectedLabelNames = question.labels.map((l) => l.name);

    isActive = true;
  }

  function beforeClose(e) {
    e.detail.canClose = isTitleValid;
  }

  function onTags(event) {
    selectedLabelNames = event.detail.tags;
  }

  async function closeModalDialog({ detail: isCancelled }) {
    isActive = false;
    if (isCancelled) {
      return;
    }

    const selectedLabels = mapLabelNames(get(labelsStore), selectedLabelNames);
    question.labels = selectedLabels;

    dispatchEvent('closeQuestionDetails', question);
  }

  function changeBody({ detail: newValue }) {
    question.body = newValue;
  }
</script>

{#if isActive}
  <ModalDialog
    maxWidth="1200px"
    {isActive}
    on:close={closeModalDialog}
    on:beforeClose={beforeClose}
  >
    <div class="QuestionDetailsContent-container" slot="content">
      <FormInput
        name="title"
        caption="Title"
        isValid={isTitleValid}
        autoFocus={true}
        bind:value={question.title}
      />
      <QuestionDetailsContent content={question.body} on:change={changeBody} />
      <Tags
        name="questionLabels"
        autoComplete={allLabelNames}
        tags={selectedLabelNames}
        on:tags={onTags}
        labelText="Labels:"
        labelShow
      />
      <FormInput
        name="isAnsweredCheckbox"
        type="checkbox"
        caption="Is answered"
        bind:value={question.isAnswered}
      />
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
