<script>
  import TagSvg from '/@/assets/svg/tag.svg?component';

  export let labels = [];
  let labelNames = [];

  $: labelNames = labels.map((l) => l.name).join(', ');
</script>

<div class="QuestionDetailsLabels-container">
  <TagSvg class="SvgImage" />
  <input name="labels" type="text" bind:value={labelNames} class="form-input" />
</div>

<style type="postcss">
  .QuestionDetailsLabels-container {
    display: flex;
    flex-direction: row;
    align-items: center;
  }
  .QuestionDetailsLabels-container > input {
    margin-left: 10px;
  }
</style>
