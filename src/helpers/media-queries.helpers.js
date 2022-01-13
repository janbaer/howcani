export function isTabletOrDesktopSize() {
  return window.matchMedia('(min-width: 1024px)').matches;
}

export function isMinIPadPortraitSize() {
  return window.matchMedia('(min-width: 768px)').matches;
}
