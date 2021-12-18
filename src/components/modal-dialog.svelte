<script>
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  import { isEscKey } from '/@/helpers/utils.helpers.js';
  import CloseSvg from '/@/assets/svg/x.svg';

  export let isActive = false;
  export let maxWidth = '80%';

  const dispatchEvent = createEventDispatcher();

  function keydown(e) {
    if (isActive && isEscKey(e)) {
      closeModal(true);
    }
  }

  function closeModal(isCancelled = false) {
    if (!isCancelled) {
      const args = {
        canClose: true,
      };
      dispatchEvent('beforeClose', args);
      if (!args.canClose) {
        return;
      }
    }
    dispatchEvent('close', isCancelled);
  }
</script>

<svelte:window on:keydown={keydown} />

<div
  class="fixed w-full h-100 inset-0 z-50 overflow-hidden flex justify-center items-center animated fadeIn faster"
  class:hidden={!isActive}
  class:flex={isActive}
  style="background: rgba(0,0,0,.7);"
>
  <div
    class="border border-teal-500 shadow-lg modal-container bg-white w-11/12 mx-auto rounded shadow-lg z-50 overflow-y-auto"
    style="max-width: {maxWidth};"
    transition:fade={{ delay: 50, duration: 200 }}
  >
    <div class="ModalDialog-contentContainer">
      <!--Title-->
      <div class="ModalDialog-headerContainer">
        <slot name="header" />
      </div>
      <div class="ModalDialog-closeButton cursor-pointer z-50" on:click={() => closeModal(true)}>
        <CloseSvg />
      </div>
      <!--Body-->
      <div class="ModalDialog-bodyContainer">
        <slot name="content" />
      </div>
      <!--Footer-->
      <div class="ModalDialog-footerContainer">
        <slot name="footer" />
      </div>
      <div class="ModalDialog-footerButtons">
        <button
          class="focus:outline-none modal-close px-4 bg-gray-400 p-3 rounded-lg text-black hover:bg-gray-300"
          on:click={() => closeModal(true)}
        >
          Cancel
        </button>
        <button
          class="focus:outline-none px-4 bg-blue-500 p-3 ml-3 rounded-lg text-white hover:bg-teal-400"
          on:click={() => closeModal(false)}
        >
          OK
        </button>
      </div>
    </div>
  </div>
</div>

<style type="postcss">
  .ModalDialog-contentContainer {
    display: grid;
    grid-template-columns: 1fr 260px;
    grid-template-rows: 30px 1fr 50px;
    grid-template-areas:
      'modal-header modal-close'
      'modal-body modal-body'
      'modal-footer modal-footer-buttons';

    @apply py-4 px-6;
  }

  .ModalDialog-headerContainer {
    grid-area: modal-header;
  }

  .ModalDialog-closeButton {
    grid-area: modal-close;
    justify-self: end;
    align-self: center;
  }

  .ModalDialog-bodyContainer {
    grid-area: modal-body;
    @apply my-5;
  }

  .ModalDialog-footerContainer {
    grid-area: modal-footer;
  }

  .ModalDialog-footerButtons {
    grid-area: modal-footer-buttons;
    justify-self: end;
    align-self: center;
  }

  button {
    width: 120px;
  }
</style>
