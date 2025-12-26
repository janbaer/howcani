// Simple History API router for Svelte 5

let _currentPath = window.location.pathname;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    _currentPath = window.location.pathname;
    notifyListeners();
  });
}

export function navigate(path: string) {
  if (path !== _currentPath) {
    history.pushState(null, "", path);
    _currentPath = path;
    notifyListeners();
  }
}

export function getCurrentPath(): string {
  return _currentPath;
}

export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function link(node: HTMLAnchorElement) {
  function handleClick(e: MouseEvent) {
    const href = node.getAttribute("href");
    if (href?.startsWith("/") && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      e.preventDefault();
      navigate(href);
    }
  }

  node.addEventListener("click", handleClick);

  return {
    destroy() {
      node.removeEventListener("click", handleClick);
    },
  };
}
