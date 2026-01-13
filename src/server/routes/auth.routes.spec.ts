import { describe, test, expect, beforeEach, mock } from "bun:test";
import { authService } from "../services/auth.service";
import type { User } from "../repositories/user.repository";

const testUsers = new Map<string, User>();

const mockUserRepository = {
  create: mock((data) => {
    const user = {
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
  findByUsername: mock((username: string) => testUsers.get(username) ?? null),
  findByEmail: mock(() => null),
  usernameExists: mock((username: string) => testUsers.has(username)),
};

mock.module("../repositories/user.repository", () => ({
  userRepository: mockUserRepository,
}));

const validUser = {
  username: "john",
  email: "john@example.com",
  password: "secure123",
};

describe("Authentication - Registration", () => {
  beforeEach(() => {
    testUsers.clear();
  });

  describe("Scenario: Successful registration with valid credentials", () => {
    test("should create user account with hashed password and return JWT token", async () => {
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
  });

  describe("Scenario: Registration fails with duplicate username", () => {
    test("should reject registration and return BAD_REQUEST status", async () => {
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
  });

  describe("Scenario: Registration fails with invalid username format", () => {
    test.each([
      ["ab", "too short"],
      ["a".repeat(31), "too long"],
    ])("should reject username that is %s", async (username) => {
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
    ])("should reject username with invalid characters: %s", async (username) => {
      const result = await authService.register({
        username,
        email: "test@example.com",
        password: "secure123",
      });

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("Scenario: Registration fails with weak password", () => {
    test("should reject password shorter than 8 characters", async () => {
      const result = await authService.register({
        ...validUser,
        password: "short",
      });

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error.code).toBe("VALIDATION_ERROR");
      expect(result.error.message).toContain("at least 8 characters");
    });
  });

  describe("Scenario: Registration fails with invalid email", () => {
    test.each([
      "notanemail",
      "missing@domain",
      "@nodomain.com",
      "no@domain",
    ])("should reject invalid email format: %s", async (email) => {
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
});

describe("Authentication - Login", () => {
  beforeEach(() => {
    testUsers.clear();
  });

  describe("Scenario: Successful login with valid credentials", () => {
    test("should verify password and return JWT token", async () => {
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
  });

  describe("Scenario: Login fails with incorrect password", () => {
    test("should reject login and return UNAUTHORIZED status", async () => {
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
  });

  describe("Scenario: Login fails with non-existent username", () => {
    test("should reject login and return UNAUTHORIZED status without revealing username doesn't exist", async () => {
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
