## 1. Install Dependency

- [x] 1.1 Add `simple-git-hooks` as a dev dependency: `bun add -d simple-git-hooks`

## 2. Configure Hooks in package.json

- [x] 2.1 Add `simple-git-hooks` config block to `package.json` with `pre-commit: "bun run lint"` and `pre-push: "bun run build && bun test"`
- [x] 2.2 Add `postinstall` script to `package.json`: `"postinstall": "bunx simple-git-hooks"`

## 3. Register Hooks

- [x] 3.1 Run `bunx simple-git-hooks` to install hooks into `.git/hooks/`
- [x] 3.2 Verify `.git/hooks/pre-commit` and `.git/hooks/pre-push` exist and are executable

## 4. Verify

- [x] 4.1 Run `bun run lint` manually to confirm it passes (pre-commit simulation)
- [x] 4.2 Run `bun run build && bun test` manually to confirm both pass (pre-push simulation)
- [x] 4.3 Make a test commit and confirm pre-commit hook fires and passes
