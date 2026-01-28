import { describe, test, expect, beforeEach, mock } from "bun:test";
import { Elysia } from "elysia";
import { StatusCodes } from "http-status-codes";
import type { TagWithCount, Tag } from "../domain/tag";
import type { TagError } from "../services/tag.service";

type TagResult<T> = { success: true; data: T } | { success: false; error: TagError };

const testUsers = new Map<string, { id: string; username: string }>();
const testTags = new Map<string, Tag>();
const tagItemCounts = new Map<string, number>();

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
  deleteTag: mock((tagId: string, userId: string): TagResult<{ deleted: true }> => {
    const tag = testTags.get(tagId);
    if (!tag || tag.user_id !== userId) {
      return createErrorResult("NOT_FOUND", "Tag not found");
    }
    const itemCount = tagItemCounts.get(tagId) ?? 0;
    if (itemCount > 0) {
      return createErrorResult("TAG_IN_USE", "Cannot delete tag in use");
    }
    testTags.delete(tagId);
    return createSuccessResult({ deleted: true });
  }),
};

const mockAuthService = {
  register: mock(async (input: { username: string; email: string; password: string }) => {
    const userId = crypto.randomUUID();
    testUsers.set(input.username, { id: userId, username: input.username });
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
      return { userId: user.id, username: user.username, email: `${user.username}@example.com` };
    }
    return null;
  }),
};

mock.module("../services/tag.service", () => ({
  tagService: mockTagService,
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

import { tagRoutes } from "./tag.routes";
import { authRoutes } from "./auth.routes";
import { authPlugin } from "../middleware";

const app = new Elysia()
  .use(authPlugin)
  .group("/api", (app) => app.use(authRoutes).use(tagRoutes));

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
  });

  describe("GET /api/:username/tags - List Tags", () => {
    test("returns tags with item counts", async () => {
      const { userId } = await registerAndLogin("john", "john@example.com");
      createTag(userId, "bun", 1);

      const res = await app.handle(
        new Request("http://localhost/api/john/tags")
      );

      expect(res.status).toBe(StatusCodes.OK);
      const data = await res.json();
      expect(data.tags).toHaveLength(1);
      expect(data.tags[0].name).toBe("bun");
      expect(data.tags[0].item_count).toBe(1);
    });

    test("returns tags without authentication", async () => {
      const { userId } = await registerAndLogin("john", "john@example.com");
      createTag(userId, "bun");

      const res = await app.handle(
        new Request("http://localhost/api/john/tags")
      );

      expect(res.status).toBe(StatusCodes.OK);
      const data = await res.json();
      expect(data.tags).toHaveLength(1);
    });

    test("returns 404 for non-existent user", async () => {
      const res = await app.handle(
        new Request("http://localhost/api/nobody/tags")
      );

      expect(res.status).toBe(StatusCodes.NOT_FOUND);
    });

    test("excludes other users' tags", async () => {
      const john = await registerAndLogin("john", "john@example.com");
      const alice = await registerAndLogin("alice", "alice@example.com");
      createTag(john.userId, "bun");
      createTag(alice.userId, "python");

      const res = await app.handle(
        new Request("http://localhost/api/john/tags")
      );

      const data = await res.json();
      expect(data.tags).toHaveLength(1);
      expect(data.tags[0].name).toBe("bun");
    });

    test("orders by name alphabetically", async () => {
      const { userId } = await registerAndLogin("john", "john@example.com");
      createTag(userId, "zsh");
      createTag(userId, "bun");
      createTag(userId, "networking");

      const res = await app.handle(
        new Request("http://localhost/api/john/tags")
      );

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

      const res = await app.handle(
        new Request("http://localhost/api/john/tags/suggestions?q=net")
      );

      expect(res.status).toBe(StatusCodes.OK);
      const data = await res.json();
      expect(data.suggestions).toEqual(["network-config", "networking"]);
    });

    test("returns empty array for no matches", async () => {
      const { userId } = await registerAndLogin("john", "john@example.com");
      createTag(userId, "bun");

      const res = await app.handle(
        new Request("http://localhost/api/john/tags/suggestions?q=xyz")
      );

      expect(res.status).toBe(StatusCodes.OK);
      const data = await res.json();
      expect(data.suggestions).toEqual([]);
    });

    test("returns 404 for non-existent user", async () => {
      const res = await app.handle(
        new Request("http://localhost/api/nobody/tags/suggestions?q=test")
      );

      expect(res.status).toBe(StatusCodes.NOT_FOUND);
    });

    test("works without authentication", async () => {
      const { userId } = await registerAndLogin("john", "john@example.com");
      createTag(userId, "bun");

      const res = await app.handle(
        new Request("http://localhost/api/john/tags/suggestions?q=b")
      );

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
        })
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
        })
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
        })
      );

      expect(res.status).toBe(StatusCodes.FORBIDDEN);
    });

    test("returns 409 when tag is in use", async () => {
      const { token, userId } = await registerAndLogin("john", "john@example.com");
      const tag = createTag(userId, "bun", 1);

      const res = await app.handle(
        new Request(`http://localhost/api/john/tags/${tag.id}`, {
          method: "DELETE",
          headers: authHeader(token),
        })
      );

      expect(res.status).toBe(StatusCodes.CONFLICT);
      const data = await res.json();
      expect(data.error.message).toBe("Cannot delete tag in use");
    });

    test("returns 404 for non-existent tag", async () => {
      const { token } = await registerAndLogin("john", "john@example.com");

      const res = await app.handle(
        new Request("http://localhost/api/john/tags/nonexistent", {
          method: "DELETE",
          headers: authHeader(token),
        })
      );

      expect(res.status).toBe(StatusCodes.NOT_FOUND);
    });
  });
});
