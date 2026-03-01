#!/usr/bin/env bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

REGISTRY="forgejo.home.janbaer.de"
IMAGE_NAME="jan/howcani"
FULL_IMAGE="${REGISTRY}/${IMAGE_NAME}"
API_BASE="https://${REGISTRY}/api/v1"
OWNER="${IMAGE_NAME%%/*}"
IMAGE="${IMAGE_NAME##*/}"

# Auto-detect Docker or Podman
if command -v podman >/dev/null 2>&1; then
  CONTAINER_CMD="podman"
elif command -v docker >/dev/null 2>&1; then
  CONTAINER_CMD="docker"
else
  echo -e "${RED}Error: Neither Docker nor Podman found${NC}"
  exit 1
fi

usage() {
  echo "Usage: $0 [version] [--local-only] [--remote-only] [--dry-run]"
  echo ""
  echo "Delete Docker images older than the given version."
  echo "Defaults to the version in package.json if not specified."
  echo ""
  echo "Options:"
  echo "  version       Semver version to keep (e.g. 3.0.49)"
  echo "  --local-only  Only clean up local images"
  echo "  --remote-only Only clean up remote registry tags"
  echo "  --dry-run     Show what would be deleted without actually deleting"
  exit 0
}

KEEP_VERSION=""
LOCAL_ONLY=false
REMOTE_ONLY=false
DRY_RUN=false

for arg in "$@"; do
  case "$arg" in
    --local-only)  LOCAL_ONLY=true ;;
    --remote-only) REMOTE_ONLY=true ;;
    --dry-run)     DRY_RUN=true ;;
    --help|-h)     usage ;;
    --*)
      echo -e "${RED}Error: Unknown option '${arg}'${NC}"
      usage
      ;;
    *)
      if [ -n "$KEEP_VERSION" ]; then
        echo -e "${RED}Error: Multiple version arguments${NC}"
        exit 1
      fi
      KEEP_VERSION="$arg"
      ;;
  esac
done

if $LOCAL_ONLY && $REMOTE_ONLY; then
  echo -e "${RED}Error: --local-only and --remote-only are mutually exclusive${NC}"
  exit 1
fi

# Resolve version from package.json if not provided
if [ -z "$KEEP_VERSION" ]; then
  if ! command -v bun >/dev/null 2>&1; then
    echo -e "${RED}Error: Bun not found — provide a version explicitly${NC}"
    exit 1
  fi
  KEEP_VERSION=$(bun -p "require('./package.json').version" 2>/dev/null)
  if [ -z "$KEEP_VERSION" ]; then
    echo -e "${RED}Error: Could not read version from package.json${NC}"
    exit 1
  fi
fi

if [[ ! "$KEEP_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo -e "${RED}Error: Invalid version '${KEEP_VERSION}' — expected X.Y.Z${NC}"
  exit 1
fi

# Returns 0 (true) if $1 < $2
semver_lt() {
  IFS='.' read -r a1 a2 a3 <<< "$1"
  IFS='.' read -r b1 b2 b3 <<< "$2"
  if   (( a1 != b1 )); then (( a1 < b1 ))
  elif (( a2 != b2 )); then (( a2 < b2 ))
  else                       (( a3 < b3 ))
  fi
}

echo "Using: $CONTAINER_CMD"
echo "Keeping version: ${KEEP_VERSION} (deleting everything older)"
$DRY_RUN && echo -e "${YELLOW}Dry-run mode — no changes will be made${NC}"
echo ""

# ─── Local cleanup ────────────────────────────────────────────────────────────

if ! $REMOTE_ONLY; then
  echo -e "${BLUE}=== Local images ===${NC}"
  local_deleted=0
  local_kept=0

  while IFS=' ' read -r tag image_id; do
    version="${tag##*:}"
    [[ ! "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] && continue

    if semver_lt "$version" "$KEEP_VERSION"; then
      if $DRY_RUN; then
        echo -e "  ${YELLOW}[dry-run]${NC} Would remove: ${tag} (${image_id})"
      else
        printf "  Removing: %s ... " "$tag"
        if $CONTAINER_CMD rmi --force "$image_id" >/dev/null 2>&1; then
          echo -e "${GREEN}done${NC}"
        else
          echo -e "${YELLOW}skipped (in use or already removed)${NC}"
        fi
      fi
      (( local_deleted++ )) || true
    else
      (( local_kept++ )) || true
    fi
  done < <($CONTAINER_CMD images --format "{{.Repository}}:{{.Tag}} {{.ID}}" 2>/dev/null \
    | grep "^${FULL_IMAGE}:" || true)

  echo -e "  Local: ${local_deleted} image(s) $($DRY_RUN && echo 'to remove' || echo 'removed'), ${local_kept} kept"
  echo ""
fi

# ─── Remote cleanup ───────────────────────────────────────────────────────────

if ! $LOCAL_ONLY; then
  echo -e "${BLUE}=== Remote registry (${REGISTRY}) ===${NC}"

  if [ -z "${FORGEJO_TOKEN:-}" ]; then
    echo -e "${YELLOW}Warning: FORGEJO_TOKEN not set — remote cleanup skipped${NC}"
    echo "Set FORGEJO_TOKEN to enable remote cleanup."
    exit 0
  fi

  page=1
  remote_deleted=0
  remote_kept=0

  while true; do
    url="${API_BASE}/packages/${OWNER}?type=container&q=${IMAGE}&limit=50&page=${page}"
    response=$(curl -sf -H "Authorization: token ${FORGEJO_TOKEN}" "$url") || {
      echo -e "${RED}Error: Failed to fetch package list from Forgejo API${NC}"
      exit 1
    }

    count=$(echo "$response" | gojq 'length')
    [ "$count" -eq 0 ] && break

    while IFS=$'\t' read -r pkg_name version; do
      [ "$pkg_name" != "$IMAGE" ] && continue
      [[ ! "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] && continue

      if semver_lt "$version" "$KEEP_VERSION"; then
        if $DRY_RUN; then
          echo -e "  ${YELLOW}[dry-run]${NC} Would delete remote: ${IMAGE}:${version}"
        else
          printf "  Deleting remote: %s:%s ... " "$IMAGE" "$version"
          http_code=$(curl -sf -o /dev/null -w "%{http_code}" \
            -X DELETE \
            -H "Authorization: token ${FORGEJO_TOKEN}" \
            "${API_BASE}/packages/${OWNER}/container/${IMAGE}/${version}" || echo "000")
          if [ "$http_code" = "204" ] || [ "$http_code" = "200" ]; then
            echo -e "${GREEN}done${NC}"
          else
            echo -e "${YELLOW}failed (HTTP ${http_code})${NC}"
          fi
        fi
        (( remote_deleted++ )) || true
      else
        (( remote_kept++ )) || true
      fi
    done < <(echo "$response" | gojq -r '.[] | [.name, .version] | @tsv')

    (( page++ )) || true
  done

  echo -e "  Remote: ${remote_deleted} tag(s) $($DRY_RUN && echo 'to delete' || echo 'deleted'), ${remote_kept} kept"
  echo ""
fi

echo -e "${GREEN}Done.${NC}"
