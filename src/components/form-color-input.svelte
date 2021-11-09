<script>
  import { onMount } from 'svelte';
  export let caption;
  export let name;
  export let value;
  export let readonly = false;
  export let autoFocus = false;

  let inputElement;

  onMount(() => {
    if (autoFocus) {
      inputElement.focus();
      inputElement.select();
    }
  });
</script>

<div class="form-input-container">
  <label for={name} class="form-label">
    {caption}:
  </label>
  <input
    {name}
    type="color"
    class="form-input"
    class:form-input-readonly={readonly}
    {readonly}
    bind:value
    bind:this={inputElement}
    list="color-list"
  />
  <datalist id="color-list">
    <option>#190707</option>
    <option>#6E6E6E</option>
    <option>#A4A4A4</option>
    <option>#0404B4</option>
    <option>#2E64FE</option>
    <option>#0B3B0B</option>
    <option>#3ADF00</option>
    <option>#B40404</option>
    <option>#FF0040</option>
    <option>#F7819F</option>
    <option>#FF8000</option>
    <option>#8904B1</option>
    <option>#642EFE</option>
    <option>#D7DF01</option>
    <option>#F4FA58</option>
  </datalist>
</div>
