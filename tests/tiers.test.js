/**
 * Tests for Tiers & Credits Management Client
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TiersClient } from '../src/tiers';
import { HttpClient } from '../src/utils';

// Mock HttpClient
vi.mock('../src/utils', () => {
  return {
    HttpClient: vi.fn().mockImplementation(() => ({
      get: vi.fn(),
    })),
  };
});

describe('TiersClient', () => {
  let tiersClient;
  let mockHttpClient;

  beforeEach(() => {
    mockHttpClient = new HttpClient('https://api.lockllm.com', 'test_api_key');
    tiersClient = new TiersClient(mockHttpClient);
    vi.clearAllMocks();
  });

  describe('getTierInfo', () => {
    it('should fetch user tier information', async () => {
      const mockTierInfo = {
        current_tier: 4,
        monthly_spending: 125.50,
        next_tier_requirement: 250.00,
        monthly_credits: 5.00,
        max_rpm: 200,
      };

      mockHttpClient.get.mockResolvedValueOnce({ data: mockTierInfo });

      const result = await tiersClient.getTierInfo();

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/tiers', undefined);
      expect(result).toEqual(mockTierInfo);
    });

    it('should include current_tier (1-10)', async () => {
      const mockTierInfo = {
        current_tier: 7,
        monthly_spending: 1250.00,
        next_tier_requirement: 3000.00,
        monthly_credits: 80.00,
        max_rpm: 2000,
      };

      mockHttpClient.get.mockResolvedValueOnce({ data: mockTierInfo });

      const result = await tiersClient.getTierInfo();

      expect(result.current_tier).toBe(7);
      expect(result.current_tier).toBeGreaterThanOrEqual(1);
      expect(result.current_tier).toBeLessThanOrEqual(10);
    });

    it('should include monthly_spending', async () => {
      const mockTierInfo = {
        current_tier: 3,
        monthly_spending: 75.25,
        next_tier_requirement: 100.00,
        monthly_credits: 2.00,
        max_rpm: 100,
      };

      mockHttpClient.get.mockResolvedValueOnce({ data: mockTierInfo });

      const result = await tiersClient.getTierInfo();

      expect(result.monthly_spending).toBe(75.25);
      expect(typeof result.monthly_spending).toBe('number');
    });

    it('should include next_tier_requirement', async () => {
      const mockTierInfo = {
        current_tier: 5,
        monthly_spending: 300.00,
        next_tier_requirement: 500.00,
        monthly_credits: 15.00,
        max_rpm: 500,
      };

      mockHttpClient.get.mockResolvedValueOnce({ data: mockTierInfo });

      const result = await tiersClient.getTierInfo();

      expect(result.next_tier_requirement).toBe(500.00);
    });

    it('should include monthly_credits', async () => {
      const mockTierInfo = {
        current_tier: 6,
        monthly_spending: 750.00,
        next_tier_requirement: 1000.00,
        monthly_credits: 40.00,
        max_rpm: 1000,
      };

      mockHttpClient.get.mockResolvedValueOnce({ data: mockTierInfo });

      const result = await tiersClient.getTierInfo();

      expect(result.monthly_credits).toBe(40.00);
    });

    it('should include max_rpm', async () => {
      const mockTierInfo = {
        current_tier: 8,
        monthly_spending: 3500.00,
        next_tier_requirement: 5000.00,
        monthly_credits: 250.00,
        max_rpm: 5000,
      };

      mockHttpClient.get.mockResolvedValueOnce({ data: mockTierInfo });

      const result = await tiersClient.getTierInfo();

      expect(result.max_rpm).toBe(5000);
    });

    it('should handle tier 1 (free tier)', async () => {
      const mockTierInfo = {
        current_tier: 1,
        monthly_spending: 0.00,
        next_tier_requirement: 10.00,
        monthly_credits: 0.00,
        max_rpm: 30,
      };

      mockHttpClient.get.mockResolvedValueOnce({ data: mockTierInfo });

      const result = await tiersClient.getTierInfo();

      expect(result.current_tier).toBe(1);
      expect(result.monthly_spending).toBe(0.00);
      expect(result.monthly_credits).toBe(0.00);
    });

    it('should handle tier 10 (platinum tier)', async () => {
      const mockTierInfo = {
        current_tier: 10,
        monthly_spending: 15000.00,
        next_tier_requirement: 10000.00,
        monthly_credits: 1000.00,
        max_rpm: 20000,
      };

      mockHttpClient.get.mockResolvedValueOnce({ data: mockTierInfo });

      const result = await tiersClient.getTierInfo();

      expect(result.current_tier).toBe(10);
      expect(result.max_rpm).toBe(20000);
    });
  });

  describe('getBalance', () => {
    it('should fetch credit balance', async () => {
      const mockBalance = {
        balance: 125.50,
        currency: 'USD',
      };

      mockHttpClient.get.mockResolvedValueOnce({ data: mockBalance });

      const result = await tiersClient.getBalance();

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/credits/balance', undefined);
      expect(result).toEqual(mockBalance);
    });

    it('should include balance amount', async () => {
      const mockBalance = {
        balance: 250.75,
        currency: 'USD',
      };

      mockHttpClient.get.mockResolvedValueOnce({ data: mockBalance });

      const result = await tiersClient.getBalance();

      expect(result.balance).toBe(250.75);
      expect(typeof result.balance).toBe('number');
    });

    it('should include currency (USD)', async () => {
      const mockBalance = {
        balance: 100.00,
        currency: 'USD',
      };

      mockHttpClient.get.mockResolvedValueOnce({ data: mockBalance });

      const result = await tiersClient.getBalance();

      expect(result.currency).toBe('USD');
    });

    it('should handle zero balance', async () => {
      const mockBalance = {
        balance: 0.00,
        currency: 'USD',
      };

      mockHttpClient.get.mockResolvedValueOnce({ data: mockBalance });

      const result = await tiersClient.getBalance();

      expect(result.balance).toBe(0.00);
    });

    it('should handle large balance', async () => {
      const mockBalance = {
        balance: 9999999.99,
        currency: 'USD',
      };

      mockHttpClient.get.mockResolvedValueOnce({ data: mockBalance });

      const result = await tiersClient.getBalance();

      expect(result.balance).toBe(9999999.99);
    });
  });

  describe('listTransactions', () => {
    it('should fetch transaction history', async () => {
      const mockTransactions = [
        {
          id: 'tx_1',
          transaction_type: 'purchase',
          amount: 50.00,
          balance_before: 25.00,
          balance_after: 75.00,
          description: 'Credit purchase',
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'tx_2',
          transaction_type: 'deduction',
          amount: -0.01,
          balance_before: 75.00,
          balance_after: 74.99,
          description: 'Scan detection fee',
          reference_id: 'req_123',
          created_at: '2024-01-02T00:00:00Z',
        },
      ];

      mockHttpClient.get.mockResolvedValueOnce({ data: mockTransactions });

      const result = await tiersClient.listTransactions();

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/credits/transactions', {});
      expect(result).toEqual(mockTransactions);
      expect(result).toHaveLength(2);
    });

    it('should support limit parameter', async () => {
      const mockTransactions = [
        {
          id: 'tx_1',
          transaction_type: 'purchase',
          amount: 50.00,
          balance_before: 0.00,
          balance_after: 50.00,
          description: 'Credit purchase',
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockHttpClient.get.mockResolvedValueOnce({ data: mockTransactions });

      const result = await tiersClient.listTransactions({ limit: 10 });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/api/v1/credits/transactions?limit=10',
        {}
      );
      expect(result).toHaveLength(1);
    });

    it('should support offset parameter', async () => {
      const mockTransactions = [
        {
          id: 'tx_11',
          transaction_type: 'deduction',
          amount: -0.02,
          balance_before: 100.00,
          balance_after: 99.98,
          description: 'Combined scan fee',
          created_at: '2024-01-11T00:00:00Z',
        },
      ];

      mockHttpClient.get.mockResolvedValueOnce({ data: mockTransactions });

      const result = await tiersClient.listTransactions({ offset: 10 });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/api/v1/credits/transactions?offset=10',
        {}
      );
    });

    it('should filter by transaction_type', async () => {
      const mockTransactions = [
        {
          id: 'tx_1',
          transaction_type: 'purchase',
          amount: 50.00,
          balance_before: 0.00,
          balance_after: 50.00,
          description: 'Credit purchase',
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'tx_2',
          transaction_type: 'purchase',
          amount: 100.00,
          balance_before: 50.00,
          balance_after: 150.00,
          description: 'Credit purchase',
          created_at: '2024-01-05T00:00:00Z',
        },
      ];

      mockHttpClient.get.mockResolvedValueOnce({ data: mockTransactions });

      const result = await tiersClient.listTransactions({
        transaction_type: 'purchase',
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/api/v1/credits/transactions?transaction_type=purchase',
        {}
      );
      expect(result.every((tx) => tx.transaction_type === 'purchase')).toBe(true);
    });

    it('should parse transaction objects correctly', async () => {
      const mockTransactions = [
        {
          id: 'tx_1',
          transaction_type: 'deduction',
          amount: -0.01,
          balance_before: 100.00,
          balance_after: 99.99,
          description: 'Scan detection fee',
          reference_id: 'req_abc123',
          created_at: '2024-01-10T12:30:00Z',
        },
      ];

      mockHttpClient.get.mockResolvedValueOnce({ data: mockTransactions });

      const result = await tiersClient.listTransactions();

      expect(result[0].id).toBe('tx_1');
      expect(result[0].transaction_type).toBe('deduction');
      expect(result[0].amount).toBe(-0.01);
      expect(result[0].balance_before).toBe(100.00);
      expect(result[0].balance_after).toBe(99.99);
      expect(result[0].reference_id).toBe('req_abc123');
    });

    it('should handle empty transaction history', async () => {
      mockHttpClient.get.mockResolvedValueOnce({ data: [] });

      const result = await tiersClient.listTransactions();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle purchase transactions', async () => {
      const mockTransactions = [
        {
          id: 'tx_purchase_1',
          transaction_type: 'purchase',
          amount: 500.00,
          balance_before: 25.00,
          balance_after: 525.00,
          description: 'Credit purchase',
          created_at: '2024-01-15T00:00:00Z',
        },
      ];

      mockHttpClient.get.mockResolvedValueOnce({ data: mockTransactions });

      const result = await tiersClient.listTransactions({
        transaction_type: 'purchase',
      });

      expect(result[0].transaction_type).toBe('purchase');
      expect(result[0].amount).toBeGreaterThan(0);
    });

    it('should handle deduction transactions', async () => {
      const mockTransactions = [
        {
          id: 'tx_deduction_1',
          transaction_type: 'deduction',
          amount: -0.02,
          balance_before: 100.00,
          balance_after: 99.98,
          description: 'Combined scan fee (core + policy)',
          reference_id: 'req_xyz789',
          created_at: '2024-01-20T00:00:00Z',
        },
      ];

      mockHttpClient.get.mockResolvedValueOnce({ data: mockTransactions });

      const result = await tiersClient.listTransactions({
        transaction_type: 'deduction',
      });

      expect(result[0].transaction_type).toBe('deduction');
      expect(result[0].amount).toBeLessThan(0);
    });

    it('should handle refund transactions', async () => {
      const mockTransactions = [
        {
          id: 'tx_refund_1',
          transaction_type: 'refund',
          amount: 0.01,
          balance_before: 50.00,
          balance_after: 50.01,
          description: 'Refund for failed request',
          reference_id: 'req_failed_123',
          created_at: '2024-01-25T00:00:00Z',
        },
      ];

      mockHttpClient.get.mockResolvedValueOnce({ data: mockTransactions });

      const result = await tiersClient.listTransactions({
        transaction_type: 'refund',
      });

      expect(result[0].transaction_type).toBe('refund');
      expect(result[0].amount).toBeGreaterThan(0);
    });

    it('should handle adjustment transactions', async () => {
      const mockTransactions = [
        {
          id: 'tx_adjustment_1',
          transaction_type: 'adjustment',
          amount: 10.00,
          balance_before: 100.00,
          balance_after: 110.00,
          description: 'Manual admin adjustment',
          created_at: '2024-01-30T00:00:00Z',
        },
      ];

      mockHttpClient.get.mockResolvedValueOnce({ data: mockTransactions });

      const result = await tiersClient.listTransactions({
        transaction_type: 'adjustment',
      });

      expect(result[0].transaction_type).toBe('adjustment');
    });

    it('should handle signup_bonus transactions', async () => {
      const mockTransactions = [
        {
          id: 'tx_bonus_1',
          transaction_type: 'signup_bonus',
          amount: 5.00,
          balance_before: 0.00,
          balance_after: 5.00,
          description: 'Welcome bonus',
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockHttpClient.get.mockResolvedValueOnce({ data: mockTransactions });

      const result = await tiersClient.listTransactions({
        transaction_type: 'signup_bonus',
      });

      expect(result[0].transaction_type).toBe('signup_bonus');
      expect(result[0].amount).toBe(5.00);
    });
  });

  describe('pagination', () => {
    it('should paginate with limit and offset', async () => {
      const mockTransactions = [
        {
          id: 'tx_21',
          transaction_type: 'deduction',
          amount: -0.01,
          balance_before: 100.00,
          balance_after: 99.99,
          description: 'Scan fee',
          created_at: '2024-02-01T00:00:00Z',
        },
      ];

      mockHttpClient.get.mockResolvedValueOnce({ data: mockTransactions });

      const result = await tiersClient.listTransactions({ limit: 10, offset: 20 });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/api/v1/credits/transactions?limit=10&offset=20',
        {}
      );
    });

    it('should return correct page of results', async () => {
      const page1 = [
        { id: 'tx_1', transaction_type: 'purchase', amount: 50.00, balance_before: 0.00, balance_after: 50.00, description: 'Purchase', created_at: '2024-01-01T00:00:00Z' },
        { id: 'tx_2', transaction_type: 'deduction', amount: -0.01, balance_before: 50.00, balance_after: 49.99, description: 'Scan', created_at: '2024-01-02T00:00:00Z' },
      ];

      const page2 = [
        { id: 'tx_3', transaction_type: 'deduction', amount: -0.01, balance_before: 49.99, balance_after: 49.98, description: 'Scan', created_at: '2024-01-03T00:00:00Z' },
        { id: 'tx_4', transaction_type: 'purchase', amount: 100.00, balance_before: 49.98, balance_after: 149.98, description: 'Purchase', created_at: '2024-01-04T00:00:00Z' },
      ];

      mockHttpClient.get.mockResolvedValueOnce({ data: page1 });
      const result1 = await tiersClient.listTransactions({ limit: 2, offset: 0 });

      mockHttpClient.get.mockResolvedValueOnce({ data: page2 });
      const result2 = await tiersClient.listTransactions({ limit: 2, offset: 2 });

      expect(result1).toHaveLength(2);
      expect(result1[0].id).toBe('tx_1');
      expect(result2).toHaveLength(2);
      expect(result2[0].id).toBe('tx_3');
    });
  });

  describe('error handling', () => {
    it('should handle 401 unauthorized', async () => {
      const mockError = {
        error: {
          message: 'Unauthorized',
          type: 'authentication_error',
          code: 'unauthorized',
        },
      };

      mockHttpClient.get.mockRejectedValueOnce(mockError);

      await expect(tiersClient.getTierInfo()).rejects.toThrow();
    });

    it('should handle 404 user not found', async () => {
      const mockError = {
        error: {
          message: 'User not found',
          type: 'not_found',
          code: 'user_not_found',
        },
      };

      mockHttpClient.get.mockRejectedValueOnce(mockError);

      await expect(tiersClient.getBalance()).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      const mockError = new Error('Network error');

      mockHttpClient.get.mockRejectedValueOnce(mockError);

      await expect(tiersClient.listTransactions()).rejects.toThrow('Network error');
    });
  });
});
