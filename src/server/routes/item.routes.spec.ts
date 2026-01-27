import { describe, test, expect, beforeEach, beforeAll } from "bun:test";
import { Elysia } from "elysia";
import { StatusCodes } from "http-status-codes";
import { db } from "../db/database";
import { runMigrations } from "../db/migrations";
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
  beforeAll(() => {
    db.exec("DROP TABLE IF EXISTS items");
    db.exec("DROP TABLE IF EXISTS users");
    db.run("PRAGMA user_version = 0");
    runMigrations();
  });

  beforeEach(() => {
    db.exec("DELETE FROM items");
    db.exec("DELETE FROM users");
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

      // Verify item is deleted
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
});
