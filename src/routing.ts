/**
 * Intelligent Routing Management API Client
 */

import { HttpClient } from './utils';
import type { RequestOptions } from './types/common';

export type TaskType =
  | 'Open QA'
  | 'Closed QA'
  | 'Summarization'
  | 'Text Generation'
  | 'Code Generation'
  | 'Chatbot'
  | 'Classification'
  | 'Rewrite'
  | 'Brainstorming'
  | 'Extraction'
  | 'Other';

export type ComplexityTier = 'low' | 'medium' | 'high';

export interface RoutingRule {
  id: string;
  task_type: TaskType;
  complexity_tier: ComplexityTier;
  model_name: string;
  provider_preference: string;
  use_byok: boolean;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateRoutingRuleRequest {
  task_type: TaskType;
  complexity_tier: ComplexityTier;
  model_name: string;
  provider_preference: string;
  use_byok?: boolean;
  enabled?: boolean;
}

export interface UpdateRoutingRuleRequest {
  model_name?: string;
  provider_preference?: string;
  use_byok?: boolean;
  enabled?: boolean;
}

export class RoutingClient {
  private http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  /**
   * List all routing rules
   *
   * @param options - Request options
   * @returns Array of routing rules
   *
   * @example
   * ```typescript
   * const rules = await client.routing.listRules();
   * console.log(`You have ${rules.length} routing rules`);
   * ```
   */
  async listRules(options?: RequestOptions): Promise<RoutingRule[]> {
    const { data } = await this.http.get<RoutingRule[]>(
      '/api/v1/routing',
      options
    );
    return data;
  }

  /**
   * Get a specific routing rule by ID
   *
   * @param ruleId - Rule ID
   * @param options - Request options
   * @returns Routing rule details
   *
   * @example
   * ```typescript
   * const rule = await client.routing.getRule('rule-id');
   * console.log(rule.task_type, rule.complexity_tier);
   * ```
   */
  async getRule(ruleId: string, options?: RequestOptions): Promise<RoutingRule> {
    const { data } = await this.http.get<RoutingRule>(
      `/api/v1/routing/${ruleId}`,
      options
    );
    return data;
  }

  /**
   * Create a new routing rule
   *
   * @param rule - Routing rule creation request
   * @param options - Request options
   * @returns Created routing rule
   *
   * @example
   * ```typescript
   * const rule = await client.routing.createRule({
   *   task_type: "Code Generation",
   *   complexity_tier: "high",
   *   model_name: "claude-3-7-sonnet",
   *   provider_preference: "anthropic",
   *   use_byok: true
   * });
   * ```
   */
  async createRule(
    rule: CreateRoutingRuleRequest,
    options?: RequestOptions
  ): Promise<RoutingRule> {
    const { data } = await this.http.post<RoutingRule>(
      '/api/v1/routing',
      rule,
      options
    );
    return data;
  }

  /**
   * Update an existing routing rule
   *
   * @param ruleId - Rule ID
   * @param updates - Routing rule update request
   * @param options - Request options
   * @returns Updated routing rule
   *
   * @example
   * ```typescript
   * const rule = await client.routing.updateRule('rule-id', {
   *   model_name: "gpt-4",
   *   provider_preference: "openai"
   * });
   * ```
   */
  async updateRule(
    ruleId: string,
    updates: UpdateRoutingRuleRequest,
    options?: RequestOptions
  ): Promise<RoutingRule> {
    const { data } = await this.http.put<RoutingRule>(
      `/api/v1/routing/${ruleId}`,
      updates,
      options
    );
    return data;
  }

  /**
   * Delete a routing rule
   *
   * @param ruleId - Rule ID
   * @param options - Request options
   *
   * @example
   * ```typescript
   * await client.routing.deleteRule('rule-id');
   * ```
   */
  async deleteRule(ruleId: string, options?: RequestOptions): Promise<void> {
    await this.http.delete(`/api/v1/routing/${ruleId}`, options);
  }
}
