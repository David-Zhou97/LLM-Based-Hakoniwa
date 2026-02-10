export interface LLMMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface LLMRequest {
  system: string;
  messages: LLMMessage[];
  maxTokens?: number;
  temperature?: number;
}

export interface LLMResponse {
  content: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface LLMProvider {
  generate(request: LLMRequest): Promise<LLMResponse>;
  generateJSON<T>(request: LLMRequest): Promise<T>;
}
