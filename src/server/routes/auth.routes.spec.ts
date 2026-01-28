import { describe, test, expect, beforeEach, mock } from "bun:test";
import { Elysia } from "elysia";
import { StatusCodes } from "http-status-codes";
import type { AuthResult, AuthError } from "../services/auth.service";
import type { User } from "../repositories/user.repository";

type Result<T> = { success: true; data: T } | { success: false; error: AuthError };

const testUsers = new Map<string, { id: string; username: string; email: string }>();

function createSuccessResult<T>(data: T): { success: true; data: T } {
  return { success: true, data };
}

function createErrorResult(code: string, message: string): { success: false; error: AuthError } {
  return { success: false, error: { code, message } };
}

const mockAuthService = {
  register: mock(async (input: { username: string; email: string; password: string }): Promise<Result<AuthResult>> => {
    if (input.username.length < 3 || input.username.length > 30) {
      return createErrorResult("VALIDATION_ERROR", "Username must be 3-30 characters");
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(input.username)) {
      return createErrorResult("VALIDATION_ERROR", "Username can only contain letters, numbers, hyphens, and underscores");
    }
    if (input.password.length < 8) {
      return createErrorResult("VALIDATION_ERROR", "Password must be at least 8 characters");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.email)) {
      return createErrorResult("VALIDATION_ERROR", "Invalid email format");
    }
    if (testUsers.has(input.username)) {
      return createErrorResult("VALIDATION_ERROR", "Username already exists");
    }

    const userId = crypto.randomUUID();
    testUsers.set(input.username, { id: userId, username: input.username, email: input.email });

    return createSuccessResult({
      user: {
        id: userId,
        username: input.username,
        email: input.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      token: `mock-token-${input.username}`,
    });
  }),
  login: mock(async (input: { username: string; password: string }): Promise<Result<AuthResult>> => {
    const user = testUsers.get(input.username);
    if (!user) {
      return createErrorResult("UNAUTHORIZED", "Invalid credentials");
    }
    if (input.password !== "secure123") {
      return createErrorResult("UNAUTHORIZED", "Invalid credentials");
    }
    return createSuccessResult({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      token: `mock-token-${input.username}`,
    });
  }),
  getUserById: mock((userId: string): Omit<User, "password_hash"> | null => {
    for (const user of testUsers.values()) {
      if (user.id === userId) {
        return {
          id: user.id,
          username: user.username,
          email: user.email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
    }
    return null;
  }),
  validateToken: mock(async (token: string) => {
    const username = token.replace("mock-token-", "");
    const user = testUsers.get(username);
    if (user) {
      return { userId: user.id, username: user.username, email: user.email };
    }
    return null;
  }),
};

mock.module("../services/auth.service", () => ({
  authService: mockAuthService,
  AuthService: class MockAuthService {},
}));

mock.module("../auth", () => ({
  extractBearerToken: (auth: string | undefined) => {
    if (!auth?.startsWith("Bearer ")) return null;
    return auth.slice(7);
  },
  verifyToken: async (token: string) => {
    const username = token.replace("mock-token-", "");
    const user = testUsers.get(username);
    if (user) {
      return { userId: user.id, username: user.username, email: user.email };
    }
    return null;
  },
}));

import { authRoutes } from "./auth.routes";
import { authPlugin } from "../middleware";

const app = new Elysia()
  .use(authPlugin)
  .group("/api", (app) => app.use(authRoutes));

const validUser = {
  username: "john",
  email: "john@example.com",
  password: "secure123",
};

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

describe("Auth Routes", () => {
  beforeEach(() => {
    testUsers.clear();
  });

  describe("POST /api/auth/register", () => {
    test("creates user and returns token", async () => {
      const res = await app.handle(
        new Request("http://localhost/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validUser),
        })
      );

      expect(res.status).toBe(StatusCodes.CREATED);
      const data = await res.json();
      expect(data.user.username).toBe(validUser.username);
      expect(data.user.email).toBe(validUser.email);
      expect(data.token).toBeTruthy();
      expect(data.user).not.toHaveProperty("password_hash");
    });

    test("returns 400 for duplicate username", async () => {
      await app.handle(
        new Request("http://localhost/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validUser),
        })
      );

      const res = await app.handle(
        new Request("http://localhost/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...validUser,
            email: "different@example.com",
          }),
        })
      );

      expect(res.status).toBe(StatusCodes.BAD_REQUEST);
      const data = await res.json();
      expect(data.error.message).toBe("Username already exists");
    });

    test("returns 400 for invalid email", async () => {
      const res = await app.handle(
        new Request("http://localhost/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...validUser,
            email: "notanemail",
          }),
        })
      );

      expect(res.status).toBe(StatusCodes.BAD_REQUEST);
      const data = await res.json();
      expect(data.error.message).toContain("email");
    });
  });

  describe("POST /api/auth/login", () => {
    test("returns token for valid credentials", async () => {
      await app.handle(
        new Request("http://localhost/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validUser),
        })
      );

      const res = await app.handle(
        new Request("http://localhost/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: validUser.username,
            password: validUser.password,
          }),
        })
      );

      expect(res.status).toBe(StatusCodes.OK);
      const data = await res.json();
      expect(data.user.username).toBe(validUser.username);
      expect(data.token).toBeTruthy();
    });

    test("returns 401 for invalid password", async () => {
      await app.handle(
        new Request("http://localhost/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validUser),
        })
      );

      const res = await app.handle(
        new Request("http://localhost/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: validUser.username,
            password: "wrongpassword",
          }),
        })
      );

      expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
      const data = await res.json();
      expect(data.error.message).toBe("Invalid credentials");
    });

    test("returns 401 for non-existent user", async () => {
      const res = await app.handle(
        new Request("http://localhost/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "nonexistent",
            password: "anypassword",
          }),
        })
      );

      expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
      const data = await res.json();
      expect(data.error.message).toBe("Invalid credentials");
    });
  });

  describe("GET /api/auth/me", () => {
    test("returns current user when authenticated", async () => {
      const registerRes = await app.handle(
        new Request("http://localhost/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validUser),
        })
      );
      const registerData = await registerRes.json();

      const res = await app.handle(
        new Request("http://localhost/api/auth/me", {
          headers: authHeader(registerData.token),
        })
      );

      expect(res.status).toBe(StatusCodes.OK);
      const data = await res.json();
      expect(data.username).toBe(validUser.username);
      expect(data.email).toBe(validUser.email);
    });

    test("returns 401 when not authenticated", async () => {
      const res = await app.handle(
        new Request("http://localhost/api/auth/me")
      );

      expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
    });

    test("returns 401 for invalid token", async () => {
      const res = await app.handle(
        new Request("http://localhost/api/auth/me", {
          headers: authHeader("invalid-token"),
        })
      );

      expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
    });
  });
});
