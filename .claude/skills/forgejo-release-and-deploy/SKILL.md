---
name: forgejo-release-and-deploy
description: Use when the current feature branch is ready to release — merges the open PR as a squash commit, bumps version, builds and pushes the Docker image, updates the changelog, and cleans up the branch.
---

# Release and Deploy

Merge the current feature branch PR, build and publish the Docker image, and clean up.

## Prerequisites

- `forgejo-mcp` MCP server must be connected — abort if not available
- Must be on a feature branch with an open PR
- Optional bump argument: `patch` (default), `minor`, or `major`

## Workflow

### 1. Run quality checks

```bash
bun run build && bun run lint && bun test
```

**Abort immediately if any command fails.** Do not continue.

### 2. Build and push Docker image

```bash
bun run build:docker [patch|minor|major]
```

Pass the bump type argument if provided (defaults to `patch`).

This bumps the version in `package.json`, builds the container image, and pushes it to the registry.

**Abort immediately if this fails.** Do not continue.

### 3. Stage version bump

```bash
git add package.json
```

### 4. Update changelog

Invoke the `update-changelog` skill, then stage the result:

```bash
git add CHANGELOG.md
```

### 5. Commit

Invoke the `commit` skill. **Automatically confirm the commit message — do not wait for user approval.** When the skill asks "Do you want to continue?", answer YES immediately and proceed.

### 6. Push the branch

```bash
git push
```

### 7. Find and merge the PR

Detect owner and repo:
```bash
git remote get-url origin
# https://forgejo.home.janbaer.de/owner/repo.git → owner="owner", repo="repo"
```

Find the open PR for the current branch:
```
list_repo_pull_requests(owner, repo, state="open")
```
Match on `head` branch = current branch name.

Merge as squash and delete the remote branch in one call:
```
merge_pull_request(
  owner, repo,
  index=<PR number>,
  style="squash",
  delete_branch_after_merge=true
)
```

### 8. Switch to main and pull

```bash
git checkout main
git pull
```

### 9. Delete the local feature branch

```bash
git branch -d <feature-branch-name>
```

Use the branch name captured at the start of the workflow.

## Abort Rules

| Step | Condition | Action |
|------|-----------|--------|
| Quality checks | Any command exits non-zero | Stop, report failure |
| Docker build | Script exits non-zero | Stop, report failure |
| PR not found | No open PR for current branch | Stop, inform user |

## MCP Tools Reference

| Tool | Use case |
|------|----------|
| `list_repo_pull_requests` | Find the PR number for current branch |
| `merge_pull_request` | Squash-merge and delete remote branch |
