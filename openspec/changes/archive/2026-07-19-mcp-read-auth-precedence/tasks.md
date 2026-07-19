## 1. Username resolution

- [x] 1.1 In `server.ts`, replace `usernamePromise` with a tagged resolution (token-authoritative, `X-Username` fallback, invalid-token rejection)
- [x] 1.2 Add an invalid-token error alongside the existing missing-username error; map read tools to the right message

## 2. CORS

- [x] 2.1 Remove `'Access-Control-Allow-Origin': '*'` from `corsHeaders` in `mcp/index.ts`

## 3. Tests

- [x] 3.1 Token overrides `X-Username` (valid token + mismatched header → token's user)
- [x] 3.2 Invalid token + `X-Username` set → rejected, no fallback
- [x] 3.3 OPTIONS `/mcp` response carries no `Access-Control-Allow-Origin`
- [x] 3.4 Update the existing invalid-token test's message assertion

## 4. Docs

- [x] 4.1 Update the README MCP section to document the auth model (public read, token authoritative, invalid token rejected, no wildcard CORS)

## 5. Verify

- [x] 5.1 Run lint, build, tests
- [x] 5.2 Execute the issue's "How to Test" scenarios (unauth read with `X-Username`; CORS on OPTIONS)
