<script>
  export let caption;
  export let name;
  export let value;
  export let isValid = true;
</script>

<div class="form-input-container">
  <label for={name} class="form-label" class:form-label-error={!isValid}>
    {caption}:
  </label>
  <input {name} class="form-input" class:form-input-error={!isValid} type="text" bind:value />
</div>

<style type="postcss">
  .form-input-container {
    @apply relative;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .form-label {
    @apply leading-7 text-sm text-gray-600;
    flex-basis: 100px;
  }
  .form-label-error {
    @apply text-red-400;
  }
  .form-input {
    @apply w-full bg-white rounded border border-gray-300 shadow focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out;
  }
  .form-input-error {
    @apply border-red-400;
  }
</style>
