import type { ValidationResult } from "./common";

export type { ValidationResult };

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface TagWithCount extends Tag {
  item_count: number;
}

export interface CreateTagData {
  name: string;
  color?: string;
}

const COLOR_REGEX = /^[0-9a-fA-F]{6}$/;

const DEFAULT_COLORS = [
  "0e8a16",
  "ff5722",
  "2196f3",
  "9c27b0",
  "f44336",
  "009688",
  "ff9800",
  "607d8b",
];

export function randomColor(): string {
  return DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)];
}

export function validateTagName(name: string | null | undefined): ValidationResult {
  const errors: string[] = [];

  if (!name || name.trim() === "") {
    errors.push("Tag name is required");
  }

  return { valid: errors.length === 0, errors };
}

export function validateTagColor(color: string | null | undefined): ValidationResult {
  const errors: string[] = [];

  if (color !== null && color !== undefined && !COLOR_REGEX.test(color)) {
    errors.push("Color must be a valid 6-character hex value");
  }

  return { valid: errors.length === 0, errors };
}

export function validateCreateTagData(data: Partial<CreateTagData>): ValidationResult {
  const nameResult = validateTagName(data.name);
  const colorResult = validateTagColor(data.color);
  const errors = [...nameResult.errors, ...colorResult.errors];

  return { valid: errors.length === 0, errors };
}
