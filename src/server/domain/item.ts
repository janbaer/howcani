import type { ValidationResult } from "./common";

export type { ValidationResult };

export interface Item {
  id: string;
  user_id: string;
  question: string;
  answer: string;
  created_at: string;
  updated_at: string;
}

export interface CreateItemData {
  question: string;
  answer?: string;
}

export interface UpdateItemData {
  question?: string;
  answer?: string;
}

export const MAX_QUESTION_LENGTH = 500;
export const MAX_ANSWER_LENGTH = 50_000;

export function validateQuestion(question: string | null | undefined): ValidationResult {
  const errors: string[] = [];

  if (!question || question.trim() === "") {
    errors.push("Question is required");
  } else if (question.length > MAX_QUESTION_LENGTH) {
    errors.push(`Question must be at most ${MAX_QUESTION_LENGTH} characters`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function validateAnswer(answer: string | undefined): ValidationResult {
  const errors: string[] = [];

  if (answer !== undefined && answer.length > MAX_ANSWER_LENGTH) {
    errors.push(`Answer must be at most ${MAX_ANSWER_LENGTH} characters`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateCreateItemData(data: Partial<CreateItemData>): ValidationResult {
  const questionResult = validateQuestion(data.question);
  const answerResult = validateAnswer(data.answer);
  const errors = [...questionResult.errors, ...answerResult.errors];

  return { valid: errors.length === 0, errors };
}

export function validateUpdateItemData(data: Partial<UpdateItemData>): ValidationResult {
  const errors: string[] = [];

  if (data.question !== undefined) {
    const questionResult = validateQuestion(data.question);
    errors.push(...questionResult.errors);
  }

  const answerResult = validateAnswer(data.answer);
  errors.push(...answerResult.errors);

  return { valid: errors.length === 0, errors };
}
