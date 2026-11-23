export const AI_PROVIDER = Symbol('AI_PROVIDER');

export interface AiExtractionCallResult {
  raw: unknown;
  tokensInput: number;
  tokensOutput: number;
  model: string;
}

export interface AiGenerationCallResult {
  text: string;
  tokensInput: number;
  tokensOutput: number;
  model: string;
}

export interface AiProvider {
  extract(text: string): Promise<AiExtractionCallResult>;
  /**
   * Free-text generation (as opposed to `extract`'s schema-constrained JSON
   * output) - used by the writing wizard to draft project sections and
   * answer questions about an edital.
   */
  generateText(
    systemPrompt: string,
    userContent: string,
  ): Promise<AiGenerationCallResult>;
}
