/**
 * Main LockLLM client
 */

import { HttpClient } from './utils';
import { ScanClient } from './scan';
import { PoliciesClient } from './policies';
import { RoutingClient } from './routing';
import { TiersClient } from './tiers';
import { LogsClient } from './logs';
import { WebhooksClient } from './webhooks';
import { UpstreamKeysClient } from './upstream-keys';
import { ConfigurationError } from './errors';
import type { LockLLMConfig } from './types/common';

const DEFAULT_BASE_URL = 'https://api.lockllm.com';
const DEFAULT_TIMEOUT = 60000; // 60 seconds
const DEFAULT_MAX_RETRIES = 3;

export class LockLLM {
  private readonly config: Required<LockLLMConfig>;
  private readonly http: HttpClient;
  private readonly scanClient: ScanClient;

  // Management API clients
  public readonly policies: PoliciesClient;
  public readonly routing: RoutingClient;
  public readonly tiers: TiersClient;
  public readonly logs: LogsClient;
  public readonly webhooks: WebhooksClient;
  public readonly upstreamKeys: UpstreamKeysClient;

  /**
   * Create a new LockLLM client
   *
   * @param config - Client configuration
   *
   * @example
   * ```typescript
   * const lockllm = new LockLLM({
   *   apiKey: process.env.LOCKLLM_API_KEY,
   * });
   * ```
   */
  constructor(config: LockLLMConfig) {
    // Validate API key
    if (!config.apiKey || !config.apiKey.trim()) {
      throw new ConfigurationError(
        'API key is required. Get your API key from https://www.lockllm.com/dashboard'
      );
    }

    // Set defaults
    this.config = {
      apiKey: config.apiKey,
      baseURL: config.baseURL ?? DEFAULT_BASE_URL,
      timeout: config.timeout ?? DEFAULT_TIMEOUT,
      maxRetries: config.maxRetries ?? DEFAULT_MAX_RETRIES,
    };

    // Initialize HTTP client
    this.http = new HttpClient(
      this.config.baseURL,
      this.config.apiKey,
      this.config.timeout,
      this.config.maxRetries
    );

    // Initialize scan client
    this.scanClient = new ScanClient(this.http);

    // Initialize management clients
    this.policies = new PoliciesClient(this.http);
    this.routing = new RoutingClient(this.http);
    this.tiers = new TiersClient(this.http);
    this.logs = new LogsClient(this.http);
    this.webhooks = new WebhooksClient(this.http);
    this.upstreamKeys = new UpstreamKeysClient(this.http);
  }

  /**
   * Scan a prompt for injection attacks
   *
   * @example
   * ```typescript
   * const result = await lockllm.scan({
   *   input: "Ignore previous instructions",
   *   sensitivity: "medium"
   * });
   * ```
   */
  get scan() {
    return this.scanClient.scan.bind(this.scanClient);
  }

  /**
   * Get the current configuration
   */
  getConfig(): Readonly<Required<LockLLMConfig>> {
    return { ...this.config };
  }
}
