// Dynamic History API router for Svelte 5
// Supports parameterized route segments like /:username/items/:id

export interface Route {
  pattern: string;
  component: unknown;
}

export interface RouteMatch {
  component: unknown;
  params: Record<string, string>;
  query: Record<string, string>;
}

interface CompiledRoute {
  pattern: string;
  regex: RegExp;
  paramNames: string[];
  component: unknown;
}

let _routes: CompiledRoute[] = [];
let _currentPath = $state(window.location.pathname);
let _currentQuery = $state(parseQuery(window.location.search));
const listeners = new Set<() => void>();

function notifyListeners() {
  for (const fn of listeners) {
    fn();
  }
}

function parseQuery(search: string): Record<string, string> {
  const params: Record<string, string> = {};
  const searchParams = new URLSearchParams(search);
  for (const [key, value] of searchParams) {
    params[key] = value;
  }
  return params;
}

function compileRoute(pattern: string, component: unknown): CompiledRoute {
  const paramNames: string[] = [];
  const regexStr = pattern
    .split('/')
    .map((segment) => {
      if (segment.startsWith(':')) {
        paramNames.push(segment.slice(1));
        return '/([^/]+)';
      }
      return segment ? `/${segment}` : '';
    })
    .join('');

  return {
    pattern,
    regex: new RegExp(`^${regexStr || '/'}$`),
    paramNames,
    component,
  };
}

export function setRoutes(routes: Route[]) {
  // Sort: static routes first (more specific), then by segment count descending
  const sorted = [...routes].sort((a, b) => {
    const aHasParams = a.pattern.includes(':');
    const bHasParams = b.pattern.includes(':');
    if (aHasParams !== bHasParams) return aHasParams ? 1 : -1;
    return b.pattern.split('/').length - a.pattern.split('/').length;
  });
  _routes = sorted.map((r) => compileRoute(r.pattern, r.component));
}

export function matchRoute(path: string): RouteMatch | null {
  for (const route of _routes) {
    const match = route.regex.exec(path);
    if (match) {
      const params: Record<string, string> = {};
      route.paramNames.forEach((name, i) => {
        params[name] = decodeURIComponent(match[i + 1]);
      });
      return { component: route.component, params, query: _currentQuery };
    }
  }
  return null;
}

export function navigate(path: string) {
  const [pathname, search] = path.split('?');
  const newPath = pathname || '/';
  const newQuery = parseQuery(search ? `?${search}` : '');

  if (newPath !== _currentPath || JSON.stringify(newQuery) !== JSON.stringify(_currentQuery)) {
    const pathChanged = newPath !== _currentPath;
    history.pushState(null, '', path);
    _currentPath = newPath;
    _currentQuery = newQuery;
    notifyListeners();
    if (pathChanged) {
      window.scrollTo(0, 0);
    }
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
    const href = node.getAttribute('href');
    if (href?.startsWith('/') && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      e.preventDefault();
      navigate(href);
    }
  }

  node.addEventListener('click', handleClick);

  return {
    destroy() {
      node.removeEventListener('click', handleClick);
    },
  };
}

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    _currentPath = window.location.pathname;
    _currentQuery = parseQuery(window.location.search);
    notifyListeners();
  });
}
