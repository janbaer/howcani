## Context

The application uses JWT tokens for authentication, signed with a secret from `process.env.HOWCANI_JWT_SECRET`. The current implementation in `src/server/auth/jwt.ts` falls back to a hardcoded string when the env var is missing. The `docker-compose.yml` does not pass `HOWCANI_JWT_SECRET` to the container and does not reference an `.env` file, making it likely that production deployments run with the known fallback secret.

## Goals / Non-Goals

**Goals:**
- Prevent the application from starting without a properly configured JWT secret
- Ensure `docker-compose.yml` passes `HOWCANI_JWT_SECRET` through to the container
- Ensure `docker-compose.yml` loads variables from `.env`
- Document `HOWCANI_JWT_SECRET` in `.env.example` so operators know it's required

**Non-Goals:**
- Automatic secret generation or rotation
- Changing the JWT algorithm or token structure
- Adding secret management tooling (Vault, SOPS, etc.)

## Decisions

### Fail-fast startup validation

Remove the fallback default from `jwt.ts` and throw an error at module load time if `HOWCANI_JWT_SECRET` is not set. This ensures the server process exits immediately with a clear error message rather than running in an insecure state.

**Alternative considered:** Log a warning but continue — rejected because a warning is easily missed, and the insecure state is too dangerous.

### `env_file` directive in docker-compose.yml

Add `env_file: .env` to the service definition. While Docker Compose automatically loads `.env` for variable substitution in the YAML file itself, it does NOT pass those variables into the container's environment. The `env_file` directive ensures all variables from `.env` are available inside the container.

**Alternative considered:** Listing `HOWCANI_JWT_SECRET` explicitly under `environment:` with `${HOWCANI_JWT_SECRET}` substitution — rejected because it would require setting the variable in the host shell or `.env` anyway, and `env_file` is simpler and covers future variables too.

### Secret generation guidance in .env.example

Include a comment with a `openssl rand` command to generate a secure secret, so operators don't use weak values.

## Risks / Trade-offs

- **Breaking change for existing deployments** → Intentional. Deployments without `HOWCANI_JWT_SECRET` were insecure. The error message will clearly state what to set.
- **Development friction** → Developers must set `HOWCANI_JWT_SECRET` locally. Mitigated by documenting it in `.env.example`.
