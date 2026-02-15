let isOpen = $state(false);
let isAvailable = $state(false);

export function toggleTagOverlay() {
  isOpen = !isOpen;
}

export function closeTagOverlay() {
  isOpen = false;
}

export function setTagOverlayAvailable(available: boolean) {
  isAvailable = available;
  if (!available) isOpen = false;
}

export function getTagOverlayState() {
  return {
    get isOpen() {
      return isOpen;
    },
    get isAvailable() {
      return isAvailable;
    },
  };
}
