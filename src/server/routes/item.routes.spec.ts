import { describe, test, expect, beforeEach, mock } from "bun:test";
import { Elysia } from "elysia";
import { StatusCodes } from "http-status-codes";
import type { ItemWithTags, ItemError } from "../services/item.service";
import type { Tag } from "../domain/tag";

type ItemResult = { success: true; data: ItemWithTags } | { success: false; error: ItemError };
type ListResult = { success: true; data: { items: ItemWithTags[]; total: number } } | { success: false; error: ItemError };
type DeleteResult = { success: true; data: { deleted: true } } | { success: false; error: ItemError };

const testItems = new Map<string, ItemWithTags>();
const testUsers = new Map<string, { id: string; username: string }>();
let nextItemId = 1;
let currentSessionUserId: string | null = null;

function createSuccessResult<T>(data: T): { success: true; data: T } {
  return { success: true, data };
}

function createErrorResult(code: ItemError["code"], message: string): { success: false; error: ItemError } {
  return { success: false, error: { code, message } };
}

const mockSessionItemService = {
  createItem: mock((input: { question: string; answer?: string; tags?: string[] }): ItemResult => {
    const userId = currentSessionUserId!;
    if (!input.question || input.question.trim() === "") {
      return createErrorResult("VALIDATION_ERROR", "Question is required");
    }
    const item: ItemWithTags = {
      id: `item-${nextItemId++}`,
      user_id: userId,
      question: input.question,
      answer: input.answer ?? "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tags: (input.tags ?? []).map((name, i) => ({
        id: `tag-${i}`,
        user_id: userId,
        name,
        color: "0e8a16",
        created_at: new Date().toISOString(),
      })),
    };
    testItems.set(item.id, item);
    return createSuccessResult(item);
  }),
  updateItem: mock((itemId: string, input: { question?: string; answer?: string; tags?: string[] }): ItemResult => {
    const userId = currentSessionUserId!;
    const item = testItems.get(itemId);
    if (!item || item.user_id !== userId) {
      return createErrorResult("NOT_FOUND", "Item not found");
    }
    if (input.question !== undefined && input.question.trim() === "") {
      return createErrorResult("VALIDATION_ERROR", "Question is required");
    }
    const updated: ItemWithTags = {
      ...item,
      question: input.question ?? item.question,
      answer: input.answer ?? item.answer,
      updated_at: new Date().toISOString(),
      tags: input.tags !== undefined
        ? input.tags.map((name, i) => ({
            id: `tag-${i}`,
            user_id: userId,
            name,
            color: "0e8a16",
            created_at: new Date().toISOString(),
          }))
        : item.tags,
    };
    testItems.set(itemId, updated);
    return createSuccessResult(updated);
  }),
  deleteItem: mock((itemId: string): DeleteResult => {
    const userId = currentSessionUserId!;
    const item = testItems.get(itemId);
    if (!item || item.user_id !== userId) {
      return createErrorResult("NOT_FOUND", "Item not found");
    }
    testItems.delete(itemId);
    return createSuccessResult({ deleted: true });
  }),
  getItem: mock((itemId: string, username: string): ItemResult => {
    const user = testUsers.get(username);
    if (!user) {
      return createErrorResult("USER_NOT_FOUND", "User not found");
    }
    const item = testItems.get(itemId);
    if (!item || item.user_id !== user.id) {
      return createErrorResult("NOT_FOUND", "Item not found");
    }
    return createSuccessResult(item);
  }),
  listItems: mock((username: string, pagination: { limit?: number; offset?: number } = {}): ListResult => {
    const user = testUsers.get(username);
    if (!user) {
      return createErrorResult("USER_NOT_FOUND", "User not found");
    }
    const userItems = Array.from(testItems.values()).filter((i) => i.user_id === user.id);
    const { limit = 50, offset = 0 } = pagination;
    return createSuccessResult({
      items: userItems.slice(offset, offset + limit),
      total: userItems.length,
    });
  }),
};

const mockItemService = mockSessionItemService;

