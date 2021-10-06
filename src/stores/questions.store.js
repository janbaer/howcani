import { writable } from 'svelte/store';

import QuestionsService from './../services/questions.service';
import GithubService from './../services/github.service';
import SearchQueryBuilderService from './../services/search-query-builder.service';

let questions = [];
let hasMoreData = true;
let loading = false;

const QUESTIONS_PER_PAGE = 10;

export const questionsStore = writable({
  questions,
  page: 1,
  hasMoreData,
  loading,
});

export async function loadQuestions(config, searchQuery, page) {
  const { user, repository, oauthToken } = config;

  if (loading || !hasMoreData) {
    return;
  }

  loading = true;
  questionsStore.update((current) => {
    return { ...current, loading };
  });

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

  // console.log('loading-done', page, totalCount, questionsResponse.questions.length, hasMoreData);
  questionsStore.set({ questions, page, hasMoreData });
}
