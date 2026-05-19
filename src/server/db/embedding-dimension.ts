import { getConfig } from '../config/config.service';

export function getEmbeddingDimension(): number {
  return getConfig().embedding.dimension;
}
