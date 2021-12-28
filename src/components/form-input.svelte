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

<div class="FormInput-container">
  <label
    for={name}
    class="FormInput-label"
    class:FormInputLabel-forCheckbox={type === 'checkbox'}
    class:FormInputLabel-hasError={!isValid}
  >
    {caption}:
  </label>
  {#if type === 'text'}
    <input
      {name}
      type="text"
      class="FormInput-input"
      class:FormInput-error={!isValid}
      class:FormInput-readonly={readonly}
      {readonly}
      bind:value
      bind:this={inputElement}
    />
  {:else if type === 'checkbox'}
    <input
      {name}
      type="checkbox"
      class:FormInput-readonly={readonly}
      {readonly}
      bind:checked={value}
    />
  {/if}
</div>

<style>
  .FormInput-label {
    display: none;
  }
  @media (min-width: 1024px) {
    .FormInput-label {
      display: block;
    }
  }
  .FormInputLabel-forCheckbox {
    display: block;
  }
</style>
