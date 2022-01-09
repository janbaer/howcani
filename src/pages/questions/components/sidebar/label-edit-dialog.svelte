<script>
  import { createEventDispatcher } from 'svelte';
  import {
    Dialog,
    Card,
    CardText,
    CardActions,
    Button,
    TextField,
    Row,
    Col,
  } from 'svelte-materialify';

  import { isEscKey } from '/@/helpers/utils.helpers.js';

  export let active = false;
  export let label = null;

  const dispatchEvent = createEventDispatcher();

  $: {
    if (label) {
      isLabelValid = !!label.name;
    }
  }

  export function showModal(l) {
    label = l;

    active = true;
  }

  function onWindowKeydown(event) {
    if (active && isEscKey(event)) {
      cancelDialog();
    }
  }

  async function cancelDialog() {
    active = false;
  }

  async function confirmDialog() {
    active = false;
    dispatchEvent('closeDialog', label);
  }
</script>

<svelte:window on:keydown={onWindowKeydown} />

{#if active}
  <Dialog {active}>
    <Card class="pt-5">
      <CardText>
        <Row>
          <Col>
            <TextField bind:value={label.name}>Name</TextField>
          </Col>
        </Row>
        <Row>
          <Col>
            <TextField type="color" bind:value={label.color}>Color</TextField>
          </Col>
        </Row>
      </CardText>
      <CardActions class="pr-4">
        <Row>
          <Col class="d-flex justify-center">
            <Button on:click={confirmDialog} class="primary-color" size="large">Ok</Button>
          </Col>
        </Row>
      </CardActions>
    </Card>
  </Dialog>
{/if}
