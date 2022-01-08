<script>
  import { createEventDispatcher } from 'svelte';
  import { get } from 'svelte/store';
  import { cubicInOut } from 'svelte/easing';
  import { Checkbox } from 'svelte-materialify';
  import { configStore } from '/@/stores/config.store.js';
  import { updateLabel, deleteLabel } from '/@/stores/labels.store.js';
  import DeleteSvg from '/@/assets/svg/delete.svg';
  import EditSvg from '/@/assets/svg/edit.svg';
  import fadeScale from '/@/helpers/fade-scale.animation';
  import LabelEditDialog from './label-edit-dialog.svelte';

  export let label = {};
  export let checked = false;

  let showEditButtons = false;
  let labelEditDialog;

  const dispatchEvent = createEventDispatcher();

  function onEditLabel() {
    labelEditDialog.showModal({ ...label });
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

<Checkbox bind:checked on:change={onSelectLabelChange}>
  <div class="LabelContainer">
    <span style="color: {label.color}">{label.name}</span>
    <button on:click={onEditLabel}>
      <EditSvg class="SvgImage" />
    </button>
    <button on:click={onDeleteLabel}>
      <DeleteSvg class="SvgImage" />
    </button>
  </div>
</Checkbox>

<LabelEditDialog bind:this={labelEditDialog} on:closeDialog={onCloseDialog} />

<style>
  :global(.s-checkbox__wrapper) {
    color: #9e9e9e !important;
  }

  .LabelContainer {
    display: flex;
    align-items: center;
    width: 170px;
  }

  .LabelContainer > span {
    flex: 1;
  }

  .LabelContainer > button {
    margin: 0 1px;
    color: #7b8ca8c2;
    opacity: 0.5;
  }
  .LabelContainer > button:hover {
    color: grey;
    opacity: 1;
  }
</style>
