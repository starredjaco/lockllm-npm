/**
 * Webhook Management API Client
 */

import { HttpClient } from './utils';
import type { RequestOptions } from './types/common';

export interface WebhookConfig {
  id: string;
  url: string;
  enabled: boolean;
  events: string[];
  secret?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateWebhookRequest {
  url: string;
  enabled?: boolean;
  events?: string[];
}

export class WebhooksClient {
  private http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  /**
   * List all webhooks
   *
   * @param options - Request options
   * @returns Array of webhook configurations
   *
   * @example
   * ```typescript
   * const webhooks = await client.webhooks.list();
   * console.log(`You have ${webhooks.length} webhooks configured`);
   * ```
   */
  async list(options?: RequestOptions): Promise<WebhookConfig[]> {
    const { data } = await this.http.get<WebhookConfig[]>(
      '/api/v1/webhooks',
      options
    );
    return data;
  }

  /**
   * Create a new webhook
   *
   * @param webhook - Webhook creation request
   * @param options - Request options
   * @returns Created webhook configuration
   *
   * @example
   * ```typescript
   * const webhook = await client.webhooks.create({
   *   url: "https://example.com/webhooks/lockllm",
   *   enabled: true,
   *   events: ["scan.unsafe", "policy.violation"]
   * });
   *
   * console.log(`Webhook secret: ${webhook.secret}`);
   * ```
   */
  async create(
    webhook: CreateWebhookRequest,
    options?: RequestOptions
  ): Promise<WebhookConfig> {
    const { data } = await this.http.post<WebhookConfig>(
      '/api/v1/webhooks',
      webhook,
      options
    );
    return data;
  }

  /**
   * Delete a webhook
   *
   * @param webhookId - Webhook ID
   * @param options - Request options
   *
   * @example
   * ```typescript
   * await client.webhooks.delete('webhook-id');
   * ```
   */
  async delete(webhookId: string, options?: RequestOptions): Promise<void> {
    await this.http.delete(`/api/v1/webhooks/${webhookId}`, options);
  }
}
