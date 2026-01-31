import { describe, test, expect, beforeEach, mock } from "bun:test";

const mockTagRepositoryForSession = {
  findAllByUserId: mock(() => []),
  getItemTagsForUser: mock(() => []),
  create: mock(() => ({})),
  findByNameAndUserId: mock(() => null),
  findByIdAndUserId: mock(() => null),
  findByUserId: mock(() => []),
  findSuggestions: mock(() => []),
  getItemCountForTag: mock(() => 0),
  delete: mock(() => {}),
  setItemTags: mock(() => {}),
  getTagsForItem: mock(() => []),
};

const mockItemRepositoryForSession = {
  create: mock(() => ({})),
  findByIdAndUserId: mock(() => null),
  findByUserId: mock(() => ({ items: [], total: 0 })),
  update: mock(() => null),
  delete: mock(() => {}),
};

const mockUserServiceForSession = {
  findByUsername: mock(() => null),
};

mock.module("../repositories", () => ({
  tagRepository: mockTagRepositoryForSession,
  itemRepository: mockItemRepositoryForSession,
}));

mock.module("./user.service", () => ({
  userService: mockUserServiceForSession,
}));

import { initSession, getSession, hasSession, clearSession } from "./session";

describe("Session", () => {
  beforeEach(() => {
    clearSession();
  });

  describe("initSession", () => {
    test("creates session with userId and username", () => {
      const session = initSession("user-123", "john");

      expect(session.userId).toBe("user-123");
      expect(session.username).toBe("john");
      expect(session.tagService).toBeDefined();
      expect(session.itemService).toBeDefined();
    });

    test("replaces existing session", () => {
      initSession("user-1", "alice");
      initSession("user-2", "bob");

      const session = getSession();
      expect(session.userId).toBe("user-2");
      expect(session.username).toBe("bob");
    });
  });

  describe("getSession", () => {
    test("returns active session", () => {
      initSession("user-123", "john");

      const session = getSession();

      expect(session.userId).toBe("user-123");
      expect(session.username).toBe("john");
    });

    test("throws when no session exists", () => {
      expect(() => getSession()).toThrow("No active session");
    });
  });

  describe("hasSession", () => {
    test("returns false when no session", () => {
      expect(hasSession()).toBe(false);
    });

    test("returns true when session exists", () => {
      initSession("user-123", "john");

      expect(hasSession()).toBe(true);
    });
  });

  describe("clearSession", () => {
    test("clears existing session", () => {
      initSession("user-123", "john");

      clearSession();

      expect(hasSession()).toBe(false);
    });

    test("is safe to call when no session", () => {
      expect(() => clearSession()).not.toThrow();
    });
  });
});
