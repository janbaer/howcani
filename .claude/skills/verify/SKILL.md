---
name: verify
description: Run the full quality gate for howcani before marking a task done or creating a PR — lint, build, and tests in sequence.
---

Run the full quality gate in sequence. Stop at the first failure and report the error.

```bash
bun run lint && bun run build && bun test
```

If lint fails: run `bun run lint:fix` to auto-fix, then re-run lint to confirm clean.

Report the result: all-green means ready for PR; otherwise show the first failing step and its output.
