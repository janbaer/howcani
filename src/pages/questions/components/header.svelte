<script>
  import { createEventDispatcher } from 'svelte';
  import { push as navigate } from 'svelte-spa-router';
  import AddSvg from '/@/assets/svg/add.svg?component';
  import GitHubSvg from '/@/assets/svg/github.svg?component';
  import BurgerSvg from '/@/assets/svg/burger.svg?component';

  const dispatchEvent = createEventDispatcher();

  function toggleSidebar() {
    dispatchEvent('toggleSidebar');
  }

  function gotoConnectPage() {
    navigate('/connect?logoff');
  }

  function addDocument() {
    dispatchEvent('addDocument');
  }
</script>

<div class="Header-container">
  <div class="Header-leftContainer">
    <button class="Header-button" on:click={addDocument} title="Add new question">
      <AddSvg />
    </button>
  </div>
  <div class="Header-rightContainer">
    <button class="Header-button" on:click={gotoConnectPage} title="Login & connect">
      <GitHubSvg class="SvgImage" />
    </button>
    <button on:click={toggleSidebar} class="HeaderSidebar-button" title="Toggle sidebar">
      <BurgerSvg class="SvgImage" />
    </button>
  </div>
</div>

<style type="postcss">
  .Header-container {
    display: flex;
    flex: 1;
  }
  .Header-leftContainer {
    margin-left: 5px;
    flex: 1;
  }
  .Header-rightContainer {
  }
  .HeaderSidebar-button {
    @apply focus:outline-none text-white w-6 h-6 lg:hidden;
  }
  .Header-button {
    @apply text-white mr-2.5;
  }
</style>
