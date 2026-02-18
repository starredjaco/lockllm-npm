/**
 * Generic SDK wrapper for any provider
 *
 * This wrapper provides a generic way to create clients for any LLM provider
 * by routing requests through the LockLLM proxy.
 *
 * @example
 * ```typescript
 * import { createClient } from '@lockllm/sdk/wrappers';
 *
 * // For providers with official SDKs
 * const mistral = createClient('mistral', MistralClient, {
 *   apiKey: process.env.LOCKLLM_API_KEY
 * });
 *
 * // For providers with OpenAI-compatible APIs
 * const groq = createClient('groq', OpenAI, {
 *   apiKey: process.env.LOCKLLM_API_KEY
 * });
 * ```
 */

import { getProxyURL } from '../utils';
import type { ProviderName } from '../types/providers';
import type { ProxyRequestOptions } from '../types/common';
import { buildLockLLMHeaders } from '../utils/proxy-headers';

export interface GenericClientConfig {
  /**
   * Your LockLLM API key
   * Get it from: https://www.lockllm.com/dashboard
   */
  apiKey: string;

  /**
   * Base URL override (optional)
   * By default, uses LockLLM proxy URL for the provider
   */
  baseURL?: string;

  /**
   * Proxy request options for scan, policy, abuse, and routing control
   */
  proxyOptions?: ProxyRequestOptions;

  /**
   * Other client-specific options
   */
  [key: string]: any;
}

/**
 * Create a client for any provider using their official SDK
 *
 * This is a generic factory function that works with any LLM provider SDK
 * by configuring it to use the LockLLM proxy.
 *
 * @param provider - The provider name (e.g., 'openai', 'anthropic', 'mistral')
 * @param ClientConstructor - The provider's SDK client constructor
 * @param config - Configuration options
 * @returns Configured client instance
 *
 * @example
 * ```typescript
 * // Mistral AI
 * import MistralClient from '@mistralai/mistralai';
 * const mistral = createClient('mistral', MistralClient, {
 *   apiKey: process.env.LOCKLLM_API_KEY
 * });
 *
 * // Groq (OpenAI-compatible)
 * import OpenAI from 'openai';
 * const groq = createClient('groq', OpenAI, {
 *   apiKey: process.env.LOCKLLM_API_KEY
 * });
 *
 * // Cohere
 * import { CohereClient } from 'cohere-ai';
 * const cohere = createClient('cohere', CohereClient, {
 *   apiKey: process.env.LOCKLLM_API_KEY
 * });
 * ```
 */
export function createClient<T = any>(
  provider: ProviderName,
  ClientConstructor: new (config: any) => T,
  config: GenericClientConfig
): T {
  const { apiKey, baseURL, proxyOptions, ...otherOptions } = config;

  // Use provided baseURL or default to LockLLM proxy
  const clientBaseURL = baseURL || getProxyURL(provider);

  // Build LockLLM headers from proxy options
  const lockllmHeaders = buildLockLLMHeaders(proxyOptions);

  // Merge with existing headers
  const defaultHeaders = otherOptions.defaultHeaders || {};
  const mergedHeaders = {
    ...defaultHeaders,
    ...lockllmHeaders,
    ...(proxyOptions?.headers || {}),
  };

  // Create client with LockLLM proxy configuration
  return new ClientConstructor({
    apiKey,
    baseURL: clientBaseURL,
    defaultHeaders: mergedHeaders,
    ...otherOptions,
  });
}

/**
 * Lazy-load OpenAI SDK constructor
 * @internal - exposed for testing purposes
 */
export function getGenericOpenAIConstructor(requireFn = require): any {
  try {
    const openaiModule = requireFn('openai');
    return openaiModule.default || openaiModule.OpenAI || openaiModule;
  } catch (error) {
    throw new Error(
      'OpenAI SDK not found. Please install it with: npm install openai'
    );
  }
}

