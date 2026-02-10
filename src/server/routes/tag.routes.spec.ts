import { beforeEach, describe, expect, mock, test } from "bun:test";
import { Elysia } from "elysia";
import { StatusCodes } from "http-status-codes";
import type { Tag, TagWithCount } from "../domain/tag";
import type { TagError } from "../services/tag.service";

type TagResult<T> = { success: true; data: T } | { success: false; error: TagError };

const testUsers = new Map<string, { id: string; username: string }>();
const testTags = new Map<string, Tag>();
const tagItemCounts = new Map<string, number>();
let currentSessionUserId: string | null = null;

function createSuccessResult<T>(data: T): { success: true; data: T } {
  return { success: true, data };
}

function createErrorResult(code: TagError["code"], message: string): { success: false; error: TagError } {
  return { success: false, error: { code, message } };
}

const mockTagService = {
  listTags: mock((username: string): TagResult<TagWithCount[]> => {
    const user = testUsers.get(username);
    if (!user) {
      return createErrorResult("USER_NOT_FOUND", "User not found");
    }
    const tags = Array.from(testTags.values())
      .filter((t) => t.user_id === user.id)
      .map((t) => ({
        ...t,
        item_count: tagItemCounts.get(t.id) ?? 0,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return createSuccessResult(tags);
  }),
  getSuggestions: mock((username: string, prefix: string): TagResult<string[]> => {
    const user = testUsers.get(username);
    if (!user) {
      return createErrorResult("USER_NOT_FOUND", "User not found");
    }
    const suggestions = Array.from(testTags.values())
      .filter((t) => t.user_id === user.id && t.name.toLowerCase().startsWith(prefix.toLowerCase()))
      .map((t) => t.name)
      .sort();
    return createSuccessResult(suggestions);
  }),
  updateTag: mock((tagId: string, data: { name?: string; color?: string }): TagResult<Tag> => {
    if (!currentSessionUserId) {
      throw new Error("No session user ID set");
    }
    const userId = currentSessionUserId;
    const tag = testTags.get(tagId);
    if (!tag || tag.user_id !== userId) {
      return createErrorResult("NOT_FOUND", "Tag not found");
    }

    // Validate name if provided
    if (data.name !== undefined) {
      const trimmedName = data.name.trim();
      if (!trimmedName) {
        return createErrorResult("VALIDATION_ERROR", "Tag name cannot be empty");
      }
      // Check for duplicate (case-insensitive), but allow keeping the same name
      if (trimmedName.toLowerCase() !== tag.name.toLowerCase()) {
        const duplicate = Array.from(testTags.values()).find(
          (t) => t.user_id === userId && t.name.toLowerCase() === trimmedName.toLowerCase(),
        );
        if (duplicate) {
          return createErrorResult("DUPLICATE_TAG", `Tag '${trimmedName}' already exists`);
        }
      }
    }

    // Validate color format if provided
    if (data.color !== undefined) {
      const hexRegex = /^[0-9a-fA-F]{6}$/;
      if (!hexRegex.test(data.color)) {
        return createErrorResult("VALIDATION_ERROR", "Invalid color format");
      }
    }

    // Update tag
    const updated: Tag = {
      ...tag,
      name: data.name?.trim() ?? tag.name,
      color: data.color ?? tag.color,
    };
    testTags.set(tagId, updated);
    return createSuccessResult(updated);
  }),
  deleteTag: mock((tagId: string): TagResult<{ deleted: true }> => {
    if (!currentSessionUserId) {
      throw new Error("No session user ID set");
    }
    const userId = currentSessionUserId;
    const tag = testTags.get(tagId);
    if (!tag || tag.user_id !== userId) {
      return createErrorResult("NOT_FOUND", "Tag not found");
    }
    // Allow deletion even if tag is in use (cascade delete)
    testTags.delete(tagId);
    tagItemCounts.delete(tagId);
    return createSuccessResult({ deleted: true });
  }),
};

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
      return {
        userId: user.id,
        username: user.username,
        email: `${user.username}@example.com`,
      };
    }
    return null;
  }),
};

mock.module("../services/tag.service", () => ({
  tagService: mockTagService,
}));

