import { writable, get } from 'svelte/store';

import { loadLabels } from '/@/stores/labels.store';

import QuestionService from './../services/question.service';
import GithubService from './../services/github.service';
import SearchQueryBuilderService from './../services/search-query-builder.service';

import { replaceQuestion } from '/@/helpers/questions.helpers.js';

const QUESTIONS_PER_PAGE = 10;

export const questionsStore = writable({
  questions: [],
  page: 1,
  hasMoreData: true,
  loading: false,
  searchQuery: {
    query: '',
    state: '',
    labels: [],
  },
});

export async function loadQuestions(config, searchQuery, page) {
  let { questions, loading, hasMoreData } = get(questionsStore);

  if (loading) {
    return;
  }

  if (page === 1) {
    questions = [];
    hasMoreData = true;
  }

  loading = true;

  questionsStore.update((current) => {
    return { ...current, searchQuery, loading };
  });

  if (!hasMoreData) {
    return;
  }

  const { user, repository, oauthToken } = config;
  const githubService = new GithubService(user, repository, oauthToken);
  const searchQueryBuilderService = new SearchQueryBuilderService(user, repository);
  const questionService = new QuestionService(githubService, searchQueryBuilderService);

  const questionsResponse = await questionService.fetchQuestions(
    searchQuery,
    page,
    QUESTIONS_PER_PAGE
  );

  loading = false;
  hasMoreData = questionsResponse.questions.length > 0;
  questions = [...questions, ...questionsResponse.questions];

  questionsStore.set({ questions, searchQuery, page, hasMoreData, loading });
}

export async function createQuestion(config, question) {
  const { user, repository, oauthToken } = config;
  const githubService = new GithubService(user, repository, oauthToken);
  const questionService = new QuestionService(githubService);

  const newQuestion = await questionService.createQuestion(question);

  questionsStore.update((current) => {
    const questions = [newQuestion, ...current.questions];
    return { ...current, questions };
  });

  loadLabels(config);
}

export async function updateQuestion(config, question) {
  const { user, repository, oauthToken } = config;
  const githubService = new GithubService(user, repository, oauthToken);
  const questionService = new QuestionService(githubService);

  let { questions } = get(questionsStore);

  const updatedQuestion = await questionService.updateQuestion(question);

  questions = replaceQuestion(questions, question, updatedQuestion);

  questionsStore.update((current) => {
    return { ...current, questions };
  });

  loadLabels(config);
}
