import { describe, expect, test } from "bun:test";
import {
  type Issue,
  mapBodyToAnswer,
  mapIssueToItem,
  mapLabelsToTags,
  mapTitleToQuestion,
  validateAndNormalizeColor,
} from "./issue-mapper";

describe("issue-mapper", () => {
  describe("mapIssueToItem", () => {
    test("maps complete issue to item", () => {
      const issue: Issue = {
        number: 42,
        title: "How do I deploy with Bun?",
        body: "Step-by-step guide:\n\n1. Install Bun\n2. Run bun run",
        labels: [
          { name: "bun", color: "0e8a16" },
          { name: "deployment", color: "ff5722" },
        ],
        created_at: "2024-01-15T10:30:00Z",
        state: "open",
      };

      const item = mapIssueToItem(issue);

      expect(item).toEqual({
        id: 42,
        question: "How do I deploy with Bun?",
        answer: "Step-by-step guide:\n\n1. Install Bun\n2. Run bun run",
        tags: [
          { name: "bun", color: "0e8a16" },
          { name: "deployment", color: "ff5722" },
        ],
        created_at: "2024-01-15T10:30:00Z",
      });
    });

    test("maps issue with null body", () => {
      const issue: Issue = {
        number: 1,
        title: "Test",
        body: null,
        labels: [],
        created_at: "2024-01-15T10:30:00Z",
        state: "open",
      };

      const item = mapIssueToItem(issue);

      expect(item.answer).toBe("");
    });

    test("maps issue without labels", () => {
      const issue: Issue = {
        number: 1,
        title: "Test",
        body: "Body",
        labels: [],
        created_at: "2024-01-15T10:30:00Z",
        state: "open",
      };

      const item = mapIssueToItem(issue);

      expect(item.tags).toEqual([]);
    });

    test("preserves issue number as item ID", () => {
      const issue: Issue = {
        number: 123,
        title: "Test",
        body: "Body",
        labels: [],
        created_at: "2024-01-15T10:30:00Z",
        state: "open",
      };

      const item = mapIssueToItem(issue);

      expect(item.id).toBe(123);
    });

    test("throws error for invalid timestamp format", () => {
      const issue: Issue = {
        number: 42,
        title: "Test",
        body: "Body",
        labels: [],
        created_at: "not-a-date",
        state: "open",
      };

      expect(() => mapIssueToItem(issue)).toThrow(
        'Invalid created_at timestamp format for issue #42: "not-a-date". Expected format: YYYY-MM-DDTHH:MM:SSZ',
      );
    });

    test("throws error for missing created_at field", () => {
      const issue: Issue = {
        number: 42,
        title: "Test",
        body: "Body",
        labels: [],
        created_at: "",
        state: "open",
      };

      expect(() => mapIssueToItem(issue)).toThrow(
        "Invalid created_at timestamp for issue #42: timestamp is empty or missing",
      );
    });
  });

  describe("mapTitleToQuestion", () => {
    test("trims whitespace from title", () => {
      const question = mapTitleToQuestion("  How do I use Bun?  ");

      expect(question).toBe("How do I use Bun?");
    });

    test("preserves original capitalization", () => {
      const question = mapTitleToQuestion("How Do I Use BUN?");

      expect(question).toBe("How Do I Use BUN?");
    });

    test("handles special characters", () => {
      const question = mapTitleToQuestion("How do I use @tags & #hashtags?");

      expect(question).toBe("How do I use @tags & #hashtags?");
    });

    test("handles unicode characters", () => {
      const question = mapTitleToQuestion("Wie verwende ich Bun? 🚀");

      expect(question).toBe("Wie verwende ich Bun? 🚀");
    });

    test("handles empty string", () => {
      const question = mapTitleToQuestion("");

      expect(question).toBe("");
    });

    test("handles string with only whitespace", () => {
      const question = mapTitleToQuestion("   ");

      expect(question).toBe("");
    });
  });

  describe("mapBodyToAnswer", () => {
    test("preserves markdown formatting", () => {
      const body = "# Title\n\n## Subtitle\n\n- Item 1\n- Item 2\n\n**Bold** and *italic*";

      const answer = mapBodyToAnswer(body);

      expect(answer).toBe(body);
    });

    test("handles null body", () => {
      const answer = mapBodyToAnswer(null);

      expect(answer).toBe("");
    });

    test("handles empty string body", () => {
      const answer = mapBodyToAnswer("");

      expect(answer).toBe("");
    });

    test("preserves newlines and whitespace", () => {
      const body = "Line 1\n\n\nLine 2\n  Indented";

      const answer = mapBodyToAnswer(body);

      expect(answer).toBe(body);
    });

    test("handles code blocks", () => {
      const body = "```typescript\nconst x = 42;\n```";

      const answer = mapBodyToAnswer(body);

      expect(answer).toBe(body);
    });
  });

  describe("mapLabelsToTags", () => {
    test("maps labels with valid colors", () => {
      const labels = [
        { name: "bug", color: "d73a4a" },
        { name: "enhancement", color: "a2eeef" },
      ];

      const tags = mapLabelsToTags(labels);

      expect(tags).toEqual([
        { name: "bug", color: "d73a4a" },
        { name: "enhancement", color: "a2eeef" },
      ]);
    });

    test("handles empty labels array", () => {
      const tags = mapLabelsToTags([]);

      expect(tags).toEqual([]);
    });

    test("validates and normalizes label colors", () => {
      const labels = [
        { name: "valid", color: "FF5722" }, // Uppercase
        { name: "with-hash", color: "#0e8a16" }, // With # prefix
        { name: "invalid", color: "xyz" }, // Invalid format
      ];

      const tags = mapLabelsToTags(labels);

      expect(tags).toEqual([
        { name: "valid", color: "ff5722" }, // Normalized to lowercase
        { name: "with-hash", color: "0e8a16" }, // # removed
        { name: "invalid", color: "6b7280" }, // Default color
      ]);
    });
  });

  describe("validateAndNormalizeColor", () => {
    test("accepts valid 6-digit hex color", () => {
      const color = validateAndNormalizeColor("ff5722");

      expect(color).toBe("ff5722");
    });

    test("removes # prefix from color", () => {
      const color = validateAndNormalizeColor("#ff5722");

      expect(color).toBe("ff5722");
    });

    test("normalizes uppercase to lowercase", () => {
      const color = validateAndNormalizeColor("FF5722");

      expect(color).toBe("ff5722");
    });

    test("returns default color for invalid format", () => {
      expect(validateAndNormalizeColor("xyz")).toBe("6b7280");
      expect(validateAndNormalizeColor("12345")).toBe("6b7280"); // Too short
      expect(validateAndNormalizeColor("1234567")).toBe("6b7280"); // Too long
      expect(validateAndNormalizeColor("gggggg")).toBe("6b7280"); // Invalid characters
      expect(validateAndNormalizeColor("")).toBe("6b7280"); // Empty
    });

    test("handles uppercase hex letters", () => {
      const color = validateAndNormalizeColor("ABCDEF");

      expect(color).toBe("abcdef");
    });

    test("handles mixed case hex letters", () => {
      const color = validateAndNormalizeColor("AbCdEf");

      expect(color).toBe("abcdef");
    });

    test("handles color with # prefix and uppercase", () => {
      const color = validateAndNormalizeColor("#ABCDEF");

      expect(color).toBe("abcdef");
    });
  });
});
