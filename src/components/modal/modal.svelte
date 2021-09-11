<script>
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  import { isEscKey } from './../utils.js';
  import CloseSvg from '/@/assets/svg/x.svg?component';

  export let isActive = false;
  export let width = '80%';

  const dispatchEvent = createEventDispatcher();

  function keydown(e) {
    if (isActive && isEscKey(e)) {
      closeModal(true);
    }
  }

  function closeModal(isCancelled = false) {
    dispatchEvent('close', isCancelled);
  }
</script>

<svelte:window on:keydown={keydown} />

<div
  class="main-modal fixed w-full h-100 inset-0 z-50 overflow-hidden flex justify-center items-center animated fadeIn faster"
  class:hidden={!isActive}
  class:flex={isActive}
  style="background: rgba(0,0,0,.7);"
>
  <div
    class="border border-teal-500 shadow-lg modal-container bg-white w-11/12 mx-auto rounded shadow-lg z-50 overflow-y-auto"
    style="max-width: {width};"
    transition:fade={{ delay: 150, duration: 200 }}
  >
    <div class="modal-content py-4 text-left px-6">
      <!--Title-->
      <div class="flex justify-between items-center pb-3">
        <div>
          <slot name="header">
            <p class="text-2xl font-bold">Header</p>
          </slot>
        </div>
        <div class="modal-close cursor-pointer z-50" on:click={() => closeModal(true)}>
          <CloseSvg />
        </div>
      </div>
      <!--Body-->
      <div class="my-5">
        <slot name="content" />
      </div>
      <!--Footer-->
      <div class="flex justify-end pt-2">
        <button
          class="focus:outline-none modal-close px-4 bg-gray-400 p-3 rounded-lg text-black hover:bg-gray-300"
          on:click={() => closeModal(true)}>Cancel</button
        >
        <button
          class="focus:outline-none px-4 bg-blue-500 p-3 ml-3 rounded-lg text-white hover:bg-teal-400"
          on:click={() => closeModal(false)}>OK</button
        >
      </div>
    </div>
  </div>
</div>

<style>
  button {
    width: 100px;
  }
</style>
