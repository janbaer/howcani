export default class QuestionService {
  constructor(githubService, searchQueryBuilderService) {
    this.github = githubService;
    this.searchQueryBuilder = searchQueryBuilderService;
  }

  async fetchQuestions(searchQuery, page = 1, perPage = 50) {
    const searchString = this.searchQueryBuilder.buildQueryString(searchQuery);
    const response = await this.github.searchIssues(searchString, page, perPage);

    return {
      questions: response.items.map(this._mapIssueToQuestion.bind(this)),
      totalCount: response.total_count,
    };
  }

  filterItemsByLockedState(items) {
    return items.filter((item) => item.locked === false);
  }

  fetchQuestion(id) {
    return this.github.getIssue(id);
  }

  async createQuestion(question) {
    let issue = this._mapIssueFromQuestion(question);
    delete issue.state;

    issue = await this.github.postIssue(issue);
    if (question.isAnswered) {
      issue = await this.github.patchIssue(issue.id, { state: 'answered' });
    }

    return this._mapIssueToQuestion(issue);
  }

  async updateQuestion(question) {
    const issue = await this.github.patchIssue(
      question.number,
      this._mapIssueFromQuestion(question)
    );
    return this._mapIssueToQuestion(issue);
  }

  _mapIssueFromQuestion(question) {
    return {
      title: question.title,
      body: question.body,
      labels: question.labels.map((label) => label.name),
      state: question.isAnswered ? 'closed' : 'open',
    };
  }

  _mapIssueToQuestion(issue) {
    return {
      id: issue.id,
      number: issue.number,
      title: issue.title,
      body: issue.body,
      isAnswered: issue.state === 'closed',
      user: this._mapUser(issue.user || issue.owner),
      created: issue.created_at,
      modified: issue.modified_at,
      closed: issue.closed_at,
      labels: issue.labels.map(this._mapLabel),
    };
  }

  _mapLabel(label) {
    return {
      name: label.name,
      color: label.color,
    };
  }

  _mapUser(user) {
    return {
      login: user.login,
      avatarUrl: user.avatar_url,
    };
  }
}