mock.module("../services/session", () => ({
  getSession: mock(() => ({
    tagService: mockTagService,
    itemService: {},
    userId: currentSessionUserId,
    username: "",
  })),
  initSession: mock((userId: string, username: string) => {
    currentSessionUserId = userId;
    return { userId, username, tagService: mockTagService, itemService: {} };
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
      return {
        userId: user.id,
        username: user.username,
        email: `${user.username}@example.com`,
      };
    }
    return null;
  },
}));

import { authPlugin } from "../middleware";
import { authRoutes } from "./auth.routes";
import { tagRoutes } from "./tag.routes";

const app = new Elysia().use(authPlugin).group("/api", (app) => app.use(authRoutes).use(tagRoutes));

async function registerAndLogin(username: string, email: string): Promise<{ token: string; userId: string }> {
  const registerRes = await app.handle(
    new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        email,
        password: "secure123",
      }),
    }),
  );
  const registerData = await registerRes.json();
  return { token: registerData.token, userId: registerData.user.id };
}

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

function createTag(userId: string, name: string, itemCount: number = 0): Tag {
  const tag: Tag = {
    id: crypto.randomUUID(),
    user_id: userId,
    name,
    color: "0e8a16",
    created_at: new Date().toISOString(),
  };
  testTags.set(tag.id, tag);
  if (itemCount > 0) {
    tagItemCounts.set(tag.id, itemCount);
  }
  return tag;
}

