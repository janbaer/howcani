<script>
  import { createEventDispatcher } from 'svelte';
  import { get } from 'svelte/store';
  import { cubicInOut } from 'svelte/easing';
  import { configStore } from '/@/stores/config.store.js';
  import { updateLabel, deleteLabel } from '/@/stores/labels.store.js';
  import LabelEditDialog from './label-edit-dialog.svelte';
  import DeleteSvg from '/@/assets/svg/delete.svg?component';
  import EditSvg from '/@/assets/svg/edit.svg?component';

  import fadeScale from '/@/helpers/fade-scale.animation';

  export let label;
  export let checked = false;
  let showEditButtons = false;

  let labelEditDialog;

  const dispatchEvent = createEventDispatcher();

  function onEditLabel() {
    labelEditDialog.showModal(label);
  }

  function onCloseDialog({ detail: label }) {
    const config = get(configStore);
    updateLabel(config, label);
  }

  function onDeleteLabel() {
    const config = get(configStore);
    deleteLabel(config, label);
  }

  function onSelectLabelChange() {
    dispatchEvent('labelSelectionChanged', { name: label.name, checked });
  }
</script>

<div
  class="LabelContainer"
  on:mouseover={() => (showEditButtons = true)}
  on:mouseout={() => (showEditButtons = false)}
>
  <input type="checkbox" bind:checked on:change={onSelectLabelChange} />
  <span style="color: {label.color}">{label.name}</span>

  {#if showEditButtons}
    <div
      transition:fadeScale={{
        delay: 150,
        duration: 1000,
        easing: cubicInOut,
        baseScale: 0,
      }}
    >
      <button on:click={onEditLabel}>
        <EditSvg class="SvgImage" />
      </button>
      <button on:click={onDeleteLabel}>
        <DeleteSvg class="SvgImage" />
      </button>
    </div>
  {/if}
</div>

<LabelEditDialog bind:this={labelEditDialog} on:closeDialog={onCloseDialog} />

<style>
  .LabelContainer {
    display: flex;
    align-items: center;
    height: 26px;
  }

  input {
    margin-right: 5px;
  }

  span {
    flex: 1;
  }

  button {
    margin: 0 1px;
    color: #7b8ca8c2;
  }
</style>