const mockAuthService = {
  register: mock(async (input: { username: string; email: string; password: string }) => {
    const userId = crypto.randomUUID();
    testUsers.set(input.username, { id: userId, username: input.username });
    currentSessionUserId = userId;
    return {
      success: true,
      data: {
        user: {
          id: userId,
          username: input.username,
          email: input.email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        token: `mock-token-${input.username}`,
      },
    };
  }),
  validateToken: mock(async (token: string) => {
    const username = token.replace("mock-token-", "");
    const user = testUsers.get(username);
    if (user) {
      currentSessionUserId = user.id;
      return { userId: user.id, username: user.username, email: `${user.username}@example.com` };
    }
    return null;
  }),
};

mock.module("../services/item.service", () => ({
  itemService: mockItemService,
}));

mock.module("../services/session", () => ({
  getSession: mock(() => ({
    itemService: mockSessionItemService,
    tagService: {},
    userId: currentSessionUserId,
    username: "",
  })),
  initSession: mock((userId: string, username: string) => {
    currentSessionUserId = userId;
    return { userId, username, itemService: mockSessionItemService, tagService: {} };
  }),
  hasSession: mock(() => currentSessionUserId !== null),
  clearSession: mock(() => {
    currentSessionUserId = null;
  }),
}));

mock.module("../services/auth.service", () => ({
  authService: mockAuthService,
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
      return { userId: user.id, username: user.username, email: `${user.username}@example.com` };
    }
    return null;
  },
}));

import { itemRoutes } from "./item.routes";
import { authRoutes } from "./auth.routes";
import { authPlugin } from "../middleware";

const app = new Elysia()
  .use(authPlugin)
  .group("/api", (app) => app.use(authRoutes).use(itemRoutes));

async function registerAndLogin(
  username: string,
  email: string
): Promise<{ token: string; userId: string }> {
  const registerRes = await app.handle(
    new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        email,
        password: "secure123",
      }),
    })
  );
  const registerData = await registerRes.json();
  return { token: registerData.token, userId: registerData.user.id };
}

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

