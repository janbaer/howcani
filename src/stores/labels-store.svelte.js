import GithubService from './../services/github.service';
import { replaceItemById, removeItemById } from './../helpers/array.helpers';

class LabelsStore {
  #labels = $state([]);

  #mapLabel(label) {
    return {
      id: label.id,
      name: label.name,
      color: `#${label.color}`,
    };
  }

  get labels() {
    return this.#labels;
  }

  async load(config) {
    const { user, repository, oauthToken } = config;
    const githubService = new GithubService(user, repository, oauthToken);

    const labels = await githubService.getLabels();
    this.#labels = Array.from(labels, this.#mapLabel);
  }

  async update(config, label) {
    const { user, repository, oauthToken } = config;
    const githubService = new GithubService(user, repository, oauthToken);

    const originalLabel = this.#labels.find(l => l.id === label.id);
    const updatedLabel = await githubService.updateLabel(
      originalLabel.name,
      label.name,
      label.color
    );

    replaceItemById(this.#labels, label.id, this.#mapLabel(updatedLabel));
  }

  async delete(config, label) {
    const { user, repository, oauthToken } = config;
    const githubService = new GithubService(user, repository, oauthToken);

    await githubService.deleteLabel(label.name);
    removeItemById(this.#labels, label.id);
  }
}

export default new LabelsStore();
