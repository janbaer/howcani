<script>
  import { createEventDispatcher } from 'svelte';
  import { Card, CardTitle, CardText, CardActions, Row, Col, Icon } from 'svelte-materialify';
  import { mdiTag, mdiCheck, mdiHelp, mdiUpdate } from '@mdi/js';
  import { formatISO9075 } from 'date-fns';

  import MarkdownView from '/@/components/markdown-view.svelte';

  export let question = {};

  const dispatchEvent = createEventDispatcher();

  function showQuestionDetailsDialog() {
    dispatchEvent('editQuestion', question);
  }

  function formatCreated({ created }) {
    return formatISO9075(new Date(created));
  }
</script>

<Card>
  <CardTitle>
    <h3 on:click={showQuestionDetailsDialog}>
      {#if question.isAnswered}
        <Icon path={mdiCheck} size="24px" class="green-text" />
      {:else}
        <Icon path={mdiHelp} size="24px" class="red-text" />
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
    <Row>
      <Col class="d-flex align-center pl-5">
        <Icon path={mdiTag} size="24px" class="orange-text" />
        {#each question.labels as label}
          <span class="Question-label" style="color: #{label.color}">{label.name}</span>
        {/each}
      </Col>
      <Col class="d-flex justify-end pr-5">
        <Icon path={mdiUpdate} size="24px" class="teal-text mr-1" />
        <span>{formatCreated(question)}</span>
      </Col>
    </Row>
  </CardActions>
</Card>

<style lang="scss">
  h3 {
    cursor: pointer;
    font-size: 1rem;
    font-weight: 600;
    line-height: 1rem;
    display: flex;
    align-items: center;
    gap: 5px;

    &:hover {
      text-decoration: underline;
      color: var(--link-color);
    }
  }

  .Question-label {
    margin-left: 5px;
  }
</style>
