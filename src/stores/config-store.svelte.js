class ConfigStore {
  #user = $state('');
  #repository = $state('');
  #oauthToken = $state('');

  get user() {
    return this.#user;
  }

  get repository() {
    return this.#repository;
  }

  get oauthToken() {
    return this.#oauthToken;
  }

  clear() {
    this.#user = '';
    this.#repository = '';
    this.#oauthToken = '';
  }

  load() {
    const localStorageConfig = JSON.parse(localStorage.getItem('config')) || { user: '', repository: '', oauthToken: '' };
    this.#user = localStorageConfig.user;
    this.#repository = localStorageConfig.repository;
    this.#oauthToken = localStorageConfig.oauthToken;
  }
  save(user, repository, oauthToken) {
    this.#user = user;
    this.#repository = repository;
    this.#oauthToken = oauthToken;
    localStorage.setItem('config', JSON.stringify({ user, repository, oauthToken }));
  }
}

export default new ConfigStore();
