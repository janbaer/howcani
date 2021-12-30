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

<label for={name}>
  {caption}:
  {#if type === 'text'}
    <input {name} type="text" {readonly} bind:value bind:this={inputElement} />
  {:else if type === 'checkbox'}
    <input {name} type="checkbox" {readonly} bind:checked={value} />
  {/if}
</label>

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
