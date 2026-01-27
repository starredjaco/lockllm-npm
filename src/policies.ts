/**
 * Custom Policies Management API Client
 */

import { HttpClient } from './utils';
import type { RequestOptions } from './types/common';

export interface CustomPolicy {
  id: string;
  policy_name: string;
  policy_description: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePolicyRequest {
  policy_name: string;
  policy_description: string;
  enabled?: boolean;
}

export interface UpdatePolicyRequest {
  policy_name?: string;
  policy_description?: string;
  enabled?: boolean;
}

export class PoliciesClient {
  private http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  /**
   * List all custom policies
   *
   * @param options - Request options
   * @returns Array of custom policies
   *
   * @example
   * ```typescript
   * const policies = await client.policies.list();
   * console.log(`You have ${policies.length} custom policies`);
   * ```
   */
  async list(options?: RequestOptions): Promise<CustomPolicy[]> {
    const { data } = await this.http.get<CustomPolicy[]>(
      '/api/v1/policies',
      options
    );
    return data;
  }

  /**
   * Get a specific custom policy by ID
   *
   * @param policyId - Policy ID
   * @param options - Request options
   * @returns Custom policy details
   *
   * @example
   * ```typescript
   * const policy = await client.policies.get('policy-id');
   * console.log(policy.policy_name);
   * ```
   */
  async get(policyId: string, options?: RequestOptions): Promise<CustomPolicy> {
    const { data } = await this.http.get<CustomPolicy>(
      `/api/v1/policies/${policyId}`,
      options
    );
    return data;
  }

  /**
   * Create a new custom policy
   *
   * @param policy - Policy creation request
   * @param options - Request options
   * @returns Created policy
   *
   * @example
   * ```typescript
   * const policy = await client.policies.create({
   *   policy_name: "No Medical Advice",
   *   policy_description: "Prohibit providing medical diagnoses or treatment recommendations",
   *   enabled: true
   * });
   * ```
   */
  async create(
    policy: CreatePolicyRequest,
    options?: RequestOptions
  ): Promise<CustomPolicy> {
    const { data } = await this.http.post<CustomPolicy>(
      '/api/v1/policies',
      policy,
      options
    );
    return data;
  }

  /**
   * Update an existing custom policy
   *
   * @param policyId - Policy ID
   * @param updates - Policy update request
   * @param options - Request options
   * @returns Updated policy
   *
   * @example
   * ```typescript
   * const policy = await client.policies.update('policy-id', {
   *   enabled: false
   * });
   * ```
   */
  async update(
    policyId: string,
    updates: UpdatePolicyRequest,
    options?: RequestOptions
  ): Promise<CustomPolicy> {
    const { data } = await this.http.put<CustomPolicy>(
      `/api/v1/policies/${policyId}`,
      updates,
      options
    );
    return data;
  }

  /**
   * Delete a custom policy
   *
   * @param policyId - Policy ID
   * @param options - Request options
   *
   * @example
   * ```typescript
   * await client.policies.delete('policy-id');
   * ```
   */
  async delete(policyId: string, options?: RequestOptions): Promise<void> {
    await this.http.delete(`/api/v1/policies/${policyId}`, options);
  }
}
