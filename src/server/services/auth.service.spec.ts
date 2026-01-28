import { describe, test, expect, beforeEach, mock } from "bun:test";
import type { User } from "../repositories/user.repository";

const testUsers = new Map<string, User>();

const mockUserRepository = {
  create: mock((data: { username: string; email: string; passwordHash: string }) => {
    const user: User = {
      id: crypto.randomUUID(),
      username: data.username,
      email: data.email,
      password_hash: data.passwordHash,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    testUsers.set(data.username, user);
    return user;
  }),
  findById: mock((id: string) => {
    for (const user of testUsers.values()) {
      if (user.id === id) return user;
    }
    return null;
  }),
  findByUsername: mock((username: string) => testUsers.get(username) ?? null),
  findByEmail: mock((email: string) => {
    for (const user of testUsers.values()) {
      if (user.email === email) return user;
    }
    return null;
  }),
  usernameExists: mock((username: string) => testUsers.has(username)),
  emailExists: mock((email: string) => {
    for (const user of testUsers.values()) {
      if (user.email === email) return true;
    }
    return false;
  }),
};

mock.module("../repositories", () => ({
  userRepository: mockUserRepository,
}));

import { AuthService } from "./auth.service";

const validUser = {
  username: "john",
  email: "john@example.com",
  password: "secure123",
};

describe("AuthService", () => {
  let authService: AuthService;

  beforeEach(() => {
    testUsers.clear();
    authService = new AuthService();
  });

  describe("register", () => {
    test("creates user account with hashed password and returns JWT token", async () => {
      const result = await authService.register(validUser);

      expect(result.success).toBe(true);
      if (!result.success) return;

      const { user, token } = result.data;

      expect(user).toHaveProperty("id");
      expect(user.username).toBe(validUser.username);
      expect(user.email).toBe(validUser.email);
      expect(user).not.toHaveProperty("password_hash");

      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);

      const mockUser = mockUserRepository.findByUsername(validUser.username);
      expect(mockUser).toBeTruthy();
      expect(mockUser?.password_hash).toBeTruthy();
      expect(mockUser?.password_hash).not.toBe(validUser.password);
    });

    test("rejects duplicate username", async () => {
      await authService.register(validUser);

      const result = await authService.register({
        username: validUser.username,
        email: "different@example.com",
        password: "secure456",
      });

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error.code).toBe("VALIDATION_ERROR");
      expect(result.error.message).toBe("Username already exists");
    });

    test.each([
      ["ab", "too short"],
      ["a".repeat(31), "too long"],
    ])("rejects username that is %s", async (username) => {
      const result = await authService.register({
        username,
        email: "test@example.com",
        password: "secure123",
      });

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error.code).toBe("VALIDATION_ERROR");
      expect(result.error.message).toContain("3-30 characters");
    });

    test.each([
      "john@doe",
      "john.doe",
      "john doe",
      "john!",
    ])("rejects username with invalid characters: %s", async (username) => {
      const result = await authService.register({
        username,
        email: "test@example.com",
        password: "secure123",
      });

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error.code).toBe("VALIDATION_ERROR");
    });

    test("rejects password shorter than 8 characters", async () => {
      const result = await authService.register({
        ...validUser,
        password: "short",
      });

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error.code).toBe("VALIDATION_ERROR");
      expect(result.error.message).toContain("at least 8 characters");
    });

    test.each([
      "notanemail",
      "missing@domain",
      "@nodomain.com",
      "no@domain",
    ])("rejects invalid email format: %s", async (email) => {
      const result = await authService.register({
        ...validUser,
        email,
      });

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error.code).toBe("VALIDATION_ERROR");
      expect(result.error.message).toContain("email");
    });
  });

  describe("login", () => {
    test("verifies password and returns JWT token", async () => {
      await authService.register(validUser);

      const result = await authService.login({
        username: validUser.username,
        password: validUser.password,
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      const { user, token } = result.data;

      expect(user).toHaveProperty("id");
      expect(user.username).toBe(validUser.username);
      expect(user.email).toBe(validUser.email);
      expect(user).not.toHaveProperty("password_hash");

      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);
    });

    test("rejects incorrect password", async () => {
      await authService.register(validUser);

      const result = await authService.login({
        username: validUser.username,
        password: "wrongpassword",
      });

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error.code).toBe("UNAUTHORIZED");
      expect(result.error.message).toBe("Invalid credentials");
    });

    test("rejects non-existent username without revealing it doesn't exist", async () => {
      const result = await authService.login({
        username: "alice",
        password: "anypassword",
      });

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error.code).toBe("UNAUTHORIZED");
      expect(result.error.message).toBe("Invalid credentials");
    });
  });
});
