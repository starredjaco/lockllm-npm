/**
 * Utility functions for HTTP requests and common operations
 */

import {
  LockLLMError,
  NetworkError,
  RateLimitError,
  parseError,
} from './errors';
import type { RequestOptions } from './types/common';
import type { ProviderName } from './types/providers';

const LOCKLLM_PROXY_BASE = 'https://api.lockllm.com/v1/proxy';

/**
 * Get the proxy URL for a specific provider
 *
 * @param provider - The provider name
 * @returns The full proxy URL for the provider
 *
 * @example
 * ```typescript
 * const url = getProxyURL('openai');
 * // Returns: 'https://api.lockllm.com/v1/proxy/openai'
 * ```
 */
export function getProxyURL(provider: ProviderName): string {
  return `${LOCKLLM_PROXY_BASE}/${provider}`;
}

/**
 * Get the universal proxy URL (non-BYOK mode)
 * Access 200+ models without configuring provider keys
 *
 * @returns The universal proxy URL
 *
 * @example
 * ```typescript
 * const url = getUniversalProxyURL();
 * // Returns: 'https://api.lockllm.com/v1/proxy/chat/completions'
 * ```
 */
export function getUniversalProxyURL(): string {
  return `${LOCKLLM_PROXY_BASE}/chat/completions`;
}

/**
 * Get all available proxy URLs
 *
 * @returns Record of all provider proxy URLs
 *
 * @example
 * ```typescript
 * const urls = getAllProxyURLs();
 * console.log(urls.openai); // 'https://api.lockllm.com/v1/proxy/openai'
 * console.log(urls.anthropic); // 'https://api.lockllm.com/v1/proxy/anthropic'
 * ```
 */
export function getAllProxyURLs(): Record<ProviderName, string> {
  return {
    openai: getProxyURL('openai'),
    anthropic: getProxyURL('anthropic'),
    gemini: getProxyURL('gemini'),
    cohere: getProxyURL('cohere'),
    openrouter: getProxyURL('openrouter'),
    perplexity: getProxyURL('perplexity'),
    mistral: getProxyURL('mistral'),
    groq: getProxyURL('groq'),
    deepseek: getProxyURL('deepseek'),
    together: getProxyURL('together'),
    xai: getProxyURL('xai'),
    fireworks: getProxyURL('fireworks'),
    anyscale: getProxyURL('anyscale'),
    huggingface: getProxyURL('huggingface'),
    azure: getProxyURL('azure'),
    bedrock: getProxyURL('bedrock'),
    'vertex-ai': getProxyURL('vertex-ai'),
  };
}

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Sleep for a specified number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Parse Retry-After header value to milliseconds
 */
export function parseRetryAfter(retryAfter: string | null): number | undefined {
  if (!retryAfter) return undefined;

  // If it's a number, it's seconds
  const seconds = parseInt(retryAfter, 10);
  if (!isNaN(seconds)) {
    return seconds * 1000;
  }

  // If it's a date string, calculate diff
  const date = new Date(retryAfter);
  if (!isNaN(date.getTime())) {
    return Math.max(0, date.getTime() - Date.now());
  }

  return undefined;
}

/**
 * Exponential backoff delay calculation
 */
export function calculateBackoff(attempt: number, baseDelay: number = 1000): number {
  return Math.min(baseDelay * Math.pow(2, attempt), 30000);
}

/**
 * HTTP client for making requests to LockLLM API
 */
export class HttpClient {
  private baseURL: string;
  private apiKey: string;
  private timeout: number;
  private maxRetries: number;

  constructor(
    baseURL: string,
    apiKey: string,
    timeout: number = 60000,
    maxRetries: number = 3
  ) {
    this.baseURL = baseURL.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = apiKey;
    this.timeout = timeout;
    this.maxRetries = maxRetries;
  }

  /**
   * Make a GET request
   */
  async get<T = any>(
    path: string,
    options?: RequestOptions
  ): Promise<{ data: T; requestId: string }> {
    return this.request<T>('GET', path, undefined, options);
  }

  /**
   * Make a POST request
   */
  async post<T = any>(
    path: string,
    body?: any,
    options?: RequestOptions
  ): Promise<{ data: T; requestId: string }> {
    return this.request<T>('POST', path, body, options);
  }

  /**
   * Make a PUT request
   */
  async put<T = any>(
    path: string,
    body?: any,
    options?: RequestOptions
  ): Promise<{ data: T; requestId: string }> {
    return this.request<T>('PUT', path, body, options);
  }

  /**
   * Make a DELETE request
   */
  async delete(path: string, options?: RequestOptions): Promise<void> {
    await this.request<void>('DELETE', path, undefined, options);
  }

  /**
   * Make an HTTP request with retry logic
   */
  private async request<T = any>(
    method: string,
    path: string,
    body?: any,
    options?: RequestOptions
  ): Promise<{ data: T; requestId: string }> {
    const url = `${this.baseURL}${path}`;
    const requestId = generateRequestId();
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.makeRequest(
          method,
          url,
          body,
          requestId,
          options
        );

        const responseRequestId =
          response.headers.get('X-Request-Id') || requestId;

        // Success
        if (response.ok) {
          const data = await response.json();
          return {
            data: data as T,
            requestId: responseRequestId,
          };
        }

        // Handle rate limiting with retry
        if (response.status === 429) {
          const retryAfter = parseRetryAfter(response.headers.get('Retry-After'));

          if (attempt < this.maxRetries) {
            const delay = retryAfter || calculateBackoff(attempt);
            await sleep(delay);
            continue;
          }

          const errorData: any = await response.json().catch(() => ({}));
          throw new RateLimitError(
            errorData.error?.message || 'Rate limit exceeded',
            retryAfter,
            responseRequestId
          );
        }

        // Handle other errors
        const errorData: any = await response.json().catch(() => ({}));
        throw parseError(errorData, responseRequestId);
      } catch (error) {
        // If it's already a LockLLMError, rethrow immediately (don't retry)
        if (error instanceof LockLLMError && !(error instanceof RateLimitError)) {
          throw error;
        }

        lastError = error as Error;

        // Retry on network errors
        if (attempt < this.maxRetries && this.isRetryableError(error)) {
          await sleep(calculateBackoff(attempt));
          continue;
        }

        // No more retries
        break;
      }
    }

    // All retries exhausted
    if (lastError instanceof LockLLMError) {
      throw lastError;
    }

    throw new NetworkError(
      lastError?.message || 'Network request failed',
      lastError,
      requestId
    );
  }

  /**
   * Make a single HTTP request
   */
  private async makeRequest(
    method: string,
    url: string,
    body: any,
    requestId: string,
    options?: RequestOptions
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutMs = options?.timeout || this.timeout;

    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        'X-Request-Id': requestId,
        ...options?.headers,
      };

      // Use user's signal if provided, otherwise use timeout controller
      // If user provides a signal, they're responsible for timeout
      const signal = options?.signal || controller.signal;

      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal,
      });

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: any): boolean {
    // Retry on network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return true;
    }

    // Retry on timeout
    if (error.name === 'AbortError') {
      return true;
    }

    // Retry on rate limit (handled separately)
    if (error instanceof RateLimitError) {
      return true;
    }

    return false;
  }
}
