#!/usr/bin/env bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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
    echo "  patch   Increment patch version (1.0.0 -> 1.0.1)"
    echo "  minor   Increment minor version (1.0.0 -> 1.1.0)"
    echo "  major   Increment major version (1.0.0 -> 2.0.0)"
    echo ""
    echo "Examples:"
    echo "  $0 patch"
    echo "  $0 minor"
    exit 1
}

# Check if version bump type is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Version bump type is required${NC}"
    usage
fi

BUMP_TYPE="$1"

if [[ ! "$BUMP_TYPE" =~ ^(patch|minor|major)$ ]]; then
    echo -e "${RED}Error: Invalid bump type '$BUMP_TYPE'${NC}"
    usage
fi

echo "🚀 Starting Docker build and push process..."
echo ""

# Validate prerequisites
echo "🔍 Validating prerequisites..."

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}Error: Docker daemon is not running${NC}"
    echo "Please start Docker and try again"
    exit 1
fi
echo -e "${GREEN}✓${NC} Docker daemon is running"

# Check if Bun is installed
if ! command -v bun >/dev/null 2>&1; then
    echo -e "${RED}Error: Bun is not installed${NC}"
    echo "Please install Bun from https://bun.sh"
    exit 1
fi
echo -e "${GREEN}✓${NC} Bun is installed"

# Check if git working tree is clean
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${RED}Error: Git working tree is not clean${NC}"
    echo "Please commit or stash your changes before building"
    git status --short
    exit 1
fi
echo -e "${GREEN}✓${NC} Git working tree is clean"

# Check registry authentication
if ! docker info 2>&1 | grep -q "${REGISTRY}"; then
    echo -e "${YELLOW}Warning: Not authenticated to ${REGISTRY}${NC}"
    echo "Checking if we can access the registry..."
    if ! docker login "${REGISTRY}" --get-login >/dev/null 2>&1; then
        echo -e "${RED}Error: Not authenticated to registry${NC}"
        echo "Please run: docker login ${REGISTRY}"
        exit 1
    fi
fi
echo -e "${GREEN}✓${NC} Registry authentication verified"

echo ""

# Step 1: Bump version
echo "📦 Bumping version ($BUMP_TYPE)..."
if ! bun run scripts/bump-version.ts "$BUMP_TYPE"; then
    echo -e "${RED}Error: Version bump failed${NC}"
    exit 1
fi
echo ""

# Step 2: Extract version from package.json
VERSION=$(node -p "require('./package.json').version")
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

# Step 3: Build Bun binary
echo "🔨 Building Bun binary..."
if ! bun run build; then
    echo -e "${RED}Error: Bun build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Bun binary built successfully"
echo ""

# Step 4: Build Docker image
echo "🐳 Building Docker image (Bun ${BUN_VERSION})..."
VERSION_TAG="${FULL_IMAGE}:${VERSION}"
if ! docker build --build-arg BUN_VERSION="${BUN_VERSION}" -t "${VERSION_TAG}" .; then
    echo -e "${RED}Error: Docker build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Docker image built: ${VERSION_TAG}"
echo ""

# Step 5: Tag as latest
echo "🏷️  Tagging as latest..."
LATEST_TAG="${FULL_IMAGE}:latest"
if ! docker tag "${VERSION_TAG}" "${LATEST_TAG}"; then
    echo -e "${RED}Error: Docker tag failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Tagged as: ${LATEST_TAG}"
echo ""

# Step 6: Push to registry
echo "📤 Pushing images to registry..."
if ! docker push "${VERSION_TAG}"; then
    echo -e "${RED}Error: Failed to push version tag${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Pushed: ${VERSION_TAG}"

if ! docker push "${LATEST_TAG}"; then
    echo -e "${RED}Error: Failed to push latest tag${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Pushed: ${LATEST_TAG}"
echo ""

# Step 7: Cleanup
echo "🧹 Cleaning up build artifacts..."
if [ -d "dist" ]; then
    rm -rf dist
    echo -e "${GREEN}✓${NC} Removed dist/ directory"
fi
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
