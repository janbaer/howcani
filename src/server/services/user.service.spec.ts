import { beforeEach, describe, expect, mock, test } from "bun:test";
import type { User } from "../repositories/user.repository";

const testUsers = new Map<string, User>();

const mockUserRepository = {
  findById: mock((id: string) => {
    for (const user of testUsers.values()) {
      if (user.id === id) return user;
    }
    return null;
  }),
  findByUsername: mock((username: string) => testUsers.get(username) ?? null),
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

import { UserService } from "./user.service";

function createTestUser(overrides: Partial<User> = {}): User {
  const defaults: User = {
    id: crypto.randomUUID(),
    username: "testuser",
    email: "test@example.com",
    password_hash: "hashed_password",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  return { ...defaults, ...overrides };
}

describe("UserService", () => {
  let userService: UserService;

  beforeEach(() => {
    testUsers.clear();
    userService = new UserService();
  });

  describe("findById", () => {
    test("returns user without password_hash when found", () => {
      const user = createTestUser({ username: "john" });
      testUsers.set(user.username, user);

      const result = userService.findById(user.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(user.id);
      expect(result?.username).toBe("john");
      expect(result).not.toHaveProperty("password_hash");
    });

    test("returns null when user not found", () => {
      const result = userService.findById("nonexistent-id");

      expect(result).toBeNull();
    });
  });

  describe("findByUsername", () => {
    test("returns user without password_hash when found", () => {
      const user = createTestUser({ username: "john" });
      testUsers.set(user.username, user);

      const result = userService.findByUsername("john");

      expect(result).not.toBeNull();
      expect(result?.username).toBe("john");
      expect(result).not.toHaveProperty("password_hash");
    });

    test("returns null when user not found", () => {
      const result = userService.findByUsername("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("getUserIdByUsername", () => {
    test("returns user id when found", () => {
      const user = createTestUser({ username: "john" });
      testUsers.set(user.username, user);

      const result = userService.getUserIdByUsername("john");

      expect(result).toBe(user.id);
    });

    test("returns null when user not found", () => {
      const result = userService.getUserIdByUsername("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("exists", () => {
    test("returns true when username exists", () => {
      const user = createTestUser({ username: "john" });
      testUsers.set(user.username, user);

      expect(userService.exists("john")).toBe(true);
    });

    test("returns false when username does not exist", () => {
      expect(userService.exists("nonexistent")).toBe(false);
    });
  });

  describe("emailExists", () => {
    test("returns true when email exists", () => {
      const user = createTestUser({ email: "john@example.com" });
      testUsers.set(user.username, user);

      expect(userService.emailExists("john@example.com")).toBe(true);
    });

    test("returns false when email does not exist", () => {
      expect(userService.emailExists("nonexistent@example.com")).toBe(false);
    });
  });
});
