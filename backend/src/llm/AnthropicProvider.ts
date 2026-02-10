import Anthropic from '@anthropic-ai/sdk';
import { LLMProvider, LLMRequest, LLMResponse } from './LLMProvider.js';
import { config } from '../config.js';

export class AnthropicProvider implements LLMProvider {
  private client: Anthropic;
  private model: string;

  constructor(model?: string) {
    if (!config.anthropicApiKey) {
      throw new Error(
        'ANTHROPIC_API_KEY is not set. Please set it in your .env file or environment variables.'
      );
    }
    this.client = new Anthropic({ apiKey: config.anthropicApiKey });
    this.model = model || config.primaryModel;
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    try {
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
    } catch (error) {
      if (error instanceof Anthropic.APIError) {
        if (error.status === 403) {
          throw new Error(
            `Anthropic API permission denied for model "${this.model}". ` +
            `Verify that your API key has access to this model, or set a different model ` +
            `via the PRIMARY_MODEL / EVALUATOR_MODEL environment variables.`
          );
        }
        if (error.status === 401) {
          throw new Error(
            'Anthropic API authentication failed. Check that your ANTHROPIC_API_KEY is valid.'
          );
        }
        throw new Error(`Anthropic API error (${error.status}): ${error.message}`);
      }
      throw error;
    }
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
