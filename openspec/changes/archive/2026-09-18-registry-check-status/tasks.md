## 1. Workflow

- [x] 1.1 Replace the check step with the package API request and a status branch
- [x] 1.2 Gate the Docker CLI install and the login on the check result

## 2. Verify

- [x] 2.1 Probed 200, 404 and an unreachable host against the real instance
- [x] 2.2 YAML lint, `bun run lint`
- [ ] 2.3 Runner check only possible after the merge: `workflow_dispatch` uses the workflow file of the ref it runs on, and the branch gate skips feature branches, so the new check first runs when it is on `main`
