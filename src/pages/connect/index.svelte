<script>
  import { push as navigate } from 'svelte-spa-router';

  import { configStore } from '/@/stores/config.store';
  import GithubService from '/@/services/github.service.js';
  import FormInput from '/@/components/form-input.svelte';
  import Page from '/@/components/page.svelte';

  let user = '';
  let repository = '';
  let isUserValid = true;
  let isRepositoryValid = true;

  async function handleSubmit() {
    isUserValid = !!user;
    isRepositoryValid = !!repository;

    if (isUserValid) {
      const githubService = new GithubService();
      const githubUser = await githubService.getUser(user);
      if (!githubUser) {
        isUserValid = false;
        isRepositoryValid = false;
        return;
      }

      const githubRepository = await githubService.getRepository(user, repository);
      if (!githubRepository) {
        isRepositoryValid = false;
        return;
      }
    }

    if (isUserValid && isRepositoryValid) {
      configStore.update((config) => {
        config.user = user;
        config.repository = repository;
        return config;
      });
      navigate('/');
    }
  }
</script>

<svelte:head>
  <title>HowCanI - Connect to GitHub repository</title>
</svelte:head>

<Page>
  <section slot="content" class="form-container">
    <form class="form" on:submit|preventDefault={handleSubmit}>
      <h2 class="form-header title-font">Connect to GitHub repository</h2>
      <p class="form-help-text">Please enter your GitHub user name and repository</p>
      <FormInput name="name" caption="Name" isValid={isUserValid} bind:value={user} />
      <FormInput
        name="repository"
        caption="Repository"
        isValid={isRepositoryValid}
        bind:value={repository}
      />
      <button class="form-primary-button" type="submit">Connect</button>
    </form>
  </section>
</Page>

<style type="postcss">
  .form {
    display: flex;
    flex-direction: column;
    gap: 15px;
    @apply bg-white sm:w-full lg:w-6/12 p-6 rounded-xl;
  }
  .form-header {
    @apply text-2xl text-gray-900 text-lg mb-1 font-medium;
  }
  .form-help-text {
    @apply leading-relaxed mb-4 text-gray-600 text-base font-normal;
  }
  .form-primary-button {
    @apply text-white bg-blue-500 border-0 py-2 px-6 focus:outline-none hover:bg-blue-600 rounded text-lg;
  }
</style>
