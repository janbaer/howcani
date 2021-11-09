<script>
  import { onMount } from 'svelte';
  export let caption;
  export let name;
  export let value;
  export let isValid = true;
  export let readonly = false;
  export let autoFocus = false;
  export let type = 'text';

  let inputElement;

  onMount(() => {
    if (autoFocus) {
      inputElement.focus();
      inputElement.select();
    }
  });
</script>

<div class="form-input-container">
  <label for={name} class="form-label" class:form-label-error={!isValid}>
    {caption}:
  </label>
  {#if type === 'text'}
    <input
      {name}
      type="text"
      class="form-input"
      class:form-input-error={!isValid}
      class:form-input-readonly={readonly}
      {readonly}
      bind:value
      bind:this={inputElement}
    />
  {:else if type === 'checkbox'}
    <input
      {name}
      type="checkbox"
      class:form-input-readonly={readonly}
      {readonly}
      bind:checked={value}
    />
  {/if}
</div>
