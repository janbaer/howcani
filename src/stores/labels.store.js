import { writable, get } from 'svelte/store';

import GithubService from './../services/github.service';

export const labelsStore = writable([]);

export async function loadLabels(config) {
  const { user, repository, oauthToken } = config;
  const githubService = new GithubService(user, repository, oauthToken);

  const labels = await githubService.getLabels();
  labelsStore.set(labels.map(mapLabel));
}

export async function updateLabel(config, label) {
  const { user, repository, oauthToken } = config;
  const githubService = new GithubService(user, repository, oauthToken);

  const labels = get(labelsStore);
  const originalLabel = labels.find((l) => l.id === label.id);

  const updatedLabel = await githubService.updateLabel(originalLabel.name, label.name, label.color);

  originalLabel.name = label.name;
  originalLabel.color = label.color;

  labelsStore.set(labels);
}

export async function deleteLabel(config, label) {
  const { user, repository, oauthToken } = config;
  const githubService = new GithubService(user, repository, oauthToken);

  await githubService.deleteLabel(label.name);

  const labels = get(labelsStore);
  const index = labels.findIndex((l) => l.id === label.id);

  labels.splice(index, 1);
  labelsStore.set(labels);
}

function mapLabel(label) {
  return {
    id: label.id,
    name: label.name,
    color: `#${label.color}`,
  };
}
