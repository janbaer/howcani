import { writable, get } from 'svelte/store';

import QuestionsService from './../services/questions.service';
import GithubService from './../services/github.service';
import SearchQueryBuilderService from './../services/search-query-builder.service';

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
  const questionService = new QuestionsService(githubService, searchQueryBuilderService);

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
