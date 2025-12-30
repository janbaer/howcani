import { Elysia } from "elysia";
import { runMigrations } from "./db";
import {
  authRoutes,
  userRoutes,
  projectRoutes,
  categoryRoutes,
  itemRoutes,
  searchRoutes,
} from "./routes";
import index from "../index.html";

runMigrations();

const api = new Elysia().group("/api", (app) =>
  app
    .use(authRoutes)
    .use(userRoutes)
    .use(projectRoutes)
    .use(categoryRoutes)
    .use(itemRoutes)
    .use(searchRoutes)
    .get("/health", () => ({
      status: "ok",
      timestamp: new Date().toISOString(),
    }))
);

const isDev = process.env.NODE_ENV !== "production";

export default {
  port: process.env.PORT || 3000,

  routes: {
    "/": index,
  },

  async fetch(req: Request) {
    const url = new URL(req.url);

    // API routes → Elysia
    if (url.pathname.startsWith("/api")) {
      return api.fetch(req);
    }

    // Static files from public
    if (url.pathname === "/favicon.png" || url.pathname === "/robots.txt") {
      const file = Bun.file(`./public${url.pathname}`);
      if (await file.exists()) {
        return new Response(file);
      }
    }

    // SPA fallback
    return new Response(index as unknown as BodyInit, {
      headers: { "Content-Type": "text/html" },
    });
  },

  development: isDev,
};
