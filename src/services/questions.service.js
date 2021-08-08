export default class QuestionService {
  constructor(githubService, searchQueryBuilderService) {
    this.github = githubService;
    this.searchQueryBuilder = searchQueryBuilderService;
  }

  async fetchQuestions(searchQuery, page = 1, perPage = 50) {
    const searchString = this.searchQueryBuilder.buildQueryString(searchQuery);
    const response = await this.github.searchIssues(searchString, page, perPage);

    return {
      questions: response.items.map(this._mapItem.bind(this)),
      totalCount: response.total_count,
    };
  }

  filterItemsByLockedState(items) {
    return items.filter((item) => item.locked === false);
  }

  fetchQuestion(id) {
    return this.github.getIssue(id);
  }

  postQuestion(question) {
    // const isAnswered = question.isAnswered;
    // return this.github
    // .postIssue(question)
    // .then((newQuestion) => {
    // return this.changeQuestionToAnsweredWhenIsAnswered(newQuestion, isAnswered);
    // })
    // .then((newQuestion) => {
    // const items = [newQuestion].concat(this.questions.value);
    // this.questions.next(items);
    // this.onQuestionCreated.emit(newQuestion);
    // });
  }

  changeQuestionToAnsweredWhenIsAnswered(question, isAnswered) {
    // if (isAnswered) {
    // return this.markQuestionAsAnswered(question);
    // }
    // return Promise.resolve(question);
  }

  markQuestionAsAnswered(question) {
    // question.state = 'closed';
    // return this.updateQuestion(question);
  }

  markQuestionAsUnanswered(question) {
    // question.state = 'open';
    // return this.updateQuestion(question);
  }

  updateQuestion(question) {
    // return this.github
    // .patchIssue(question.number, this.createIssueFromQuestion(question))
    // .then((updatedQuestion) => {
    // const items = this.questions.value;
    // const index = items.findIndex((item) => item.number === updatedQuestion.number);
    // items[index] = updatedQuestion;
    // this.questions.next(items);
    // this.onQuestionUpdated.emit(updatedQuestion);
    // return updatedQuestion;
    // });
  }

  createIssueFromQuestion(question) {
    return {
      title: question.title,
      body: question.body,
      state: question.state,
      labels: question.labels.map((label) => label.name),
    };
  }

  _mapItem(item) {
    return {
      id: item.id,
      title: item.title,
      body: item.body,
      user: this._mapUser(item.user),
      created: item.created_at,
      modified: item.modified_at,
      closed: item.closed_at,
      labels: item.labels.map(this._mapLabel),
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
