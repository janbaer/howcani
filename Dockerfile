# syntax=docker/dockerfile:1

# Bun version (can be overridden with --build-arg BUN_VERSION=x.y.z)
ARG BUN_VERSION=1.3.6

# Build stage
FROM oven/bun:${BUN_VERSION} AS builder

WORKDIR /build

# Copy package files for dependency installation
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the application binary
RUN bun build src/server/index.ts --target=bun --outdir=dist

# Runtime stage
ARG BUN_VERSION=1.3.6
FROM oven/bun:${BUN_VERSION}-alpine AS runtime

WORKDIR /app

# Copy the compiled binary from builder
COPY --from=builder /build/dist/index.js ./

# Copy necessary runtime files
COPY --from=builder /build/package.json ./

# Set default environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose the application port
EXPOSE 3000

# Create non-root user and group
RUN addgroup -g 1000 howcani && \
    adduser -D -u 1000 -G howcani howcani && \
    mkdir -p /data && \
    chown -R howcani:howcani /app /data

# Switch to non-root user
USER howcani:howcani

# Run the compiled binary
CMD ["bun", "run", "index.js"]
