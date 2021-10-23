<script>
</script>

<div class="QuestionTitle-container">
  <input name="title" type="text" bind:value={title} class="form-input" />
</div>

<style type="postcss">
  .QuestionTitle-container {
    flex: 0.7;
    display: flex;
    align-items: center;
  }
  .form-input {
    @apply w-full bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out;
  }
  button {
    height: 24px;
    width: 24px;
    margin-left: 5px;
  }
</style>
