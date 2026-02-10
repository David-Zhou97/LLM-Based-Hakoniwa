import Anthropic from '@anthropic-ai/sdk';
import { LLMProvider, LLMRequest, LLMResponse } from './LLMProvider.js';
import { config } from '../config.js';

export class AnthropicProvider implements LLMProvider {
  private client: Anthropic;
  private model: string;

  constructor(model?: string) {
    this.client = new Anthropic({ apiKey: config.anthropicApiKey });
    this.model = model || config.primaryModel;
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: request.maxTokens || config.maxTokensPerResponse,
      temperature: request.temperature ?? 0.8,
      system: request.system,
      messages: request.messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    });

    const textBlock = response.content.find(b => b.type === 'text');
    return {
      content: textBlock ? textBlock.text : '',
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
      },
    };
  }

  async generateJSON<T>(request: LLMRequest): Promise<T> {
    const response = await this.generate({
      ...request,
      temperature: 0.2,
    });

    // Extract JSON from response, handling potential markdown code blocks
    let jsonStr = response.content.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    return JSON.parse(jsonStr) as T;
  }
}
