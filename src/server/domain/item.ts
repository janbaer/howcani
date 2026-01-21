export interface Item {
  id: string;
  user_id: string;
  question: string;
  answer: string;
  created_at: string;
  updated_at: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface CreateItemData {
  question: string;
  answer?: string;
}

export interface UpdateItemData {
  question?: string;
  answer?: string;
}

export function validateQuestion(question: string | null | undefined): ValidationResult {
  const errors: string[] = [];

  if (!question || question.trim() === "") {
    errors.push("Question is required");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateCreateItemData(data: Partial<CreateItemData>): ValidationResult {
  return validateQuestion(data.question);
}
