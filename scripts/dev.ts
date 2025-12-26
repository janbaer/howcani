import { watch } from "fs";
import { sveltePlugin } from "./svelte-plugin";
import { $ } from "bun";

const CLIENT_DIR = "./src/client";
const DIST_DIR = "./dist";
const WS_PORT = 3001;

// WebSocket clients for live reload
const wsClients = new Set<{ send: (msg: string) => void; close: () => void }>();

async function buildCSS() {
  await $`mkdir -p dist`.quiet();
  await $`bunx tailwindcss -i ./src/client/styles/app.css -o ./dist/main.css`.quiet();
}

async function buildJS() {
  const result = await Bun.build({
    entrypoints: ["./src/client/main.ts"],
    outdir: DIST_DIR,
    target: "browser",
    minify: false,
    sourcemap: "external",
    splitting: true,
    naming: "[name].[ext]",
    define: {
      "import.meta.env.DEV": "true",
    },
    plugins: [
      sveltePlugin({
        development: true,
      }),
    ],
  });

  if (!result.success) {
    console.error("Build failed:");
    for (const log of result.logs) {
      console.error(log);
    }
    return false;
  }
  return true;
}

async function build() {
  console.log("[build] Rebuilding...");
  const start = Date.now();
  await Promise.all([buildCSS(), buildJS()]);
  console.log(`[build] Done in ${Date.now() - start}ms`);
}

function notifyClients() {
  for (const client of wsClients) {
    try {
      client.send("reload");
    } catch {
      wsClients.delete(client);
    }
  }
}

// Start WebSocket server for live reload
const wsServer = Bun.serve({
  port: WS_PORT,
  fetch(req, server) {
    if (server.upgrade(req)) {
      return;
    }
    return new Response("WebSocket server for live reload", { status: 200 });
  },
  websocket: {
    open(ws) {
      wsClients.add(ws);
      console.log(`[live-reload] Client connected (${wsClients.size} total)`);
    },
    close(ws) {
      wsClients.delete(ws);
      console.log(`[live-reload] Client disconnected (${wsClients.size} total)`);
    },
    message() {},
  },
});

console.log(`[live-reload] WebSocket server running on port ${WS_PORT}`);

// Initial build
await build();

// Start the server
console.log("[server] Starting server...");
const server = Bun.spawn(["bun", "run", "--hot", "src/server/index.ts"], {
  stdio: ["inherit", "inherit", "inherit"],
  env: { ...process.env, NODE_ENV: "development" },
});

// Watch for client changes
console.log("[watch] Watching for changes...");
const watcher = watch(CLIENT_DIR, { recursive: true }, async (event, filename) => {
  if (filename) {
    console.log(`[watch] ${filename} changed`);
    await build();
    notifyClients();
  }
});

// Handle shutdown
process.on("SIGINT", () => {
  console.log("\n[dev] Shutting down...");
  watcher.close();
  server.kill();
  wsServer.stop();
  process.exit(0);
});

// Keep process alive
await server.exited;
