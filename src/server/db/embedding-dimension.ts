const DEFAULT_DIMENSION = 1536;

export function getEmbeddingDimension(): number {
  const raw = process.env.EMBEDDING_DIMENSION;
  if (!raw) return DEFAULT_DIMENSION;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new RangeError(`Invalid EMBEDDING_DIMENSION="${raw}" — must be a positive integer`);
  }
  return parsed;
}
