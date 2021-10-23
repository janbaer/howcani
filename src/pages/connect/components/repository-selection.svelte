<script>
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { push as navigate } from 'svelte-spa-router';
  import GithubService from '/@/services/github.service.js';
  import FormInput from '/@/components/form-input.svelte';
  import { configStore } from '/@/stores/config.store';

  let user = '';
  let repository = '';
  let isUserValid = true;
  let isRepositoryValid = true;

  configStore.subscribe((config) => {
    if (!config.oauthToken) {
      return;
    }
    readUser(config.oauthToken);
  });

  async function readUser(oauthToken) {
    const githubService = new GithubService();
    const githubUser = await githubService.getAuthenticatedUser(oauthToken);
    if (githubUser) {
      user = githubUser.loginName;
    }
  }

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

<form class="form" on:submit|preventDefault={handleSubmit}>
  <h2 class="form-header title-font">Connect to GitHub repository</h2>
  <p class="form-help-text">Please enter your GitHub user name and repository</p>
  <FormInput name="name" caption="Name" isValid={isUserValid} bind:value={user} readonly={true} />
  <FormInput
    name="repository"
    caption="Repository"
    isValid={isRepositoryValid}
    bind:value={repository}
  />
  <button class="form-primary-button" type="submit">Connect</button>
</form>
