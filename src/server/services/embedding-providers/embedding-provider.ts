export interface EmbeddingProvider {
  readonly model: string;
  readonly dimension: number;
  readonly maxBatchSize: number;
  embed(text: string): Promise<Float32Array | null>;
  embedBatch(texts: string[]): Promise<Array<Float32Array | null>>;
}
