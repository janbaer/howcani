import UnauthorizedError from './unauthorized-error';

const GITHUB_ROOT_URL = 'https://api.github.com';

export default class GithubService {
  constructor(user, repository, oauthToken) {
    this.user = user;
    this.repository = repository;
    this.oauthToken = oauthToken;
  }

  _buildQueryString(searchTerm, page, perPage, sort = 'created', order = 'desc') {
    const searchParams = new Map();

    searchParams.set('q', searchTerm);
    searchParams.set('sort', sort);
    searchParams.set('direction', order);
    if (page) {
      searchParams.set('page', page);
      searchParams.set('per_page', perPage);
    }

    let query = '';
    for (const [key, value] of searchParams.entries()) {
      if (query.length > 0) {
        query += '&';
      }
      query += `${key}=${value}`;
    }

    return query;
  }

  _buildRequestOptions(oauthToken, method = 'GET') {
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');

    if (oauthToken) {
      headers.append('Authorization', `token ${oauthToken}`);
    }

    return {
      method,
      headers,
    };
  }

  async _fetch(path, queryString) {
    const requestOptions = this._buildRequestOptions(this.oauthToken);

    let url = `${GITHUB_ROOT_URL}${path}`;
    if (queryString) {
      url += `?${queryString}`;
    }

    const response = await fetch(url, requestOptions);
    switch (response.status) {
      case 200:
      case 201:
        return response.json();
      case 401:
        throw new UnauthorizedError();
      default:
        throw new Error(`Unexpected error with status code ${response.status}`);
    }
  }

  getLabels() {
    return this._fetch(`/repos/${this.user}/${this.repository}/labels`);
  }

  async getUser(username) {
    try {
      const user = await this._fetch(`/users/${username}`);
      return user;
    } catch (err) {
      console.error(`Github user ${username} does not exist`);
      return undefined;
    }
  }

  getRepository(username, repositoryName) {
    try {
      const repository = this._fetch(`/repos/${username}/${repositoryName}`);
      return repository;
    } catch (err) {
      console.error(`Github repository ${repositoryname} for user ${username} does not exist`);
      return undefined;
    }
  }

  async searchIssues(searchString, page, perPage) {
    const queryString = this._buildQueryString(searchString, page, perPage);
    const issues = await this._fetch(`/search/issues`, queryString);

    return issues;
  }
}
