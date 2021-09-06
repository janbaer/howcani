import { writable } from 'svelte/store';

import GithubService from './../services/github.service';

export const labelsStore = writable([]);

export async function loadLabels(config) {
  const { user, repository, oauthToken } = config;

  const githubService = new GithubService(user, repository, oauthToken);

  const labels = await githubService.getLabels();
  labelsStore.set(labels);
}
