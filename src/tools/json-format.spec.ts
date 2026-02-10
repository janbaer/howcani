import { describe, expect, test } from "bun:test";
import { EXPORT_FORMAT_VERSION, type ExportData, type Issue, validateExportData, validateIssue } from "./json-format";

describe("json-format", () => {
  describe("validateExportData", () => {
    test("accepts valid JSON structure", () => {
      const validData: ExportData = {
        version: "1.0",
        exported_at: "2026-02-10T19:30:00Z",
        repository: "janbaer/howcani-data",
        total_issues: 2,
        issues: [
          {
            number: 1,
            title: "How do I deploy with Bun?",
            body: "Step-by-step guide...",
            labels: [
              { name: "bun", color: "0e8a16" },
              { name: "deployment", color: "ff5722" },
            ],
            created_at: "2024-01-15T10:30:00Z",
            state: "open",
          },
          {
            number: 2,
            title: "How do I use Svelte 5?",
            body: null,
            labels: [],
            created_at: "2024-01-16T11:00:00Z",
            state: "closed",
          },
        ],
      };

      const result = validateExportData(validData);

      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.data).toEqual(validData);
      }
    });

    test("rejects data with missing version field", () => {
      const invalidData = {
        exported_at: "2026-02-10T19:30:00Z",
        repository: "janbaer/howcani-data",
        total_issues: 0,
        issues: [],
      };

      const result = validateExportData(invalidData);

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors).toContainEqual({
          field: "version",
          message: "Missing or invalid version field",
        });
      }
    });

    test("rejects data with unsupported version", () => {
      const invalidData = {
        version: "2.0",
        exported_at: "2026-02-10T19:30:00Z",
        repository: "janbaer/howcani-data",
        total_issues: 0,
        issues: [],
      };

      const result = validateExportData(invalidData);

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors).toContainEqual({
          field: "version",
          message: `Unsupported version: expected ${EXPORT_FORMAT_VERSION}, got 2.0`,
        });
      }
    });

    test("rejects data with missing exported_at field", () => {
      const invalidData = {
        version: "1.0",
        repository: "janbaer/howcani-data",
        total_issues: 0,
        issues: [],
      };

      const result = validateExportData(invalidData);

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors).toContainEqual({
          field: "exported_at",
          message: "Missing or invalid exported_at field",
        });
      }
    });

    test("rejects data with missing repository field", () => {
      const invalidData = {
        version: "1.0",
        exported_at: "2026-02-10T19:30:00Z",
        total_issues: 0,
        issues: [],
      };

      const result = validateExportData(invalidData);

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors).toContainEqual({
          field: "repository",
          message: "Missing or invalid repository field",
        });
      }
    });

    test("rejects data with invalid issues array", () => {
      const invalidData = {
        version: "1.0",
        exported_at: "2026-02-10T19:30:00Z",
        repository: "janbaer/howcani-data",
        total_issues: 0,
        issues: "not an array",
      };

      const result = validateExportData(invalidData);

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors).toContainEqual({
          field: "issues",
          message: "Missing or invalid issues array",
        });
      }
    });

    test("rejects non-object data", () => {
      const result = validateExportData("not an object");

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors).toContainEqual({
          field: "root",
          message: "Data must be an object",
        });
      }
    });

    test("rejects null data", () => {
      const result = validateExportData(null);

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors).toContainEqual({
          field: "root",
          message: "Data must be an object",
        });
      }
    });

    test("accumulates multiple errors", () => {
      const invalidData = {
        // Missing version
        // Missing exported_at
        repository: "janbaer/howcani-data",
        total_issues: 0,
        issues: "not an array",
      };

      const result = validateExportData(invalidData);

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors.length).toBeGreaterThan(1);
      }
    });
  });

  describe("validateIssue", () => {
    test("accepts valid issue object", () => {
      const validIssue: Issue = {
        number: 42,
        title: "Test issue",
        body: "Test body",
        labels: [{ name: "test", color: "ff0000" }],
        created_at: "2024-01-15T10:30:00Z",
        state: "open",
      };

      const errors = validateIssue(validIssue, 0);

      expect(errors).toHaveLength(0);
    });

    test("accepts issue with null body", () => {
      const validIssue: Issue = {
        number: 42,
        title: "Test issue",
        body: null,
        labels: [],
        created_at: "2024-01-15T10:30:00Z",
        state: "closed",
      };

      const errors = validateIssue(validIssue, 0);

      expect(errors).toHaveLength(0);
    });

    test("rejects issue with missing number", () => {
      const invalidIssue = {
        title: "Test issue",
        body: "Test body",
        labels: [],
        created_at: "2024-01-15T10:30:00Z",
        state: "open",
      };

      const errors = validateIssue(invalidIssue, 0);

      expect(errors).toContainEqual({
        field: "issues[0].number",
        message: "Missing or invalid number field",
      });
    });

    test("rejects issue with missing title", () => {
      const invalidIssue = {
        number: 42,
        body: "Test body",
        labels: [],
        created_at: "2024-01-15T10:30:00Z",
        state: "open",
      };

      const errors = validateIssue(invalidIssue, 0);

      expect(errors).toContainEqual({
        field: "issues[0].title",
        message: "Missing or invalid title field",
      });
    });

    test("rejects issue with invalid body type", () => {
      const invalidIssue = {
        number: 42,
        title: "Test issue",
        body: 123, // Should be string or null
        labels: [],
        created_at: "2024-01-15T10:30:00Z",
        state: "open",
      };

      const errors = validateIssue(invalidIssue, 0);

      expect(errors).toContainEqual({
        field: "issues[0].body",
        message: "Invalid body field (must be string or null)",
      });
    });

    test("rejects issue with missing labels array", () => {
      const invalidIssue = {
        number: 42,
        title: "Test issue",
        body: "Test body",
        created_at: "2024-01-15T10:30:00Z",
        state: "open",
      };

      const errors = validateIssue(invalidIssue, 0);

      expect(errors).toContainEqual({
        field: "issues[0].labels",
        message: "Missing or invalid labels array",
      });
    });

    test("rejects issue with malformed label", () => {
      const invalidIssue = {
        number: 42,
        title: "Test issue",
        body: "Test body",
        labels: [{ name: "test" }], // Missing color
        created_at: "2024-01-15T10:30:00Z",
        state: "open",
      };

      const errors = validateIssue(invalidIssue, 0);

      expect(errors).toContainEqual({
        field: "issues[0].labels[0].color",
        message: "Label color must be a string",
      });
    });

    test("rejects issue with non-object label", () => {
      const invalidIssue = {
        number: 42,
        title: "Test issue",
        body: "Test body",
        labels: ["not an object"],
        created_at: "2024-01-15T10:30:00Z",
        state: "open",
      };

      const errors = validateIssue(invalidIssue, 0);

      expect(errors).toContainEqual({
        field: "issues[0].labels[0]",
        message: "Label must be an object",
      });
    });

    test("rejects issue with invalid state", () => {
      const invalidIssue = {
        number: 42,
        title: "Test issue",
        body: "Test body",
        labels: [],
        created_at: "2024-01-15T10:30:00Z",
        state: "pending", // Not "open" or "closed"
      };

      const errors = validateIssue(invalidIssue, 0);

      expect(errors).toContainEqual({
        field: "issues[0].state",
        message: 'Invalid state field (must be "open" or "closed")',
      });
    });

    test("rejects non-object issue", () => {
      const errors = validateIssue("not an object", 0);

      expect(errors).toContainEqual({
        field: "issues[0]",
        message: "Issue must be an object",
      });
    });

    test("includes correct index in error messages", () => {
      const invalidIssue = {
        title: "Test issue",
        body: "Test body",
        labels: [],
        created_at: "2024-01-15T10:30:00Z",
        state: "open",
      };

      const errors = validateIssue(invalidIssue, 5);

      expect(errors).toContainEqual({
        field: "issues[5].number",
        message: "Missing or invalid number field",
      });
    });
  });

  describe("EXPORT_FORMAT_VERSION", () => {
    test("is set to 1.0", () => {
      expect(EXPORT_FORMAT_VERSION).toBe("1.0");
    });
  });
});
