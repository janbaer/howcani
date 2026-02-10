import { describe, expect, test } from "bun:test";
import { createToken, extractBearerToken, verifyToken } from "./jwt";

describe("JWT", () => {
  describe("createToken + verifyToken", () => {
    test("creates and verifies a valid token", async () => {
      const payload = { userId: "u1", username: "john", email: "john@example.com" };

      const token = await createToken(payload);
      const result = await verifyToken(token);

      expect(result).not.toBeNull();
      expect(result?.userId).toBe("u1");
      expect(result?.username).toBe("john");
      expect(result?.email).toBe("john@example.com");
    });

    test("returns null for invalid token", async () => {
      const result = await verifyToken("invalid-token");

      expect(result).toBeNull();
    });

    test("returns null for tampered token", async () => {
      const token = await createToken({ userId: "u1", username: "john", email: "john@example.com" });
      const tampered = `${token}x`;

      const result = await verifyToken(tampered);

      expect(result).toBeNull();
    });
  });

  describe("extractBearerToken", () => {
    test("extracts token from valid Bearer header", () => {
      const token = extractBearerToken("Bearer abc123");

      expect(token).toBe("abc123");
    });

    test("returns null for missing header", () => {
      expect(extractBearerToken(undefined)).toBeNull();
    });

    test("returns null for non-Bearer header", () => {
      expect(extractBearerToken("Basic abc123")).toBeNull();
    });

    test("returns null for empty string", () => {
      expect(extractBearerToken("")).toBeNull();
    });
  });
});
