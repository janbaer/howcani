# syntax=docker/dockerfile:1

# Bun version (can be overridden with --build-arg BUN_VERSION=x.y.z)
ARG BUN_VERSION=1.3.13

# Build stage
FROM oven/bun:${BUN_VERSION} AS builder

WORKDIR /build

# Copy package files for dependency installation
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code, public assets, and build scripts
COPY src ./src
COPY public ./public
COPY tsconfig.json* ./
COPY bunfig.toml ./
COPY build-client.ts ./

# Run tests before building
RUN bun test

# Build client-side code
RUN bun run build

# Runtime stage - self-contained dist only
FROM oven/bun:${BUN_VERSION}-slim AS runtime

WORKDIR /app

# Copy only the self-contained build output
COPY --from=builder /build/dist ./
COPY --from=builder /build/public ./public

# Copy sqlite-vec native extension (required for semantic search)
COPY --from=builder /build/node_modules/sqlite-vec-linux-x64/vec0.so /app/src/sqlite-vec-linux-x64/vec0.so

# Set default environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose the application port
EXPOSE 3000

# Create data directory and set permissions
RUN mkdir -p /data && \
    chown -R bun:bun /app /data

# Switch to non-root user (bun user is built into the image)
USER bun

# Run the unified server bundle
ENTRYPOINT ["bun", "run", "src/server/index.js"]
