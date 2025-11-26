<script>
  import { Checkbox } from 'svelte-materialify';
  import configStore from '/@/stores/config-store.svelte.js';
  import labelsStore from '/@/stores/labels-store.svelte';
  import { Icon } from 'svelte-materialify';
  import { mdiTrashCan, mdiPencil } from '@mdi/js';
  import LabelEditDialog from './label-edit-dialog.svelte';

  /**
   * @typedef {Object} Props
   * @property {any} [label]
   * @property {boolean} [checked]
   * @property {function} [onLabelSelectionChanged]
   */

  /** @type {Props} */
  let { label = {}, checked = $bindable(false), onLabelSelectionChanged } = $props();

  let labelEditDialog = $state();

  function onEditLabel() {
    labelEditDialog.showModal({ ...label });
  }

  function onCloseDialog(label) {
    labelsStore.update(configStore, label);
  }

  function onDeleteLabel() {
    labelsStore.delete(configStore, label);
  }

  function onSelectLabelChange() {
    onLabelSelectionChanged({ name: label.name, checked });
  }
</script>

<Checkbox bind:checked on:change={onSelectLabelChange}>
  <div class="LabelContainer">
    <span style="color: {label.color}">{label.name}</span>
    <button onclick={onEditLabel}>
      <Icon class="Label-buttonIcon grey-text" path={mdiPencil} size="24px" />
    </button>
    <button onclick={onDeleteLabel}>
      <Icon path={mdiTrashCan} size="24px" class="grey-text" />
    </button>
  </div>
</Checkbox>

<LabelEditDialog bind:this={labelEditDialog} {onCloseDialog} />

<style>
  :global(.s-checkbox__wrapper) {
    color: #9e9e9e !important;
  }

  :global(.s-list-item .s-icon) {
    margin-top: 0px !important;
    margin-bottom: 0px !important;
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
