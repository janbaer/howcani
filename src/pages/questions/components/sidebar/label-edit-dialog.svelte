<script>
  import { createEventDispatcher } from 'svelte';
  import ModalDialog from '/@/components/modal-dialog.svelte';
  import FormInput from '/@/components/form-input.svelte';
  import FormColorInput from '/@/components/form-color-input.svelte';

  export let isActive = false;
  export let label = null;

  let isLabelValid = true;

  const dispatchEvent = createEventDispatcher();

  $: {
    if (label) {
      isLabelValid = !!label.name;
    }
  }

  export function showModal(l) {
    label = l;

    isActive = true;
  }

  function beforeClose(e) {
    e.detail.canClose = isLabelValid;
  }

  async function closeModalDialog({ detail: isCancelled }) {
    isActive = false;
    if (isCancelled) {
      return;
    }

    dispatchEvent('closeDialog', label);
  }
</script>

{#if isActive}
  <ModalDialog maxWidth="800px" {isActive} on:close={closeModalDialog} on:beforeClose={beforeClose}>
    <div class="QuestionDetailsContent-container" slot="content">
      <FormInput
        name="labelName"
        caption="Name"
        isValid={isLabelValid}
        autoFocus={true}
        bind:value={label.name}
      />
      <FormColorInput
        name="labelColor"
        caption="Color"
        isValid={isLabelValid}
        bind:value={label.color}
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
