## 1. JWT Secret Validation

- [x] 1.1 Remove hardcoded fallback from `src/server/auth/jwt.ts` and throw an error if `HOWCANI_JWT_SECRET` is not set or is empty
- [x] 1.2 Update existing JWT tests to set `HOWCANI_JWT_SECRET` in test environment if needed

## 2. Docker Compose Configuration

- [x] 2.1 Add `env_file: .env` directive to the service in `docker-compose.yml`
- [x] 2.2 Add `HOWCANI_JWT_SECRET` to the `environment` section in `docker-compose.yml`

## 3. Environment Documentation

- [x] 3.1 Add `HOWCANI_JWT_SECRET` to `.env.example` with generation command and documentation
