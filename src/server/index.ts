import { Elysia } from "elysia";

const port = process.env.PORT || 3000;

const app = new Elysia()
  // API routes
  .get("/api/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }))
  // Serve built assets from dist
  .get("/assets/*", async ({ params }) => {
    const filePath = `./dist/${params["*"]}`;
    const file = Bun.file(filePath);

    if (await file.exists()) {
      return new Response(file);
    }
    return new Response("Not found", { status: 404 });
  })
  // Serve static files from public (favicon, etc.)
  .get("/favicon-96x96.png", () => new Response(Bun.file("./public/favicon-96x96.png")))
  .get("/robots.txt", () => new Response(Bun.file("./public/robots.txt")))
  // SPA fallback - serve index.html for all other routes
  .get("*", async () => {
    return new Response(Bun.file("./public/index.html"), {
      headers: { "Content-Type": "text/html" },
    });
  })
  .listen(port);

console.log(`Server running at http://localhost:${port}`);
