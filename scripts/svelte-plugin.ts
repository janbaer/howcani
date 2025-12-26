import { compile } from "svelte/compiler";
import type { BunPlugin } from "bun";

interface SveltePluginOptions {
  development?: boolean;
}

export function sveltePlugin(options: SveltePluginOptions = {}): BunPlugin {
  const { development = false } = options;

  return {
    name: "svelte",
    setup(build) {
      build.onLoad({ filter: /\.svelte$/ }, async (args) => {
        const source = await Bun.file(args.path).text();

        try {
          const result = compile(source, {
            filename: args.path,
            generate: "client",
            dev: development,
            css: "injected",
          });

          if (result.warnings.length > 0) {
            for (const warning of result.warnings) {
              console.warn(`[svelte] ${args.path}: ${warning.message}`);
            }
          }

          return {
            contents: result.js.code,
            loader: "js",
          };
        } catch (error) {
          const err = error as Error;
          throw new Error(`Failed to compile ${args.path}: ${err.message}`);
        }
      });
    },
  };
}
