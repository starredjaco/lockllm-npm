/**
 * Anthropic SDK wrapper - Drop-in replacement
 *
 * This wrapper allows you to use the official Anthropic SDK with LockLLM protection
 * by simply changing how you initialize the client.
 *
 * @example
 * ```typescript
 * // Replace this:
 * // import Anthropic from '@anthropic-ai/sdk';
 * // const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
 *
 * // With this:
 * import { createAnthropic } from '@lockllm/sdk/wrappers';
 * const anthropic = createAnthropic({
 *   apiKey: process.env.LOCKLLM_API_KEY,
 *   proxyOptions: {
 *     scanMode: 'combined',
 *     scanAction: 'block'
 *   }
 * });
 *
 * // Everything else stays the same!
 * const message = await anthropic.messages.create({
 *   model: "claude-3-5-sonnet-20241022",
 *   max_tokens: 1024,
 *   messages: [{ role: "user", content: "Hello!" }]
 * });
 * ```
 */

import type { ProxyRequestOptions } from '../types/common';
import { buildLockLLMHeaders } from '../utils/proxy-headers';

export interface CreateAnthropicConfig {
  /**
   * Your LockLLM API key
   * Get it from: https://www.lockllm.com/dashboard
   */
  apiKey: string;

  /**
   * Base URL for LockLLM proxy (default: https://api.lockllm.com/v1/proxy/anthropic)
   * Override this only if you're using a custom LockLLM endpoint
   */
  baseURL?: string;

  /**
   * Proxy request options for scan, policy, abuse, and routing control
   */
  proxyOptions?: ProxyRequestOptions;

  /**
   * Other Anthropic client options
   */
  [key: string]: any;
}

/**
 * Create an Anthropic client that routes through LockLLM proxy
 *
 * All requests are automatically scanned for prompt injection before being
 * forwarded to Anthropic. Your Anthropic API key should be configured in the
 * LockLLM dashboard at https://www.lockllm.com/dashboard
 *
 * @param config - Configuration options
 * @returns Anthropic client instance
 *
 * @example
 * ```typescript
 * const anthropic = createAnthropic({
 *   apiKey: process.env.LOCKLLM_API_KEY
 * });
 *
 * const message = await anthropic.messages.create({
 *   model: "claude-3-5-sonnet-20241022",
 *   max_tokens: 1024,
 *   messages: [{ role: "user", content: "Hello!" }]
 * });
 * ```
 */
/**
 * Lazy-load Anthropic SDK constructor
 * @internal - exposed for testing purposes
 */
export function getAnthropicConstructor(requireFn = require): any {
  try {
    const anthropicModule = requireFn('@anthropic-ai/sdk');
    return anthropicModule.default || anthropicModule.Anthropic || anthropicModule;
  } catch (error) {
    throw new Error(
      'Anthropic SDK not found. Please install it with: npm install @anthropic-ai/sdk'
    );
  }
}

export function createAnthropic(config: CreateAnthropicConfig): any {
  // Get Anthropic SDK constructor
  const AnthropicConstructor = getAnthropicConstructor();

  const { apiKey, baseURL, proxyOptions, ...otherOptions } = config;

  // Build LockLLM headers from proxy options
  const lockllmHeaders = buildLockLLMHeaders(proxyOptions);

  // Merge with existing headers
  const defaultHeaders = otherOptions.defaultHeaders || {};
  const mergedHeaders = {
    ...defaultHeaders,
    ...lockllmHeaders,
    ...(proxyOptions?.headers || {}),
  };

  // Create Anthropic client with LockLLM proxy
  return new AnthropicConstructor({
    apiKey,
    baseURL: baseURL || 'https://api.lockllm.com/v1/proxy/anthropic',
    defaultHeaders: mergedHeaders,
    ...otherOptions,
  });
}
