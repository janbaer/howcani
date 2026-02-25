#!/usr/bin/env bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Auto-detect Docker or Podman
if command -v podman >/dev/null 2>&1; then
  CONTAINER_CMD="podman"
  AUTH_FILE="${XDG_RUNTIME_DIR:-$HOME/.config}/containers/auth.json"
elif command -v docker >/dev/null 2>&1; then
  CONTAINER_CMD="docker"
  AUTH_FILE="$HOME/.docker/config.json"
else
  echo -e "${RED}Error: Neither Docker nor Podman found${NC}"
  echo "Please install Docker or Podman"
  exit 1
fi

echo "Using: $CONTAINER_CMD"

# Registry configuration
REGISTRY="forgejo.home.janbaer.de"
IMAGE_NAME="jan/howcani"
FULL_IMAGE="${REGISTRY}/${IMAGE_NAME}"

# Usage message
usage() {
  echo "Usage: $0 [patch|minor|major]"
  echo ""
  echo "Bump version, build Docker image, and push to registry"
  echo ""
  echo "Arguments:"
  echo "  patch   Increment patch version (1.0.0 -> 1.0.1) [default]"
  echo "  minor   Increment minor version (1.0.0 -> 1.1.0)"
  echo "  major   Increment major version (1.0.0 -> 2.0.0)"
  echo ""
  echo "Examples:"
  echo "  $0          # defaults to patch"
  echo "  $0 minor"
  exit 1
}

BUMP_TYPE="${1:-patch}"

if [[ ! "$BUMP_TYPE" =~ ^(patch|minor|major)$ ]]; then
  echo -e "${RED}Error: Invalid bump type '$BUMP_TYPE'${NC}"
  usage
fi

echo "🚀 Starting Docker build and push process..."
echo ""

# Validate prerequisites
echo "🔍 Validating prerequisites..."

# Check if container runtime is running
if ! $CONTAINER_CMD info >/dev/null 2>&1; then
  echo -e "${RED}Error: $CONTAINER_CMD is not running${NC}"
  echo "Please start $CONTAINER_CMD and try again"
  exit 1
fi
echo -e "${GREEN}✓${NC} $CONTAINER_CMD is running"

# Check if Bun is installed
if ! command -v bun >/dev/null 2>&1; then
  echo -e "${RED}Error: Bun is not installed${NC}"
  echo "Please install Bun from https://bun.sh"
  exit 1
fi
echo -e "${GREEN}✓${NC} Bun is installed"

# Check registry authentication
echo "Checking registry authentication..."
if [ ! -f "$AUTH_FILE" ] || ! grep -q "${REGISTRY}" "$AUTH_FILE" 2>/dev/null; then
  if [ -z "${FORGEJO_TOKEN}" ]; then
    echo -e "${RED}Error: Not logged in to ${REGISTRY} and FORGEJO_TOKEN is not set${NC}"
    echo ""
    echo "Set FORGEJO_TOKEN or log in manually:"
    echo "  $CONTAINER_CMD login ${REGISTRY}"
    echo ""
    exit 1
  fi
  echo "Logging in to ${REGISTRY}..."
  if ! echo "${FORGEJO_TOKEN}" | $CONTAINER_CMD login "${REGISTRY}" --username jan --password-stdin; then
    echo -e "${RED}Error: Login to ${REGISTRY} failed${NC}"
    exit 1
  fi
  echo -e "${GREEN}✓${NC} Logged in to ${REGISTRY}"
else
  echo -e "${GREEN}✓${NC} Registry authentication verified"
fi

echo ""

# Step 1: Bump version
echo "📦 Bumping version ($BUMP_TYPE)..."
if ! bun run scripts/bump-version.ts "$BUMP_TYPE"; then
  echo -e "${RED}Error: Version bump failed${NC}"
  exit 1
fi
echo ""

# Step 2: Extract version from package.json
VERSION=$(bun -p "require('./package.json').version")
if [ -z "$VERSION" ]; then
  echo -e "${RED}Error: Could not extract version from package.json${NC}"
  exit 1
fi
echo "📌 Version: $VERSION"

# Extract Bun version for Docker build
BUN_VERSION=$(bun --version)
if [ -z "$BUN_VERSION" ]; then
  echo -e "${RED}Error: Could not determine Bun version${NC}"
  exit 1
fi
echo "📌 Bun version: $BUN_VERSION"
echo ""

# Step 3: Build container image
echo "🐳 Building container image (Bun ${BUN_VERSION})..."
VERSION_TAG="${FULL_IMAGE}:${VERSION}"
if ! env -u SOURCE_DATE_EPOCH $CONTAINER_CMD build --build-arg BUN_VERSION="${BUN_VERSION}" --timestamp "$(date +%s)" -t "${VERSION_TAG}" .; then
  echo -e "${RED}Error: Container build failed${NC}"
  exit 1
fi
echo -e "${GREEN}✓${NC} Container image built: ${VERSION_TAG}"
echo ""

# Step 4: Tag as latest
echo "🏷️  Tagging as latest..."
LATEST_TAG="${FULL_IMAGE}:latest"
if ! $CONTAINER_CMD tag "${VERSION_TAG}" "${LATEST_TAG}"; then
  echo -e "${RED}Error: Tag failed${NC}"
  exit 1
fi
echo -e "${GREEN}✓${NC} Tagged as: ${LATEST_TAG}"
echo ""

# Step 5: Push to registry
echo "📤 Pushing images to registry..."
if ! $CONTAINER_CMD push "${VERSION_TAG}"; then
  echo -e "${RED}Error: Failed to push version tag${NC}"
  exit 1
fi
echo -e "${GREEN}✓${NC} Pushed: ${VERSION_TAG}"

if ! $CONTAINER_CMD push "${LATEST_TAG}"; then
  echo -e "${RED}Error: Failed to push latest tag${NC}"
  exit 1
fi
echo -e "${GREEN}✓${NC} Pushed: ${LATEST_TAG}"
echo ""

# Success message
echo "═══════════════════════════════════════"
echo -e "${GREEN}✨ Build and push completed successfully!${NC}"
echo "═══════════════════════════════════════"
echo ""
echo "📦 Version: ${VERSION}"
echo "🐳 Images pushed:"
echo "   • ${VERSION_TAG}"
echo "   • ${LATEST_TAG}"
echo ""
echo "To deploy, run:"
echo "  docker-compose pull"
echo "  docker-compose up -d"
echo ""
