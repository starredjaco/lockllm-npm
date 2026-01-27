/**
 * BYOK (Bring Your Own Key) Management API Client
 */

import { HttpClient } from './utils';
import type { RequestOptions, Provider } from './types/common';

export interface UpstreamKey {
  id: string;
  provider: Provider;
  nickname?: string;
  endpoint_url?: string;
  deployment_name?: string;
  api_version?: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
  last_used_at?: string;
}

export interface CreateUpstreamKeyRequest {
  provider: Provider;
  api_key: string;
  nickname?: string;
  endpoint_url?: string;
  deployment_name?: string;
  api_version?: string;
  enabled?: boolean;
}

export interface UpdateUpstreamKeyRequest {
  api_key?: string;
  nickname?: string;
  endpoint_url?: string;
  deployment_name?: string;
  api_version?: string;
  enabled?: boolean;
}

export class UpstreamKeysClient {
  private http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  /**
   * List all upstream API keys
   *
   * @param options - Request options
   * @returns Array of upstream keys (API keys are NOT returned)
   *
   * @example
   * ```typescript
   * const keys = await client.upstreamKeys.list();
   * console.log(`You have ${keys.length} BYOK keys configured`);
   * ```
   */
  async list(options?: RequestOptions): Promise<UpstreamKey[]> {
    const { data } = await this.http.get<UpstreamKey[]>(
      '/api/v1/proxy',
      options
    );
    return data;
  }

  /**
   * Get a specific upstream key by ID
   *
   * @param keyId - Key ID
   * @param options - Request options
   * @returns Upstream key details (API key is NOT returned)
   *
   * @example
   * ```typescript
   * const key = await client.upstreamKeys.get('key-id');
   * console.log(key.provider, key.nickname);
   * ```
   */
  async get(keyId: string, options?: RequestOptions): Promise<UpstreamKey> {
    const { data } = await this.http.get<UpstreamKey>(
      `/api/v1/proxy/${keyId}`,
      options
    );
    return data;
  }

  /**
   * Create a new upstream API key
   *
   * @param key - Upstream key creation request
   * @param options - Request options
   * @returns Created upstream key (API key will be encrypted server-side)
   *
   * @example
   * ```typescript
   * const key = await client.upstreamKeys.create({
   *   provider: "openai",
   *   api_key: "sk-...",
   *   nickname: "Production OpenAI Key",
   *   enabled: true
   * });
   * ```
   */
  async create(
    key: CreateUpstreamKeyRequest,
    options?: RequestOptions
  ): Promise<UpstreamKey> {
    const { data } = await this.http.post<UpstreamKey>(
      '/api/v1/proxy',
      key,
      options
    );
    return data;
  }

  /**
   * Update an existing upstream key
   *
   * @param keyId - Key ID
   * @param updates - Upstream key update request
   * @param options - Request options
   * @returns Updated upstream key
   *
   * @example
   * ```typescript
   * const key = await client.upstreamKeys.update('key-id', {
   *   enabled: false
   * });
   * ```
   */
  async update(
    keyId: string,
    updates: UpdateUpstreamKeyRequest,
    options?: RequestOptions
  ): Promise<UpstreamKey> {
    const { data } = await this.http.put<UpstreamKey>(
      `/api/v1/proxy/${keyId}`,
      updates,
      options
    );
    return data;
  }

  /**
   * Delete an upstream key
   *
   * @param keyId - Key ID
   * @param options - Request options
   *
   * @example
   * ```typescript
   * await client.upstreamKeys.delete('key-id');
   * ```
   */
  async delete(keyId: string, options?: RequestOptions): Promise<void> {
    await this.http.delete(`/api/v1/proxy/${keyId}`, options);
  }
}
