import labelsStore from '/@/stores/labels-store.svelte';

import QuestionService from './../services/question.service';
import GithubService from './../services/github.service';
import SearchQueryBuilderService from './../services/search-query-builder.service';
import { replaceItemById } from './../helpers/array.helpers';

const QUESTIONS_PER_PAGE = 15;

class QuestionsStore {
  #questions = $state([]);
  #loading = $state(false);
  #hasMoreData = $state(false);
  #searchQuery = $state({ query: '', state: '', labels: [] });
  #page = $state(1);

  get questions() {
    return this.#questions;
  }

  get loading() {
    return this.#loading;
  }

  get hasMoreData() {
    return this.#hasMoreData;
  }

  get page() {
    return this.#page;
  }

  get searchQuery() {
    return this.#searchQuery;
  }

  async load(config, searchQuery, page) {
    if (this.#loading) {
      return;
    }

    if (page === 1) {
      this.#hasMoreData = true;
    }

    this.#loading = true;

    const { user, repository, oauthToken } = config;
    const githubService = new GithubService(user, repository, oauthToken);
    const searchQueryBuilderService = new SearchQueryBuilderService(
      user,
      repository
    );
    const questionService = new QuestionService(
      githubService,
      searchQueryBuilderService
    );

    const questionsResponse = await questionService.fetchQuestions(
      searchQuery,
      page,
      QUESTIONS_PER_PAGE
    );

    this.#page = page;
    this.#hasMoreData = questionsResponse.questions.length > 0;

    this.#questions.push(...questionsResponse.questions);

    this.#loading = false;
  }

  async create(config, question) {
    const { user, repository, oauthToken } = config;
    const githubService = new GithubService(user, repository, oauthToken);
    const questionService = new QuestionService(githubService);

    const newQuestion = await questionService.createQuestion(question);
    this.#questions.unshift(newQuestion);

    labelsStore.load(config);
  }

  async update(config, question) {
    const { user, repository, oauthToken } = config;
    const githubService = new GithubService(user, repository, oauthToken);
    const questionService = new QuestionService(githubService);

    const updatedQuestion = await questionService.updateQuestion(question);
    replaceItemById(this.#questions, question.id, updatedQuestion),

    labelsStore.load(config);
  }
}

export default new QuestionsStore();
