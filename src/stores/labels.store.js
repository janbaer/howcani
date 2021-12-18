import { writable, get } from 'svelte/store';

import GithubService from './../services/github.service';

export const labelsStore = writable([]);

function _mapLabel(label) {
  return {
    id: label.id,
    name: label.name,
    color: `#${label.color}`,
  };
}

export async function loadLabels(config) {
  const { user, repository, oauthToken } = config;
  const githubService = new GithubService(user, repository, oauthToken);

  const labels = await githubService.getLabels();
  labelsStore.set(labels.map(_mapLabel));
}

export async function updateLabel(config, label) {
  const { user, repository, oauthToken } = config;
  const githubService = new GithubService(user, repository, oauthToken);

  const labels = get(labelsStore);
  const originalLabel = labels.find((l) => l.id === label.id);

  await githubService.updateLabel(originalLabel.name, label.name, label.color);

  loadLabels(config);
}

export async function deleteLabel(config, label) {
  const { user, repository, oauthToken } = config;
  const githubService = new GithubService(user, repository, oauthToken);

  await githubService.deleteLabel(label.name);

  loadLabels(config);
}
