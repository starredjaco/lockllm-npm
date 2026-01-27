/**
 * Activity Logs API Client
 */

import { HttpClient } from './utils';
import type { RequestOptions } from './types/common';
import type { PolicyViolation } from './types/scan';

export type LogType = 'scan_api' | 'webhook_delivery' | 'proxy_request';
export type LogStatus = 'success' | 'failure' | 'error' | 'pending';

export interface ActivityLog {
  id: string;
  log_type: LogType;
  log_subtype?: string;
  request_id: string;
  status: LogStatus;
  created_at: string;

  // Associated entities
  api_key_id?: string;
  upstream_key_id?: string;

  // Scan-specific metadata
  scan_result?: {
    safe: boolean;
    label: 0 | 1;
    confidence: number;
    injection: number;
    sensitivity: string;
    policy_violations?: PolicyViolation[];
  };
  prompt_length?: number;

  // Webhook-specific metadata
  webhook_url?: string;
  webhook_status?: number;
  response_time_ms?: number;
  retry_count?: number;

  // Proxy-specific metadata
  provider?: string;
  model?: string;

  // Routing metadata
  task_type?: string;
  complexity_score?: number;
  selected_model?: string;
  routing_reason?: string;
  estimated_cost?: number;

  // Policy violations
  policy_violations?: PolicyViolation[];

  // Credit tracking
  actual_cost?: number;
  credits_deducted?: number;
  balance_after?: number;
  input_tokens?: number;
  output_tokens?: number;

  // Flexible metadata
  metadata?: Record<string, any>;

  // Error tracking
  error_message?: string;
}

export interface LogsQueryOptions extends RequestOptions {
  log_type?: LogType;
  status?: LogStatus;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

export class LogsClient {
  private http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  /**
   * List activity logs
   *
   * @param options - Query options (filters and pagination)
   * @returns Array of activity logs
   *
   * @example
   * ```typescript
   * const logs = await client.logs.list({
   *   log_type: 'scan_api',
   *   status: 'success',
   *   limit: 20
   * });
   *
   * logs.forEach(log => {
   *   console.log(`${log.log_type}: ${log.status} - ${log.created_at}`);
   * });
   * ```
   */
  async list(options?: LogsQueryOptions): Promise<ActivityLog[]> {
    const {
      log_type,
      status,
      start_date,
      end_date,
      limit,
      offset,
      ...requestOptions
    } = options || {};

    const queryParams = new URLSearchParams();
    if (log_type) queryParams.append('log_type', log_type);
    if (status) queryParams.append('status', status);
    if (start_date) queryParams.append('start_date', start_date);
    if (end_date) queryParams.append('end_date', end_date);
    if (limit !== undefined) queryParams.append('limit', limit.toString());
    if (offset !== undefined) queryParams.append('offset', offset.toString());

    const query = queryParams.toString();
    const url = query ? `/api/v1/logs?${query}` : '/api/v1/logs';

    const { data } = await this.http.get<ActivityLog[]>(url, requestOptions);
    return data;
  }

  /**
   * Get a specific activity log by ID
   *
   * @param logId - Log ID
   * @param options - Request options
   * @returns Activity log details
   *
   * @example
   * ```typescript
   * const log = await client.logs.get('log-id');
   * console.log(log.scan_result);
   * ```
   */
  async get(logId: string, options?: RequestOptions): Promise<ActivityLog> {
    const { data } = await this.http.get<ActivityLog>(
      `/api/v1/logs/${logId}`,
      options
    );
    return data;
  }
}