/**
 * Helper to create OpenAI-compatible clients for providers
 *
 * Many providers (Groq, DeepSeek, Perplexity, etc.) use OpenAI-compatible APIs.
 * This helper makes it easy to create clients for these providers.
 *
 * @param provider - The provider name
 * @param config - Configuration options
 * @returns OpenAI client configured for the provider
 *
 * @example
 * ```typescript
 * // Groq
 * const groq = createOpenAICompatible('groq', {
 *   apiKey: process.env.LOCKLLM_API_KEY
 * });
 *
 * // DeepSeek
 * const deepseek = createOpenAICompatible('deepseek', {
 *   apiKey: process.env.LOCKLLM_API_KEY
 * });
 *
 * // Use like OpenAI
 * const response = await groq.chat.completions.create({
 *   model: 'llama-3.1-70b-versatile',
 *   messages: [{ role: 'user', content: 'Hello!' }]
 * });
 * ```
 */
export function createOpenAICompatible(
  provider: ProviderName,
  config: GenericClientConfig
): any {
  const OpenAIConstructor = getGenericOpenAIConstructor();
  return createClient(provider, OpenAIConstructor, config);
}

/**
 * Pre-configured factory functions for specific providers
 */

/**
 * Create a Groq client (OpenAI-compatible)
 */
export function createGroq(config: GenericClientConfig): any {
  return createOpenAICompatible('groq', config);
}

/**
 * Create a DeepSeek client (OpenAI-compatible)
 */
export function createDeepSeek(config: GenericClientConfig): any {
  return createOpenAICompatible('deepseek', config);
}

/**
 * Create a Perplexity client (OpenAI-compatible)
 */
export function createPerplexity(config: GenericClientConfig): any {
  return createOpenAICompatible('perplexity', config);
}

/**
 * Create a Mistral AI client (OpenAI-compatible)
 */
export function createMistral(config: GenericClientConfig): any {
  return createOpenAICompatible('mistral', config);
}

/**
 * Create an OpenRouter client (OpenAI-compatible)
 */
export function createOpenRouter(config: GenericClientConfig): any {
  return createOpenAICompatible('openrouter', config);
}

/**
 * Create a Together AI client (OpenAI-compatible)
 */
export function createTogether(config: GenericClientConfig): any {
  return createOpenAICompatible('together', config);
}

/**
 * Create an xAI (Grok) client (OpenAI-compatible)
 */
export function createXAI(config: GenericClientConfig): any {
  return createOpenAICompatible('xai', config);
}

/**
 * Create a Fireworks AI client (OpenAI-compatible)
 */
export function createFireworks(config: GenericClientConfig): any {
  return createOpenAICompatible('fireworks', config);
}

/**
 * Create an Anyscale client (OpenAI-compatible)
 */
export function createAnyscale(config: GenericClientConfig): any {
  return createOpenAICompatible('anyscale', config);
}

/**
 * Create a Hugging Face client (OpenAI-compatible)
 */
export function createHuggingFace(config: GenericClientConfig): any {
  return createOpenAICompatible('huggingface', config);
}

/**
 * Create a Google Gemini client
 *
 * Note: For Gemini, you should use the @google/generative-ai SDK
 * or an OpenAI-compatible wrapper if available.
 */
export function createGemini(config: GenericClientConfig): any {
  return createOpenAICompatible('gemini', config);
}

/**
 * Get Cohere SDK constructor
 * @internal - exposed for testing purposes
 */
export function getCohereConstructor(requireFn = require): any {
  try {
    const cohereModule = requireFn('cohere-ai');
    return cohereModule.CohereClient || cohereModule;
  } catch (error) {
    throw new Error(
      'Cohere SDK not found. Please install it with: npm install cohere-ai'
    );
  }
}

/**
 * Create a Cohere client
 *
 * Note: For Cohere, you should use the cohere-ai SDK
 */
export function createCohere(config: GenericClientConfig): any {
  // Check if Cohere SDK is installed
  const CohereConstructor = getCohereConstructor();
  return createClient('cohere', CohereConstructor, config);
}

/**
 * Create an Azure OpenAI client
 */
export function createAzure(config: GenericClientConfig): any {
  return createOpenAICompatible('azure', config);
}

/**
 * Create an AWS Bedrock client
 */
export function createBedrock(config: GenericClientConfig): any {
  return createOpenAICompatible('bedrock', config);
}

/**
 * Create a Google Vertex AI client
 */
export function createVertexAI(config: GenericClientConfig): any {
  return createOpenAICompatible('vertex-ai', config);
}
