import { beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { type CreateUserDTO, type User, UserRepository } from "../../repositories/user.repository";
import { clearTestDatabase, setupTestDatabase } from "../test-helpers";

describe("UserRepository Integration Tests", () => {
  let userRepo: UserRepository;

  beforeAll(() => {
    setupTestDatabase();
  });

  beforeEach(() => {
    clearTestDatabase();
    userRepo = new UserRepository();
  });

  describe("create", () => {
    test("persists user to database", () => {
      const userData: CreateUserDTO = {
        username: "john",
        email: "john@example.com",
        passwordHash: "hashedpassword123",
      };

      const user = userRepo.create(userData);

      expect(user).toBeDefined();
      expect(user.username).toBe("john");
      expect(user.email).toBe("john@example.com");
      expect(user.password_hash).toBe("hashedpassword123");
    });

    test("returns entity with generated id", () => {
      const userData: CreateUserDTO = {
        username: "alice",
        email: "alice@example.com",
        passwordHash: "hashedpassword123",
      };

      const user = userRepo.create(userData);

      expect(user.id).toBeDefined();
      expect(typeof user.id).toBe("string");
      expect(user.id.length).toBeGreaterThan(0);
    });

    test("sets created_at and updated_at timestamps", () => {
      const userData: CreateUserDTO = {
        username: "bob",
        email: "bob@example.com",
        passwordHash: "hashedpassword123",
      };

      const user = userRepo.create(userData);

      expect(user.created_at).toBeDefined();
      expect(user.updated_at).toBeDefined();
      expect(typeof user.created_at).toBe("string");
      expect(typeof user.updated_at).toBe("string");
    });
  });

  describe("findByUsername", () => {
    beforeEach(() => {
      userRepo.create({
        username: "john",
        email: "john@example.com",
        passwordHash: "hashedpassword123",
      });
    });

    test("returns correct user", () => {
      const user = userRepo.findByUsername("john");

      expect(user).not.toBeNull();
      expect(user?.username).toBe("john");
      expect(user?.email).toBe("john@example.com");
    });

    test("handles case-insensitively - lowercase query", () => {
      const user = userRepo.findByUsername("john");
      expect(user).not.toBeNull();
      expect(user?.username).toBe("john");
    });

    test("handles case-insensitively - uppercase query", () => {
      const user = userRepo.findByUsername("JOHN");
      expect(user).not.toBeNull();
      expect(user?.username).toBe("john");
    });

    test("handles case-insensitively - mixed case query", () => {
      const user = userRepo.findByUsername("JoHn");
      expect(user).not.toBeNull();
      expect(user?.username).toBe("john");
    });

    test("returns null for non-existent user", () => {
      const user = userRepo.findByUsername("nonexistent");
      expect(user).toBeNull();
    });
  });

  describe("findByEmail", () => {
    beforeEach(() => {
      userRepo.create({
        username: "alice",
        email: "alice@example.com",
        passwordHash: "hashedpassword123",
      });
    });

    test("returns correct user", () => {
      const user = userRepo.findByEmail("alice@example.com");

      expect(user).not.toBeNull();
      expect(user?.email).toBe("alice@example.com");
      expect(user?.username).toBe("alice");
    });

    test("returns null for non-existent email", () => {
      const user = userRepo.findByEmail("nonexistent@example.com");
      expect(user).toBeNull();
    });
  });

  describe("findById", () => {
    let createdUser: User;

    beforeEach(() => {
      createdUser = userRepo.create({
        username: "bob",
        email: "bob@example.com",
        passwordHash: "hashedpassword123",
      });
    });

    test("returns correct user", () => {
      const user = userRepo.findById(createdUser.id);

      expect(user).not.toBeNull();
      expect(user?.id).toBe(createdUser.id);
      expect(user?.username).toBe("bob");
    });

    test("returns null for non-existent id", () => {
      const user = userRepo.findById("nonexistent-id");
      expect(user).toBeNull();
    });
  });

  describe("usernameExists", () => {
    beforeEach(() => {
      userRepo.create({
        username: "john",
        email: "john@example.com",
        passwordHash: "hashedpassword123",
      });
    });

    test("returns true for existing username", () => {
      expect(userRepo.usernameExists("john")).toBe(true);
    });

    test("returns true for existing username - case insensitive", () => {
      expect(userRepo.usernameExists("JOHN")).toBe(true);
      expect(userRepo.usernameExists("John")).toBe(true);
      expect(userRepo.usernameExists("JoHn")).toBe(true);
    });

    test("returns false for non-existent username", () => {
      expect(userRepo.usernameExists("nonexistent")).toBe(false);
    });
  });

  describe("emailExists", () => {
    beforeEach(() => {
      userRepo.create({
        username: "alice",
        email: "alice@example.com",
        passwordHash: "hashedpassword123",
      });
    });

    test("returns true for existing email", () => {
      expect(userRepo.emailExists("alice@example.com")).toBe(true);
    });

    test("returns false for non-existent email", () => {
      expect(userRepo.emailExists("nonexistent@example.com")).toBe(false);
    });
  });

  describe("username uniqueness constraint", () => {
    test("rejects duplicate usernames - exact match", () => {
      userRepo.create({
        username: "john",
        email: "john1@example.com",
        passwordHash: "hashedpassword123",
      });

      expect(() => {
        userRepo.create({
          username: "john",
          email: "john2@example.com",
          passwordHash: "hashedpassword123",
        });
      }).toThrow();
    });

    test("rejects duplicate usernames - case insensitive", () => {
      userRepo.create({
        username: "john",
        email: "john1@example.com",
        passwordHash: "hashedpassword123",
      });

      expect(() => {
        userRepo.create({
          username: "JOHN",
          email: "john2@example.com",
          passwordHash: "hashedpassword123",
        });
      }).toThrow();
    });

    test("rejects duplicate usernames - mixed case", () => {
      userRepo.create({
        username: "john",
        email: "john1@example.com",
        passwordHash: "hashedpassword123",
      });

      expect(() => {
        userRepo.create({
          username: "JoHn",
          email: "john2@example.com",
          passwordHash: "hashedpassword123",
        });
      }).toThrow();
    });
  });

  describe("email uniqueness constraint", () => {
    test("rejects duplicate emails", () => {
      userRepo.create({
        username: "alice",
        email: "alice@example.com",
        passwordHash: "hashedpassword123",
      });

      expect(() => {
        userRepo.create({
          username: "alice2",
          email: "alice@example.com",
          passwordHash: "hashedpassword123",
        });
      }).toThrow();
    });
  });
});
