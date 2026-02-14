## 1. Remove redundant build steps

- [x] 1.1 Remove the host-side `bun run build` step (step 3) from `scripts/build-docker.sh`
- [x] 1.2 Remove the `dist/` cleanup step (step 7) from `scripts/build-docker.sh`
- [x] 1.3 Renumber remaining steps and update comments

## 2. Add test step to Docker build

- [x] 2.1 Add `bun test` step to Dockerfile before `bun run build`, copy `bunfig.toml` to builder stage
