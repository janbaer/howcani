<script>
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

  /**
   * @typedef {Object} Props
   * @property {boolean} [active]
   * @property {any} [label]
   * @property {function} [onCloseDialog]
   */

  /** @type {Props} */
  let { active = $bindable(false), label = $bindable(null), onCloseDialog } = $props();

  let isLabelValid = $state(true);
  let okButtonClass = $state('primary-color');

  $effect(() => {
    isLabelValid = !!label?.name;
    okButtonClass = isLabelValid ? 'primary-color' : '';
  });

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
    onCloseDialog(label);
  }
</script>

<svelte:window onkeydown={onWindowKeydown} />

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
            <Button
              on:click={confirmDialog}
              class={okButtonClass}
              size="large"
              disabled={!isLabelValid}>Ok</Button
            >
          </Col>
        </Row>
      </CardActions>
    </Card>
  </Dialog>
{/if}
