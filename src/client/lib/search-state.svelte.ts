let _searchQuery = $state('');

export function getSearchQuery(): string {
  return _searchQuery;
}

export function setSearchQuery(q: string) {
  _searchQuery = q;
}

export function persistSearch(username: string, search: string) {
  try {
    const key = `howcani_filter_${username}`;
    const raw = localStorage.getItem(key);
    const stored = raw ? JSON.parse(raw) : { tags: [], search: '' };
    localStorage.setItem(key, JSON.stringify({ ...stored, search }));
  } catch (e) {
    console.warn('Failed to persist search state:', e);
  }
}