describe("Tag Routes", () => {
  beforeEach(() => {
    testUsers.clear();
    testTags.clear();
    tagItemCounts.clear();
    currentSessionUserId = null;
  });

  describe("GET /api/:username/tags - List Tags", () => {
    test("returns tags with item counts", async () => {
      const { userId } = await registerAndLogin("john", "john@example.com");
      createTag(userId, "bun", 1);

      const res = await app.handle(new Request("http://localhost/api/john/tags"));

      expect(res.status).toBe(StatusCodes.OK);
      const data = await res.json();
      expect(data.tags).toHaveLength(1);
      expect(data.tags[0].name).toBe("bun");
      expect(data.tags[0].item_count).toBe(1);
    });

    test("returns tags without authentication", async () => {
      const { userId } = await registerAndLogin("john", "john@example.com");
      createTag(userId, "bun");

      const res = await app.handle(new Request("http://localhost/api/john/tags"));

      expect(res.status).toBe(StatusCodes.OK);
      const data = await res.json();
      expect(data.tags).toHaveLength(1);
    });

    test("returns 404 for non-existent user", async () => {
      const res = await app.handle(new Request("http://localhost/api/nobody/tags"));

      expect(res.status).toBe(StatusCodes.NOT_FOUND);
    });

    test("excludes other users' tags", async () => {
      const john = await registerAndLogin("john", "john@example.com");
      const alice = await registerAndLogin("alice", "alice@example.com");
      createTag(john.userId, "bun");
      createTag(alice.userId, "python");

      const res = await app.handle(new Request("http://localhost/api/john/tags"));

      const data = await res.json();
      expect(data.tags).toHaveLength(1);
      expect(data.tags[0].name).toBe("bun");
    });

    test("orders by name alphabetically", async () => {
      const { userId } = await registerAndLogin("john", "john@example.com");
      createTag(userId, "zsh");
      createTag(userId, "bun");
      createTag(userId, "networking");

      const res = await app.handle(new Request("http://localhost/api/john/tags"));

      const data = await res.json();
      expect(data.tags.map((t: { name: string }) => t.name)).toEqual(["bun", "networking", "zsh"]);
    });
  });

  describe("GET /api/:username/tags/suggestions - Tag Suggestions", () => {
    test("returns matching tags by prefix", async () => {
      const { userId } = await registerAndLogin("john", "john@example.com");
      createTag(userId, "networking");
      createTag(userId, "network-config");
      createTag(userId, "bun");

      const res = await app.handle(new Request("http://localhost/api/john/tags/suggestions?q=net"));

      expect(res.status).toBe(StatusCodes.OK);
      const data = await res.json();
      expect(data.suggestions).toEqual(["network-config", "networking"]);
    });

    test("returns empty array for no matches", async () => {
      const { userId } = await registerAndLogin("john", "john@example.com");
      createTag(userId, "bun");

      const res = await app.handle(new Request("http://localhost/api/john/tags/suggestions?q=xyz"));

      expect(res.status).toBe(StatusCodes.OK);
      const data = await res.json();
      expect(data.suggestions).toEqual([]);
    });

    test("returns 404 for non-existent user", async () => {
      const res = await app.handle(new Request("http://localhost/api/nobody/tags/suggestions?q=test"));

      expect(res.status).toBe(StatusCodes.NOT_FOUND);
    });

    test("works without authentication", async () => {
      const { userId } = await registerAndLogin("john", "john@example.com");
      createTag(userId, "bun");

      const res = await app.handle(new Request("http://localhost/api/john/tags/suggestions?q=b"));

      expect(res.status).toBe(StatusCodes.OK);
      const data = await res.json();
      expect(data.suggestions).toEqual(["bun"]);
    });
  });

  describe("DELETE /api/:username/tags/:id - Delete Tag", () => {
    test("deletes unused tag when authenticated", async () => {
      const { token, userId } = await registerAndLogin("john", "john@example.com");
      const tag = createTag(userId, "old-tag");

      const res = await app.handle(
        new Request(`http://localhost/api/john/tags/${tag.id}`, {
          method: "DELETE",
          headers: authHeader(token),
        }),
      );

      expect(res.status).toBe(StatusCodes.OK);
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    test("returns 401 when not authenticated", async () => {
      const { userId } = await registerAndLogin("john", "john@example.com");
      const tag = createTag(userId, "test");

      const res = await app.handle(
        new Request(`http://localhost/api/john/tags/${tag.id}`, {
          method: "DELETE",
        }),
      );

      expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
    });

    test("returns 403 when username mismatch", async () => {
      const john = await registerAndLogin("john", "john@example.com");
      const alice = await registerAndLogin("alice", "alice@example.com");
      const tag = createTag(john.userId, "test");

      const res = await app.handle(
        new Request(`http://localhost/api/john/tags/${tag.id}`, {
          method: "DELETE",
          headers: authHeader(alice.token),
        }),
      );

      expect(res.status).toBe(StatusCodes.FORBIDDEN);
    });

    test("allows deletion of tag in use (cascade delete)", async () => {
      const { token, userId } = await registerAndLogin("john", "john@example.com");
      const tag = createTag(userId, "bun", 1);

      const res = await app.handle(
        new Request(`http://localhost/api/john/tags/${tag.id}`, {
          method: "DELETE",
          headers: authHeader(token),
        }),
      );

      expect(res.status).toBe(StatusCodes.OK);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(testTags.has(tag.id)).toBe(false);
    });

    test("returns 404 for non-existent tag", async () => {
      const { token } = await registerAndLogin("john", "john@example.com");

      const res = await app.handle(
        new Request("http://localhost/api/john/tags/nonexistent", {
          method: "DELETE",
          headers: authHeader(token),
        }),
      );

      expect(res.status).toBe(StatusCodes.NOT_FOUND);
    });
  });

  describe("PUT /api/:username/tags/:id - Update Tag", () => {
    test("updates tag name when authenticated", async () => {
      const { token, userId } = await registerAndLogin("john", "john@example.com");
      const tag = createTag(userId, "bun");

      const res = await app.handle(
        new Request(`http://localhost/api/john/tags/${tag.id}`, {
          method: "PUT",
          headers: { ...authHeader(token), "Content-Type": "application/json" },
          body: JSON.stringify({ name: "bun-runtime" }),
        }),
      );

      expect(res.status).toBe(StatusCodes.OK);
      const data = await res.json();
      expect(data.tag.name).toBe("bun-runtime");
      expect(data.tag.color).toBe("0e8a16"); // unchanged
    });

    test("updates tag color when authenticated", async () => {
      const { token, userId } = await registerAndLogin("john", "john@example.com");
      const tag = createTag(userId, "bun");

      const res = await app.handle(
        new Request(`http://localhost/api/john/tags/${tag.id}`, {
          method: "PUT",
          headers: { ...authHeader(token), "Content-Type": "application/json" },
          body: JSON.stringify({ color: "ff5722" }),
        }),
      );

      expect(res.status).toBe(StatusCodes.OK);
      const data = await res.json();
      expect(data.tag.name).toBe("bun"); // unchanged
      expect(data.tag.color).toBe("ff5722");
    });

    test("updates both name and color", async () => {
      const { token, userId } = await registerAndLogin("john", "john@example.com");
      const tag = createTag(userId, "bun");

      const res = await app.handle(
        new Request(`http://localhost/api/john/tags/${tag.id}`, {
          method: "PUT",
          headers: { ...authHeader(token), "Content-Type": "application/json" },
          body: JSON.stringify({ name: "TypeScript", color: "2196f3" }),
        }),
      );

      expect(res.status).toBe(StatusCodes.OK);
      const data = await res.json();
      expect(data.tag.name).toBe("TypeScript");
      expect(data.tag.color).toBe("2196f3");
    });

    test("returns 401 when not authenticated", async () => {
      const { userId } = await registerAndLogin("john", "john@example.com");
      const tag = createTag(userId, "test");

      const res = await app.handle(
        new Request(`http://localhost/api/john/tags/${tag.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "updated" }),
        }),
      );

      expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
    });

    test("returns 403 when username mismatch", async () => {
      const john = await registerAndLogin("john", "john@example.com");
      const alice = await registerAndLogin("alice", "alice@example.com");
      const tag = createTag(john.userId, "test");

      const res = await app.handle(
        new Request(`http://localhost/api/john/tags/${tag.id}`, {
          method: "PUT",
          headers: { ...authHeader(alice.token), "Content-Type": "application/json" },
          body: JSON.stringify({ name: "updated" }),
        }),
      );

      expect(res.status).toBe(StatusCodes.FORBIDDEN);
    });

    test("returns 404 for non-existent tag", async () => {
      const { token } = await registerAndLogin("john", "john@example.com");

      const res = await app.handle(
        new Request("http://localhost/api/john/tags/nonexistent", {
          method: "PUT",
          headers: { ...authHeader(token), "Content-Type": "application/json" },
          body: JSON.stringify({ name: "updated" }),
        }),
      );

      expect(res.status).toBe(StatusCodes.NOT_FOUND);
    });

    test("returns 400 for duplicate tag name (case-insensitive)", async () => {
      const { token, userId } = await registerAndLogin("john", "john@example.com");
      createTag(userId, "typescript");
      const tag = createTag(userId, "bun");

      const res = await app.handle(
        new Request(`http://localhost/api/john/tags/${tag.id}`, {
          method: "PUT",
          headers: { ...authHeader(token), "Content-Type": "application/json" },
          body: JSON.stringify({ name: "TypeScript" }),
        }),
      );

      expect(res.status).toBe(StatusCodes.BAD_REQUEST);
      const data = await res.json();
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    test("allows keeping the same name with different case", async () => {
      const { token, userId } = await registerAndLogin("john", "john@example.com");
      const tag = createTag(userId, "bun");

      const res = await app.handle(
        new Request(`http://localhost/api/john/tags/${tag.id}`, {
          method: "PUT",
          headers: { ...authHeader(token), "Content-Type": "application/json" },
          body: JSON.stringify({ name: "BUN" }),
        }),
      );

      expect(res.status).toBe(StatusCodes.OK);
      const data = await res.json();
      expect(data.tag.name).toBe("BUN");
    });

    test("returns 400 for invalid color format", async () => {
      const { token, userId } = await registerAndLogin("john", "john@example.com");
      const tag = createTag(userId, "bun");

      const res = await app.handle(
        new Request(`http://localhost/api/john/tags/${tag.id}`, {
          method: "PUT",
          headers: { ...authHeader(token), "Content-Type": "application/json" },
          body: JSON.stringify({ color: "#ff5722" }), // # prefix not allowed
        }),
      );

      expect(res.status).toBe(StatusCodes.BAD_REQUEST);
      const data = await res.json();
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    test("returns 400 for empty tag name", async () => {
      const { token, userId } = await registerAndLogin("john", "john@example.com");
      const tag = createTag(userId, "bun");

      const res = await app.handle(
        new Request(`http://localhost/api/john/tags/${tag.id}`, {
          method: "PUT",
          headers: { ...authHeader(token), "Content-Type": "application/json" },
          body: JSON.stringify({ name: "  " }),
        }),
      );

      expect(res.status).toBe(StatusCodes.BAD_REQUEST);
      const data = await res.json();
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });
  });
});
