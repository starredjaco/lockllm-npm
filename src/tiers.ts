/**
 * User Tier and Credit Management API Client
 */

import { HttpClient } from './utils';
import type { RequestOptions } from './types/common';

export interface TierInfo {
  current_tier: number;
  monthly_spending: number;
  next_tier_requirement: number;
  monthly_credits: number;
  max_rpm: number;
}

export interface CreditBalance {
  balance: number;
  currency: string;
}

export type TransactionType =
  | 'purchase'
  | 'deduction'
  | 'refund'
  | 'adjustment'
  | 'signup_bonus';

export interface CreditTransaction {
  id: string;
  transaction_type: TransactionType;
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string;
  reference_id?: string;
  created_at: string;
}

export interface ListTransactionsOptions extends RequestOptions {
  limit?: number;
  offset?: number;
  transaction_type?: TransactionType;
}

export class TiersClient {
  private http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  /**
   * Get user's current tier information
   *
   * @param options - Request options
   * @returns Tier information
   *
   * @example
   * ```typescript
   * const tierInfo = await client.tiers.getTierInfo();
   * console.log(`Current tier: ${tierInfo.current_tier}`);
   * console.log(`Monthly spending: $${tierInfo.monthly_spending}`);
   * console.log(`Next tier at: $${tierInfo.next_tier_requirement}`);
   * ```
   */
  async getTierInfo(options?: RequestOptions): Promise<TierInfo> {
    const { data } = await this.http.get<TierInfo>('/api/v1/tiers', options);
    return data;
  }

  /**
   * Get user's current credit balance
   *
   * @param options - Request options
   * @returns Credit balance
   *
   * @example
   * ```typescript
   * const balance = await client.tiers.getBalance();
   * console.log(`Balance: ${balance.currency} ${balance.balance}`);
   * ```
   */
  async getBalance(options?: RequestOptions): Promise<CreditBalance> {
    const { data } = await this.http.get<CreditBalance>(
      '/api/v1/credits/balance',
      options
    );
    return data;
  }

  /**
   * List credit transaction history
   *
   * @param options - Query options (limit, offset, transaction_type)
   * @returns Array of credit transactions
   *
   * @example
   * ```typescript
   * const transactions = await client.tiers.listTransactions({
   *   limit: 10,
   *   transaction_type: 'deduction'
   * });
   *
   * transactions.forEach(tx => {
   *   console.log(`${tx.transaction_type}: $${tx.amount} - ${tx.description}`);
   * });
   * ```
   */
  async listTransactions(
    options?: ListTransactionsOptions
  ): Promise<CreditTransaction[]> {
    const { limit, offset, transaction_type, ...requestOptions } = options || {};

    const queryParams = new URLSearchParams();
    if (limit !== undefined) queryParams.append('limit', limit.toString());
    if (offset !== undefined) queryParams.append('offset', offset.toString());
    if (transaction_type) queryParams.append('transaction_type', transaction_type);

    const query = queryParams.toString();
    const url = query
      ? `/api/v1/credits/transactions?${query}`
      : '/api/v1/credits/transactions';

    const { data } = await this.http.get<CreditTransaction[]>(
      url,
      requestOptions
    );
    return data;
  }
}
