import { describe, test, expect } from "bun:test";
import {
  validateUsername,
  validateEmail,
  validatePassword,
  validateCreateUserData,
} from "./user";

describe("User Domain Validation", () => {
  describe("validateUsername", () => {
    describe("valid usernames", () => {
      test("accepts alphanumeric username", () => {
        const result = validateUsername("john123");
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test("accepts username with hyphens", () => {
        const result = validateUsername("john-doe");
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test("accepts username with underscores", () => {
        const result = validateUsername("john_smith");
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test("accepts username with mixed valid characters", () => {
        const result = validateUsername("john_doe-123");
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test("accepts 3 character username (minimum)", () => {
        const result = validateUsername("abc");
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test("accepts 30 character username (maximum)", () => {
        const result = validateUsername("a".repeat(30));
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe("invalid usernames - special characters", () => {
      test("rejects username with @ symbol", () => {
        const result = validateUsername("john@doe");
        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          "Username can only contain letters, numbers, hyphens, and underscores"
        );
      });

      test("rejects username with period", () => {
        const result = validateUsername("john.smith");
        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          "Username can only contain letters, numbers, hyphens, and underscores"
        );
      });

      test("rejects username with space", () => {
        const result = validateUsername("john doe");
        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          "Username can only contain letters, numbers, hyphens, and underscores"
        );
      });

      test("rejects username with slash", () => {
        const result = validateUsername("john/smith");
        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          "Username can only contain letters, numbers, hyphens, and underscores"
        );
      });
    });

    describe("invalid usernames - length", () => {
      test("rejects username that is too short (2 chars)", () => {
        const result = validateUsername("ab");
        expect(result.valid).toBe(false);
        expect(result.errors).toContain("Username must be at least 3 characters");
      });

      test("rejects username that is too short (1 char)", () => {
        const result = validateUsername("a");
        expect(result.valid).toBe(false);
        expect(result.errors).toContain("Username must be at least 3 characters");
      });

      test("rejects username that is too long (31 chars)", () => {
        const result = validateUsername("a".repeat(31));
        expect(result.valid).toBe(false);
        expect(result.errors).toContain("Username cannot exceed 30 characters");
      });

      test("rejects username that is too long (50 chars)", () => {
        const result = validateUsername("a".repeat(50));
        expect(result.valid).toBe(false);
        expect(result.errors).toContain("Username cannot exceed 30 characters");
      });
    });

    describe("required field", () => {
      test("rejects null username", () => {
        const result = validateUsername(null);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain("Username is required");
      });

      test("rejects undefined username", () => {
        const result = validateUsername(undefined);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain("Username is required");
      });

      test("rejects empty username", () => {
        const result = validateUsername("");
        expect(result.valid).toBe(false);
        expect(result.errors).toContain("Username is required");
      });
    });
  });

  describe("validateEmail", () => {
    describe("valid emails", () => {
      test("accepts standard email format", () => {
        const result = validateEmail("user@example.com");
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test("accepts email with plus sign", () => {
        const result = validateEmail("user+tag@example.com");
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test("accepts email with subdomain", () => {
        const result = validateEmail("user@mail.example.com");
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test("accepts email with country code TLD", () => {
        const result = validateEmail("user@example.co.uk");
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe("invalid emails", () => {
      test("rejects email without @ symbol", () => {
        const result = validateEmail("notanemail");
        expect(result.valid).toBe(false);
        expect(result.errors).toContain("Invalid email format");
      });

      test("rejects email with only @ symbol", () => {
        const result = validateEmail("@example.com");
        expect(result.valid).toBe(false);
        expect(result.errors).toContain("Invalid email format");
      });

      test("rejects email without domain", () => {
        const result = validateEmail("user@");
        expect(result.valid).toBe(false);
        expect(result.errors).toContain("Invalid email format");
      });

      test("rejects email with space", () => {
        const result = validateEmail("user @example.com");
        expect(result.valid).toBe(false);
        expect(result.errors).toContain("Invalid email format");
      });

      test("rejects email without TLD", () => {
        const result = validateEmail("user@example");
        expect(result.valid).toBe(false);
        expect(result.errors).toContain("Invalid email format");
      });
    });

    describe("required field", () => {
      test("rejects null email", () => {
        const result = validateEmail(null);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain("Email is required");
      });

      test("rejects undefined email", () => {
        const result = validateEmail(undefined);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain("Email is required");
      });

      test("rejects empty email", () => {
        const result = validateEmail("");
        expect(result.valid).toBe(false);
        expect(result.errors).toContain("Email is required");
      });
    });
  });

  describe("validatePassword", () => {
    describe("required field", () => {
      test("rejects null password", () => {
        const result = validatePassword(null);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain("Password is required");
      });

      test("rejects undefined password", () => {
        const result = validatePassword(undefined);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain("Password is required");
      });

      test("rejects empty password", () => {
        const result = validatePassword("");
        expect(result.valid).toBe(false);
        expect(result.errors).toContain("Password is required");
      });
    });

    test("accepts valid password", () => {
      const result = validatePassword("validpassword123");
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("validateCreateUserData", () => {
    test("validates all fields for valid data", () => {
      const result = validateCreateUserData({
        username: "john-doe",
        email: "john@example.com",
        password: "securepassword",
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test("collects errors from all invalid fields", () => {
      const result = validateCreateUserData({
        username: "ab",
        email: "notanemail",
        password: "",
      });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toContain("Username must be at least 3 characters");
      expect(result.errors).toContain("Invalid email format");
      expect(result.errors).toContain("Password is required");
    });

    test("validates missing fields", () => {
      const result = validateCreateUserData({});
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Username is required");
      expect(result.errors).toContain("Email is required");
      expect(result.errors).toContain("Password is required");
    });
  });
});
