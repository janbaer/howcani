<script>
  import { push as navigate } from 'svelte-spa-router';

  import { configStore } from './../stores/config.store';
  import GithubService from './../services/github.service.js';

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
      <div class="form-input-container">
        <label for="name" class="form-label" class:form-label-error={!isUserValid}>Name</label>
        <input
          type="text"
          id="name"
          name="name"
          class="form-input"
          class:form-input-error={!isUserValid}
          bind:value={user}
        />
      </div>
      <div class="form-input-container">
        <label for="repository" class="form-label" class:form-label-error={!isUserValid}>
          Repository
        </label>
        <input
          type="text"
          id="repository"
          name="repository"
          class="form-input"
          class:form-input-error={!isRepositoryValid}
          bind:value={repository}
        />
      </div>
      <button class="form-primary-button" type="submit">Connect</button>
    </form>
  </section>
</Page>

<style type="postcss">
  .form-container {
    @apply bg-gray-100 p-6 h-full w-full;
  }
  .form {
    @apply bg-white sm:w-full lg:w-6/12 p-6 rounded-xl;
  }
  .form-header {
    @apply text-2xl text-gray-900 text-lg mb-1 font-medium;
  }
  .form-help-text {
    @apply leading-relaxed mb-4 text-gray-600 text-base font-normal;
  }
  .form-input-container {
    @apply relative mb-4;
  }
  .form-label {
    @apply leading-7 text-sm text-gray-600;
  }
  .form-label-error {
    @apply text-red-400;
  }
  .form-input {
    @apply w-full bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out;
  }
  .form-input-error {
    @apply border-red-400;
  }

  .form-primary-button {
    @apply text-white bg-blue-500 border-0 py-2 px-6 focus:outline-none hover:bg-blue-600 rounded text-lg;
  }
</style>
