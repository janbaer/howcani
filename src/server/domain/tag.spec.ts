import { describe, test, expect } from "bun:test";
import {
  type Tag,
  validateTagName,
  validateTagColor,
  validateCreateTagData,
  randomColor,
  type CreateTagData,
} from "./tag";

describe("Tag Domain", () => {
  describe("Tag interface", () => {
    test("tag has required fields", () => {
      const tag: Tag = {
        id: "123",
        user_id: "456",
        name: "networking",
        color: "0e8a16",
        created_at: "2024-01-15T10:00:00Z",
      };

      expect(tag.id).toBe("123");
      expect(tag.user_id).toBe("456");
      expect(tag.name).toBe("networking");
      expect(tag.color).toBe("0e8a16");
      expect(tag.created_at).toBe("2024-01-15T10:00:00Z");
    });
  });

  describe("validateTagName", () => {
    test("accepts non-empty name", () => {
      const result = validateTagName("networking");
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test("rejects empty name", () => {
      const result = validateTagName("");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Tag name is required");
    });

    test("rejects null name", () => {
      const result = validateTagName(null);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Tag name is required");
    });

    test("rejects undefined name", () => {
      const result = validateTagName(undefined);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Tag name is required");
    });

    test("rejects whitespace-only name", () => {
      const result = validateTagName("   ");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Tag name is required");
    });
  });

  describe("validateTagColor", () => {
    test("accepts valid 6-char hex color", () => {
      expect(validateTagColor("0e8a16").valid).toBe(true);
      expect(validateTagColor("ff5722").valid).toBe(true);
      expect(validateTagColor("000000").valid).toBe(true);
      expect(validateTagColor("FFFFFF").valid).toBe(true);
    });

    test("accepts mixed case hex", () => {
      expect(validateTagColor("aAbBcC").valid).toBe(true);
    });

    test("accepts null (optional color)", () => {
      expect(validateTagColor(null).valid).toBe(true);
    });

    test("accepts undefined (optional color)", () => {
      expect(validateTagColor(undefined).valid).toBe(true);
    });

    test("rejects color with hash prefix", () => {
      const result = validateTagColor("#0e8a16");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Color must be a valid 6-character hex value");
    });

    test("rejects too-short color", () => {
      const result = validateTagColor("0e8");
      expect(result.valid).toBe(false);
    });

    test("rejects invalid hex characters", () => {
      const result = validateTagColor("xyz123");
      expect(result.valid).toBe(false);
    });

    test("rejects too-long color", () => {
      const result = validateTagColor("0e8a16ff");
      expect(result.valid).toBe(false);
    });
  });

  describe("validateCreateTagData", () => {
    test("accepts valid name and color", () => {
      const data: Partial<CreateTagData> = { name: "bun", color: "0e8a16" };
      const result = validateCreateTagData(data);
      expect(result.valid).toBe(true);
    });

    test("accepts name without color", () => {
      const data: Partial<CreateTagData> = { name: "bun" };
      const result = validateCreateTagData(data);
      expect(result.valid).toBe(true);
    });

    test("rejects missing name", () => {
      const data: Partial<CreateTagData> = { color: "0e8a16" };
      const result = validateCreateTagData(data);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Tag name is required");
    });

    test("rejects invalid color with valid name", () => {
      const data: Partial<CreateTagData> = { name: "bun", color: "nope" };
      const result = validateCreateTagData(data);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Color must be a valid 6-character hex value");
    });
  });

  describe("randomColor", () => {
    test("returns a valid 6-char hex string", () => {
      const color = randomColor();
      expect(color).toMatch(/^[0-9a-f]{6}$/);
    });

    test("returns a color from the palette", () => {
      const palette = [
        "0e8a16", "ff5722", "2196f3", "9c27b0",
        "f44336", "009688", "ff9800", "607d8b",
      ];
      const color = randomColor();
      expect(palette).toContain(color);
    });
  });
});
