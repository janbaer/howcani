export function isTabletOrDesktopSize() {
  return window.matchMedia('(min-width: 1024px)').matches;
}
