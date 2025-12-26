import { sveltePlugin } from "./svelte-plugin";
import { $ } from "bun";

const isProd = process.env.NODE_ENV === "production";

console.log(`Building for ${isProd ? "production" : "development"}...`);

// Ensure dist directory exists
await $`mkdir -p dist`.quiet();

// Build CSS with Tailwind
console.log("Building CSS...");
await $`bunx tailwindcss -i ./src/client/styles/app.css -o ./dist/main.css ${isProd ? "--minify" : ""}`.quiet();

// Build JavaScript/Svelte
console.log("Building JavaScript...");
const result = await Bun.build({
  entrypoints: ["./src/client/main.ts"],
  outdir: "./dist",
  target: "browser",
  minify: isProd,
  sourcemap: isProd ? "none" : "external",
  splitting: true,
  naming: "[name].[ext]",
  define: {
    "import.meta.env.DEV": isProd ? "false" : "true",
  },
  plugins: [
    sveltePlugin({
      development: !isProd,
    }),
  ],
});

if (!result.success) {
  console.error("Build failed:");
  for (const log of result.logs) {
    console.error(log);
  }
  process.exit(1);
}

console.log("Build successful!");
console.log(`Output files:`);
for (const output of result.outputs) {
  const size = (output.size / 1024).toFixed(2);
  console.log(`  ${output.path} (${size} KB)`);
}
