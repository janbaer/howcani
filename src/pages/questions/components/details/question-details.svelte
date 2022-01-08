<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { get } from 'svelte/store';
  import Tags from 'svelte-tags-input';
  import {
    Dialog,
    Card,
    CardTitle,
    CardText,
    CardActions,
    Button,
    TextField,
    Checkbox,
    Row,
    Col,
  } from 'svelte-materialify';

  import { isEscKey } from '/@/helpers/utils.helpers.js';
  import { isTabletOrDesktopSize } from '/@/helpers/media-queries.helpers';
  import QuestionDetailsContent from './question-details-content.svelte';
  import { labelsStore } from '/@/stores/labels.store.js';
  import { mapLabelNames } from '/@/helpers/labels.helpers.js';

  export let active = false;
  export let question = null;

  let isTitleValid = true;

  let allLabelNames = [];
  let selectedLabelNames = [];
  let dialogWidth;
  let okButtonClass = 'primary-color';

  const dispatchEvent = createEventDispatcher();

  $: {
    if (question) {
      isTitleValid = !!question.title;
    }
    okButtonClass = isTitleValid ? 'primary-color' : 'disabled';
  }

  onMount(() => {
    dialogWidth = isTabletOrDesktopSize() ? '70%' : '98%';
  });

  function onWindowKeydown(event) {
    if (active && isEscKey(event)) {
      cancelDialog();
    }
  }

  export function showModal(q) {
    question = q;

    allLabelNames = get(labelsStore).map((l) => l.name);
    selectedLabelNames = question.labels.map((l) => l.name);

    active = true;
  }

  function onTags(event) {
    selectedLabelNames = event.detail.tags;
  }

  function cancelDialog() {
    active = false;
  }

  async function confirmDialog() {
    active = false;

    const selectedLabels = mapLabelNames(get(labelsStore), selectedLabelNames);
    question.labels = selectedLabels;

    dispatchEvent('closeQuestionDetails', question);
  }

  function changeBody({ detail: newValue }) {
    question.body = newValue;
  }
</script>

<svelte:window on:keydown={onWindowKeydown} />

{#if active}
  <Dialog {active} width={dialogWidth}>
    <Card class="pt-5">
      <CardText>
        <Row class="flex-column flex-md-row">
          <Col cols={12} sm={9}>
            <TextField bind:value={question.title}>Title</TextField>
          </Col>
          <Col cols={12} sm={3}>
            <Checkbox bind:checked={question.isAnswered}>Is answered</Checkbox>
          </Col>
        </Row>
        <Row>
          <Col>
            <Tags
              name="questionLabels"
              autoComplete={allLabelNames}
              tags={selectedLabelNames}
              on:tags={onTags}
              labelText="Labels:"
              labelShow
            />
          </Col>
        </Row>
        <Row>
          <Col class="pt-0">
            <QuestionDetailsContent
              content={question.body}
              on:change={changeBody}
              initialShowEditor={!question.id}
            />
          </Col>
        </Row>
      </CardText>
      <CardActions class="pr-5">
        <Row>
          <Col class="d-flex justify-end">
            <Button on:click={cancelDialog} class="mr-4" size="large">Cancel</Button>
            <Button
              on:click={confirmDialog}
              class={okButtonClass}
              disabled={!isTitleValid}
              size="large">Ok</Button
            >
          </Col>
        </Row>
      </CardActions>
    </Card>
  </Dialog>
{/if}
