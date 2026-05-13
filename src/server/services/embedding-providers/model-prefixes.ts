export interface ModelPrefixes {
  query: string;
  document: string;
}

const EMPTY: ModelPrefixes = { query: '', document: '' };

// Some embedding models are trained with task instruction prefixes and produce
// degraded retrieval quality without them. The pattern is well-known for nomic
// models; other families (e5, bge) use different conventions and would need
// their own entries here when added.
const KNOWN_PREFIXES: Array<{ matches: (model: string) => boolean; prefixes: ModelPrefixes }> = [
  {
    matches: (m) => m.toLowerCase().startsWith('nomic-embed-text'),
    prefixes: { query: 'search_query: ', document: 'search_document: ' },
  },
];

export function getModelPrefixes(model: string): ModelPrefixes {
  for (const rule of KNOWN_PREFIXES) {
    if (rule.matches(model)) return rule.prefixes;
  }
  return EMPTY;
}
