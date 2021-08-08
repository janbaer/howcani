export default class SearchQueryBuilderService {
  constructor(user, repository) {
    this.user = user;
    this.repository = repository;
  }

  /*
   * Generate search query for github api usage
   *
   * @param String  q       The search term https://help.github.com/articles/searching-issues/
   * @param Array   labels  Limits searches to a specific user or repository. Could be user/repository.
   * @param Array   labels  Enrich query string with labels when specified
   * @param String  state   The state of the issue (open or closed)
   * @param Boolean onlyMyQuestions - Filter the issues by the name of the
   * current logged in user
   * @return String
   */
  buildQueryString(searchQuery = {}) {
    const query = [];

    if (searchQuery.query) {
      query.push(searchQuery.query.replace(/\s/g, '+'));
    }

    if (searchQuery.labels && searchQuery.labels.length > 0) {
      query.push(searchQuery.labels.map((label) => `label:${label}`).join('+'));
    }

    if (searchQuery.state) {
      query.push(`state:${searchQuery.state}`);
    }

    if (searchQuery.onlyMyQuestions && this.user) {
      query.push(`author:${this.user}`);
    }

    query.push(`repo:${this.user}/${this.repository}`);
    query.push('type:issue');

    return query.join('+');
  }
}
