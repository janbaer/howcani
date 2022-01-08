<script>
  import { createEventDispatcher } from 'svelte';
  import { Card, CardTitle, CardText, CardActions, Button } from 'svelte-materialify';

  import TagSvg from '/@/assets/svg/tag.svg';
  import CheckSvg from '/@/assets/svg/check.svg';
  import QuestionSvg from '/@/assets/svg/question.svg';

  import MarkdownView from '/@/components/markdown-view.svelte';

  export let question = {};

  const dispatchEvent = createEventDispatcher();

  function showQuestionDetailsDialog() {
    dispatchEvent('editQuestion', question);
  }
</script>

<Card>
  <CardTitle>
    <h3 on:click={showQuestionDetailsDialog}>
      {#if question.isAnswered}
        <CheckSvg class="SvgImage" fill="ForestGreen" />
      {:else}
        <QuestionSvg class="SvgImage" fill="IndianRed" />
      {/if}
      <span>{question.title}</span>
    </h3>
  </CardTitle>
  <CardText>
    <div class="Question-body">
      <MarkdownView content={question.body} />
    </div>
  </CardText>
  <CardActions>
    <div>
      <TagSvg class="SvgImage" fill="DeepSkyBlue" />
      {#each question.labels as label}
        <span class="Question-label" style="color: #{label.color}">{label.name}</span>
      {/each}
    </div>
  </CardActions>
</Card>

<style type="postcss">
  h3 {
    cursor: pointer;
    font-size: 1.25rem;
    line-height: 1.25rem;
  }
  h3:hover {
    text-decoration: underline;
    color: var(--link-color);
  }
</style>
