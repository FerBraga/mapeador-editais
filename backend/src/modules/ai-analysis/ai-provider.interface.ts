export const AI_PROVIDER = Symbol('AI_PROVIDER');

export interface AiExtractionCallResult {
  raw: unknown;
  tokensInput: number;
  tokensOutput: number;
  model: string;
}

export interface AiProvider {
  extract(text: string): Promise<AiExtractionCallResult>;
}
