import UnauthorizedError from './unauthorized-error';
import { StatusCodes } from 'http-status-codes';

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

  async _fetch(path, requestOptions) {
    let url = `${GITHUB_ROOT_URL}${path}`;
    const response = await fetch(url, requestOptions);
    switch (response.status) {
      case StatusCodes.OK:
      case StatusCodes.CREATED:
        return response.json();
      case StatusCodes.UNAUTHORIZED:
        throw new UnauthorizedError();
      default:
        throw new Error(`Unexpected error with status code ${response.status}`);
    }
  }

  _get(path) {
    const requestOptions = this._buildRequestOptions(this.oauthToken, 'GET');
    return this._fetch(path, requestOptions);
  }

  _patch(path, body) {
    const requestOptions = this._buildRequestOptions(this.oauthToken, 'PATCH');
    requestOptions.body = JSON.stringify(body);
    return this._fetch(path, requestOptions);
  }

  _post(path, body) {
    const requestOptions = this._buildRequestOptions(this.oauthToken, 'POST');
    requestOptions.body = JSON.stringify(body);
    return this._fetch(path, requestOptions);
  }

  getLabels() {
    return this._get(`/repos/${this.user}/${this.repository}/labels`);
  }

  async getUser(username) {
    try {
      const user = await this._get(`/users/${username}`);
      return user;
    } catch (err) {
      console.error(`Github user ${username} does not exist`);
      return undefined;
    }
  }

  async getAuthenticatedUser(oauthToken) {
    this.oauthToken = oauthToken;
    const user = await this._get('/user');
    if (user) {
      const { avatar_url, email, login, name } = user; // eslint-disable-line camelcase
      return {
        avatarUrl: avatar_url,
        email,
        loginName: login,
        userName: name,
      };
    }
    return undefined;
  }

  getUserRepositories(oauthToken) {
    this.oauthToken = oauthToken;
    return this._get('/user/repos?per_page=100');
  }

  async getRepository(username, repositoryName) {
    try {
      const repository = await this._get(`/repos/${username}/${repositoryName}`);
      return repository;
    } catch (err) {
      console.error(`Github repository ${repositoryname} for user ${username} does not exist`);
      return undefined;
    }
  }

  async searchIssues(searchString, page, perPage) {
    const queryString = this._buildQueryString(searchString, page, perPage);
    const issues = await this._get(`/search/issues?${queryString}`);
    return issues;
  }

  postIssue(issue) {
    return this._post(`/repos/${this.user}/${this.repository}/issues`, issue);
  }

  patchIssue(issueNumber, patch) {
    return this._patch(`/repos/${this.user}/${this.repository}/issues/${issueNumber}`, patch);
  }
}
