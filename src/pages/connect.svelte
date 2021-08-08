<script>
  import { configStore } from './../stores/config.store';
  import { push as navigate } from 'svelte-spa-router';
  import GithubService from './../services/github.service.js';

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
      console.log('user', githubUser);
      if (!githubUser) {
        isUserValid = false;
        isRepositoryValid = false;
        return;
      }

      const githubRepository = await githubService.getRepository(user, repository);
      console.log('repository', githubRepository);
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

<section class="text-gray-600 body-font relative">
  <div class="container px-5 py-24 mx-auto flex sm:flex-nowrap flex-wrap">
    <form on:submit|preventDefault={handleSubmit}>
      <h2 class="text-gray-900 text-lg mb-1 font-medium title-font">
        Connect to GitHub repository
      </h2>
      <p class="leading-relaxed mb-5 text-gray-600">
        Please enter your GitHub user name and repository
      </p>
      <div class="relative mb-4">
        <label for="name" class="leading-7 text-sm text-gray-600">Name</label>
        <input
          type="text"
          id="name"
          name="name"
          class="w-full bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
          class:border-red-400={!isUserValid}
          bind:value={user}
        />
      </div>
      <div class="relative mb-4">
        <label for="email" class="leading-7 text-sm text-gray-600">Repository</label>
        <input
          type="text"
          id="repository"
          name="repository"
          class="w-full bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
          class:border-red-400={!isRepositoryValid}
          bind:value={repository}
        />
      </div>
      <button
        class="text-white bg-blue-500 border-0 py-2 px-6 focus:outline-none hover:bg-blue-600 rounded text-lg"
        type="submit">Connect</button
      >
    </form>
  </div>
</section>
