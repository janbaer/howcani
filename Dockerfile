# syntax=docker/dockerfile:1

# Bun version (can be overridden with --build-arg BUN_VERSION=x.y.z)
ARG BUN_VERSION=1.3.6

# Build stage
FROM oven/bun:${BUN_VERSION} AS builder

WORKDIR /build

# Copy package files for dependency installation
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code and build scripts
COPY src ./src
COPY tsconfig.json* ./
COPY build-client.ts ./

# Build client-side code
RUN bun run build

# Runtime stage - production dependencies only
FROM oven/bun:${BUN_VERSION}-slim AS runtime

WORKDIR /app

# Copy package files, source, and built assets from builder
COPY --from=builder /build/package.json ./
COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build/src ./src
COPY --from=builder /build/dist ./dist

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

# Run the application with Bun
ENTRYPOINT ["bun", "run", "src/server/index.ts"]
