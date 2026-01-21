import { describe, test, expect } from "bun:test";
import {
  type Item,
  validateQuestion,
  validateCreateItemData,
  type CreateItemData,
} from "./item";

describe("Item Domain", () => {
  describe("Item interface", () => {
    test("item has required fields", () => {
      const item: Item = {
        id: "123",
        user_id: "456",
        question: "How do I configure X?",
        answer: "Follow these steps...",
        created_at: "2024-01-15T10:00:00Z",
        updated_at: "2024-01-15T10:00:00Z",
      };

      expect(item.id).toBe("123");
      expect(item.user_id).toBe("456");
      expect(item.question).toBe("How do I configure X?");
      expect(item.answer).toBe("Follow these steps...");
      expect(item.created_at).toBe("2024-01-15T10:00:00Z");
      expect(item.updated_at).toBe("2024-01-15T10:00:00Z");
    });
  });

  describe("validateQuestion", () => {
    test("accepts non-empty question", () => {
      const result = validateQuestion("How do I configure X?");

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test("rejects empty question", () => {
      const result = validateQuestion("");

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Question is required");
    });

    test("rejects null question", () => {
      const result = validateQuestion(null);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Question is required");
    });

    test("rejects undefined question", () => {
      const result = validateQuestion(undefined);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Question is required");
    });

    test("rejects whitespace-only question", () => {
      const result = validateQuestion("   ");

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Question is required");
    });
  });

  describe("validateCreateItemData", () => {
    test("accepts valid data with question and answer", () => {
      const data: Partial<CreateItemData> = {
        question: "How do I deploy with Bun?",
        answer: "Use `bun build` and run the output.",
      };

      const result = validateCreateItemData(data);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test("accepts valid data with empty answer", () => {
      const data: Partial<CreateItemData> = {
        question: "How do I configure X?",
        answer: "",
      };

      const result = validateCreateItemData(data);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test("accepts valid data without answer field", () => {
      const data: Partial<CreateItemData> = {
        question: "How do I configure X?",
      };

      const result = validateCreateItemData(data);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test("rejects missing question", () => {
      const data: Partial<CreateItemData> = {
        answer: "Some answer",
      };

      const result = validateCreateItemData(data);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Question is required");
    });

    test("preserves markdown in answer", () => {
      const markdownAnswer = `## Steps
1. First step
2. Second step

\`code example\``;

      const data: Partial<CreateItemData> = {
        question: "How do I do something?",
        answer: markdownAnswer,
      };

      const result = validateCreateItemData(data);

      expect(result.valid).toBe(true);
      expect(data.answer).toBe(markdownAnswer);
    });
  });
});