describe("Item Routes", () => {
  beforeEach(() => {
    testItems.clear();
    testUsers.clear();
    nextItemId = 1;
    currentSessionUserId = null;
  });

  describe("POST /api/:username/items - Create Item", () => {
    test("creates item successfully when authenticated", async () => {
      const { token } = await registerAndLogin("john", "john@example.com");

      const res = await app.handle(
        new Request("http://localhost/api/john/items", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeader(token),
          },
          body: JSON.stringify({
            question: "How do I deploy with Bun?",
            answer: "Use `bun build` and run the output.",
          }),
        })
      );

      expect(res.status).toBe(StatusCodes.CREATED);

      const data = await res.json();
      expect(data.item).toBeDefined();
      expect(data.item.question).toBe("How do I deploy with Bun?");
      expect(data.item.answer).toBe("Use `bun build` and run the output.");
      expect(data.item.id).toBeDefined();
    });

    test("returns 401 when not authenticated", async () => {
      await registerAndLogin("john", "john@example.com");

      const res = await app.handle(
        new Request("http://localhost/api/john/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: "How do I deploy?",
          }),
        })
      );

      expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
    });

    test("returns 403 when username mismatch", async () => {
      const { token } = await registerAndLogin("john", "john@example.com");
      await registerAndLogin("alice", "alice@example.com");

      const res = await app.handle(
        new Request("http://localhost/api/alice/items", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeader(token),
          },
          body: JSON.stringify({
            question: "How do I deploy?",
          }),
        })
      );

      expect(res.status).toBe(StatusCodes.FORBIDDEN);
    });

    test("returns 400 when question is missing", async () => {
      const { token } = await registerAndLogin("john", "john@example.com");

      const res = await app.handle(
        new Request("http://localhost/api/john/items", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeader(token),
          },
          body: JSON.stringify({
            answer: "Some answer",
          }),
        })
      );

      expect(res.status).toBe(StatusCodes.BAD_REQUEST);
    });

    test("allows empty answer", async () => {
      const { token } = await registerAndLogin("john", "john@example.com");

      const res = await app.handle(
        new Request("http://localhost/api/john/items", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeader(token),
          },
          body: JSON.stringify({
            question: "Draft question",
            answer: "",
          }),
        })
      );

      expect(res.status).toBe(StatusCodes.CREATED);
      const data = await res.json();
      expect(data.item.answer).toBe("");
    });
  });

  describe("GET /api/:username/items - List Items", () => {
    test("lists items without authentication", async () => {
      const { token } = await registerAndLogin("john", "john@example.com");

      await app.handle(
        new Request("http://localhost/api/john/items", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeader(token),
          },
          body: JSON.stringify({ question: "Question 1" }),
        })
      );

      const res = await app.handle(
        new Request("http://localhost/api/john/items")
      );

      expect(res.status).toBe(StatusCodes.OK);

      const data = await res.json();
      expect(data.items).toHaveLength(1);
      expect(data.total).toBe(1);
    });

    test("supports pagination", async () => {
      const { token } = await registerAndLogin("john", "john@example.com");

      for (let i = 1; i <= 10; i++) {
        await app.handle(
          new Request("http://localhost/api/john/items", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...authHeader(token),
            },
            body: JSON.stringify({ question: `Question ${i}` }),
          })
        );
      }

      const res = await app.handle(
        new Request("http://localhost/api/john/items?limit=5&offset=0")
      );

      expect(res.status).toBe(StatusCodes.OK);

      const data = await res.json();
      expect(data.items).toHaveLength(5);
      expect(data.total).toBe(10);
    });

    test("returns empty list for user with no items", async () => {
      await registerAndLogin("john", "john@example.com");

      const res = await app.handle(
        new Request("http://localhost/api/john/items")
      );

      expect(res.status).toBe(StatusCodes.OK);

      const data = await res.json();
      expect(data.items).toHaveLength(0);
      expect(data.total).toBe(0);
    });

    test("clamps negative limit and offset to safe values", async () => {
      const { token } = await registerAndLogin("john", "john@example.com");

      await app.handle(
        new Request("http://localhost/api/john/items", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeader(token),
          },
          body: JSON.stringify({ question: "Question 1" }),
        })
      );

      const res = await app.handle(
        new Request("http://localhost/api/john/items?limit=-5&offset=-10")
      );

      expect(res.status).toBe(StatusCodes.OK);
      const data = await res.json();
      expect(data.items).toHaveLength(1);
    });

    test("handles non-numeric pagination params gracefully", async () => {
      await registerAndLogin("john", "john@example.com");

      const res = await app.handle(
        new Request("http://localhost/api/john/items?limit=abc&offset=xyz")
      );

      expect(res.status).toBe(StatusCodes.OK);
      const data = await res.json();
      expect(data.items).toBeDefined();
    });

    test("caps limit at 100", async () => {
      const { token } = await registerAndLogin("john", "john@example.com");

      for (let i = 1; i <= 3; i++) {
        await app.handle(
          new Request("http://localhost/api/john/items", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...authHeader(token),
            },
            body: JSON.stringify({ question: `Question ${i}` }),
          })
        );
      }

      const res = await app.handle(
        new Request("http://localhost/api/john/items?limit=9999")
      );

      expect(res.status).toBe(StatusCodes.OK);
      const data = await res.json();
      expect(data.items).toHaveLength(3);
    });
  });

  describe("GET /api/:username/items/:id - Get Single Item", () => {
    test("returns item without authentication", async () => {
      const { token } = await registerAndLogin("john", "john@example.com");

      const createRes = await app.handle(
        new Request("http://localhost/api/john/items", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeader(token),
          },
          body: JSON.stringify({ question: "Test question", answer: "Test answer" }),
        })
      );
      const createData = await createRes.json();

      const res = await app.handle(
        new Request(`http://localhost/api/john/items/${createData.item.id}`)
      );

      expect(res.status).toBe(StatusCodes.OK);

      const data = await res.json();
      expect(data.item.question).toBe("Test question");
      expect(data.item.answer).toBe("Test answer");
    });

    test("returns 404 for non-existent item", async () => {
      await registerAndLogin("john", "john@example.com");

      const res = await app.handle(
        new Request("http://localhost/api/john/items/nonexistent-id")
      );

      expect(res.status).toBe(StatusCodes.NOT_FOUND);
    });
  });

  describe("PUT /api/:username/items/:id - Update Item", () => {
    test("updates item successfully when authenticated", async () => {
      const { token } = await registerAndLogin("john", "john@example.com");

      const createRes = await app.handle(
        new Request("http://localhost/api/john/items", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeader(token),
          },
          body: JSON.stringify({ question: "Original", answer: "Original" }),
        })
      );
      const createData = await createRes.json();

      const res = await app.handle(
        new Request(`http://localhost/api/john/items/${createData.item.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...authHeader(token),
          },
          body: JSON.stringify({ question: "Updated", answer: "Updated" }),
        })
      );

      expect(res.status).toBe(StatusCodes.OK);

      const data = await res.json();
      expect(data.item.question).toBe("Updated");
      expect(data.item.answer).toBe("Updated");
    });

    test("returns 401 when not authenticated", async () => {
      const { token } = await registerAndLogin("john", "john@example.com");

      const createRes = await app.handle(
        new Request("http://localhost/api/john/items", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeader(token),
          },
          body: JSON.stringify({ question: "Test" }),
        })
      );
      const createData = await createRes.json();

      const res = await app.handle(
        new Request(`http://localhost/api/john/items/${createData.item.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: "Updated" }),
        })
      );

      expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
    });

    test("returns 403 when username mismatch", async () => {
      const john = await registerAndLogin("john", "john@example.com");
      const alice = await registerAndLogin("alice", "alice@example.com");

      const createRes = await app.handle(
        new Request("http://localhost/api/john/items", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeader(john.token),
          },
          body: JSON.stringify({ question: "John's item" }),
        })
      );
      const createData = await createRes.json();

      const res = await app.handle(
        new Request(`http://localhost/api/john/items/${createData.item.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...authHeader(alice.token),
          },
          body: JSON.stringify({ question: "Updated" }),
        })
      );

      expect(res.status).toBe(StatusCodes.FORBIDDEN);
    });

    test("returns 404 for non-existent item", async () => {
      const { token } = await registerAndLogin("john", "john@example.com");

      const res = await app.handle(
        new Request("http://localhost/api/john/items/nonexistent-id", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...authHeader(token),
          },
          body: JSON.stringify({ question: "Updated" }),
        })
      );

      expect(res.status).toBe(StatusCodes.NOT_FOUND);
    });

    test("returns 400 when updating with empty question", async () => {
      const { token } = await registerAndLogin("john", "john@example.com");

      const createRes = await app.handle(
        new Request("http://localhost/api/john/items", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeader(token),
          },
          body: JSON.stringify({ question: "Original" }),
        })
      );
      const createData = await createRes.json();

      const res = await app.handle(
        new Request(`http://localhost/api/john/items/${createData.item.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...authHeader(token),
          },
          body: JSON.stringify({ question: "" }),
        })
      );

      expect(res.status).toBe(StatusCodes.BAD_REQUEST);
    });

    test("returns 400 when updating with whitespace-only question", async () => {
      const { token } = await registerAndLogin("john", "john@example.com");

      const createRes = await app.handle(
        new Request("http://localhost/api/john/items", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeader(token),
          },
          body: JSON.stringify({ question: "Original" }),
        })
      );
      const createData = await createRes.json();

      const res = await app.handle(
        new Request(`http://localhost/api/john/items/${createData.item.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...authHeader(token),
          },
          body: JSON.stringify({ question: "   " }),
        })
      );

      expect(res.status).toBe(StatusCodes.BAD_REQUEST);
    });

    test("preserves created_at on update", async () => {
      const { token } = await registerAndLogin("john", "john@example.com");

      const createRes = await app.handle(
        new Request("http://localhost/api/john/items", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeader(token),
          },
          body: JSON.stringify({ question: "Original" }),
        })
      );
      const createData = await createRes.json();
      const originalCreatedAt = createData.item.created_at;

      const updateRes = await app.handle(
        new Request(`http://localhost/api/john/items/${createData.item.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...authHeader(token),
          },
          body: JSON.stringify({ question: "Updated" }),
        })
      );
      const updateData = await updateRes.json();

      expect(updateData.item.created_at).toBe(originalCreatedAt);
    });
  });

  describe("DELETE /api/:username/items/:id - Delete Item", () => {
    test("deletes item successfully when authenticated", async () => {
      const { token } = await registerAndLogin("john", "john@example.com");

      const createRes = await app.handle(
        new Request("http://localhost/api/john/items", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeader(token),
          },
          body: JSON.stringify({ question: "To be deleted" }),
        })
      );
      const createData = await createRes.json();

      const res = await app.handle(
        new Request(`http://localhost/api/john/items/${createData.item.id}`, {
          method: "DELETE",
          headers: authHeader(token),
        })
      );

      expect(res.status).toBe(StatusCodes.OK);

      const data = await res.json();
      expect(data.success).toBe(true);

      const getRes = await app.handle(
        new Request(`http://localhost/api/john/items/${createData.item.id}`)
      );
      expect(getRes.status).toBe(StatusCodes.NOT_FOUND);
    });

    test("returns 401 when not authenticated", async () => {
      const { token } = await registerAndLogin("john", "john@example.com");

      const createRes = await app.handle(
        new Request("http://localhost/api/john/items", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeader(token),
          },
          body: JSON.stringify({ question: "Test" }),
        })
      );
      const createData = await createRes.json();

      const res = await app.handle(
        new Request(`http://localhost/api/john/items/${createData.item.id}`, {
          method: "DELETE",
        })
      );

      expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
    });

    test("returns 403 when username mismatch", async () => {
      const john = await registerAndLogin("john", "john@example.com");
      const alice = await registerAndLogin("alice", "alice@example.com");

      const createRes = await app.handle(
        new Request("http://localhost/api/john/items", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeader(john.token),
          },
          body: JSON.stringify({ question: "John's item" }),
        })
      );
      const createData = await createRes.json();

      const res = await app.handle(
        new Request(`http://localhost/api/john/items/${createData.item.id}`, {
          method: "DELETE",
          headers: authHeader(alice.token),
        })
      );

      expect(res.status).toBe(StatusCodes.FORBIDDEN);
    });

    test("returns 404 for non-existent item", async () => {
      const { token } = await registerAndLogin("john", "john@example.com");

      const res = await app.handle(
        new Request("http://localhost/api/john/items/nonexistent-id", {
          method: "DELETE",
          headers: authHeader(token),
        })
      );

      expect(res.status).toBe(StatusCodes.NOT_FOUND);
    });
  });

  describe("Item-Tag Integration", () => {
    test("creates item with tags", async () => {
      const { token } = await registerAndLogin("john", "john@example.com");

      const res = await app.handle(
        new Request("http://localhost/api/john/items", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeader(token),
          },
          body: JSON.stringify({
            question: "How to deploy?",
            tags: ["bun", "deployment"],
          }),
        })
      );

      expect(res.status).toBe(StatusCodes.CREATED);
      const data = await res.json();
      expect(data.item.tags).toHaveLength(2);
      expect(data.item.tags.map((t: Tag) => t.name)).toEqual(["bun", "deployment"]);
    });

    test("creates item without tags returns empty tags array", async () => {
      const { token } = await registerAndLogin("john", "john@example.com");

      const res = await app.handle(
        new Request("http://localhost/api/john/items", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeader(token),
          },
          body: JSON.stringify({
            question: "No tags question",
          }),
        })
      );

      expect(res.status).toBe(StatusCodes.CREATED);
      const data = await res.json();
      expect(data.item.tags).toEqual([]);
    });

    test("updates item tags", async () => {
      const { token } = await registerAndLogin("john", "john@example.com");

      const createRes = await app.handle(
        new Request("http://localhost/api/john/items", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeader(token),
          },
          body: JSON.stringify({
            question: "Question",
            tags: ["old-tag"],
          }),
        })
      );
      const createData = await createRes.json();

      const updateRes = await app.handle(
        new Request(`http://localhost/api/john/items/${createData.item.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...authHeader(token),
          },
          body: JSON.stringify({
            tags: ["new-tag"],
          }),
        })
      );

      expect(updateRes.status).toBe(StatusCodes.OK);
      const updateData = await updateRes.json();
      expect(updateData.item.tags).toHaveLength(1);
      expect(updateData.item.tags[0].name).toBe("new-tag");
    });

    test("removes all tags when updating with empty array", async () => {
      const { token } = await registerAndLogin("john", "john@example.com");

      const createRes = await app.handle(
        new Request("http://localhost/api/john/items", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeader(token),
          },
          body: JSON.stringify({
            question: "Question",
            tags: ["bun"],
          }),
        })
      );
      const createData = await createRes.json();

      const updateRes = await app.handle(
        new Request(`http://localhost/api/john/items/${createData.item.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...authHeader(token),
          },
          body: JSON.stringify({
            tags: [],
          }),
        })
      );

      const updateData = await updateRes.json();
      expect(updateData.item.tags).toEqual([]);
    });

    test("GET single item includes tags", async () => {
      const { token } = await registerAndLogin("john", "john@example.com");

      const createRes = await app.handle(
        new Request("http://localhost/api/john/items", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeader(token),
          },
          body: JSON.stringify({
            question: "Tagged question",
            tags: ["bun"],
          }),
        })
      );
      const createData = await createRes.json();

      const getRes = await app.handle(
        new Request(`http://localhost/api/john/items/${createData.item.id}`)
      );

      const getData = await getRes.json();
      expect(getData.item.tags).toHaveLength(1);
      expect(getData.item.tags[0].name).toBe("bun");
    });

    test("GET list includes tags for each item", async () => {
      const { token } = await registerAndLogin("john", "john@example.com");

      await app.handle(
        new Request("http://localhost/api/john/items", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeader(token),
          },
          body: JSON.stringify({
            question: "Q1",
            tags: ["bun"],
          }),
        })
      );

      const listRes = await app.handle(
        new Request("http://localhost/api/john/items")
      );

      const listData = await listRes.json();
      expect(listData.items[0].tags).toHaveLength(1);
      expect(listData.items[0].tags[0].name).toBe("bun");
    });
  });
});
