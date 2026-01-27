/**
 * Tests for Activity Logs Client
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LogsClient } from '../src/logs';
import { HttpClient } from '../src/utils';

// Mock HttpClient
vi.mock('../src/utils', () => {
  return {
    HttpClient: vi.fn().mockImplementation(() => ({
      get: vi.fn(),
    })),
  };
});

describe('LogsClient', () => {
  let logsClient;
  let mockHttpClient;

  beforeEach(() => {
    mockHttpClient = new HttpClient('https://api.lockllm.com', 'test_api_key');
    logsClient = new LogsClient(mockHttpClient);
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('should fetch activity logs', async () => {
      const mockLogs = [
        {
          id: 'log_1',
          log_type: 'scan_api',
          request_id: 'req_123',
          status: 'success',
          scan_result: {
            safe: true,
            label: 0,
            confidence: 98,
            injection: 2,
            sensitivity: 'medium',
          },
          prompt_length: 100,
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'log_2',
          log_type: 'proxy_request',
          log_subtype: 'proxy_forward',
          request_id: 'req_124',
          status: 'success',
          provider: 'openai',
          model: 'gpt-4',
          created_at: '2024-01-02T00:00:00Z',
        },
      ];

      mockHttpClient.get.mockResolvedValueOnce({ data: mockLogs });

      const result = await logsClient.list();

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/logs', undefined);
      expect(result).toEqual(mockLogs);
      expect(result).toHaveLength(2);
    });

    it('should filter by log_type', async () => {
      const mockLogs = [
        {
          id: 'log_1',
          log_type: 'scan_api',
          request_id: 'req_123',
          status: 'success',
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockHttpClient.get.mockResolvedValueOnce({ data: mockLogs });

      const result = await logsClient.list({ log_type: 'scan_api' });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/api/v1/logs',
        expect.objectContaining({
          params: expect.objectContaining({ log_type: 'scan_api' }),
        })
      );
      expect(result.every((log) => log.log_type === 'scan_api')).toBe(true);
    });

    it('should filter by status', async () => {
      const mockLogs = [
        {
          id: 'log_1',
          log_type: 'webhook_delivery',
          request_id: 'req_125',
          status: 'failure',
          webhook_url: 'https://example.com/webhook',
          webhook_status: 500,
          created_at: '2024-01-03T00:00:00Z',
        },
      ];

      mockHttpClient.get.mockResolvedValueOnce({ data: mockLogs });

      const result = await logsClient.list({ status: 'failure' });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/api/v1/logs',
        expect.objectContaining({
          params: expect.objectContaining({ status: 'failure' }),
        })
      );
      expect(result.every((log) => log.status === 'failure')).toBe(true);
    });

    it('should filter by date range (start_date, end_date)', async () => {
      const mockLogs = [
        {
          id: 'log_1',
          log_type: 'scan_api',
          request_id: 'req_126',
          status: 'success',
          created_at: '2024-01-15T00:00:00Z',
        },
      ];

      mockHttpClient.get.mockResolvedValueOnce({ data: mockLogs });

      const result = await logsClient.list({
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-01-31T23:59:59Z',
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/api/v1/logs',
        expect.objectContaining({
          params: expect.objectContaining({
            start_date: '2024-01-01T00:00:00Z',
            end_date: '2024-01-31T23:59:59Z',
          }),
        })
      );
    });

    it('should support pagination (limit, offset)', async () => {
      const mockLogs = [
        {
          id: 'log_11',
          log_type: 'scan_api',
          request_id: 'req_127',
          status: 'success',
          created_at: '2024-01-10T00:00:00Z',
        },
      ];

      mockHttpClient.get.mockResolvedValueOnce({ data: mockLogs });

      const result = await logsClient.list({ limit: 10, offset: 10 });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/api/v1/logs',
        expect.objectContaining({
          params: expect.objectContaining({ limit: 10, offset: 10 }),
        })
      );
    });

    it('should parse log objects with all metadata', async () => {
      const mockLogs = [
        {
          id: 'log_full',
          log_type: 'proxy_request',
          log_subtype: 'proxy_scan',
          request_id: 'req_full',
          status: 'success',
          scan_result: {
            safe: false,
            label: 1,
            confidence: 95,
            injection: 92,
            sensitivity: 'high',
          },
          provider: 'anthropic',
          model: 'claude-3-opus',
          task_type: 'Code Generation',
          complexity_score: 0.85,
          selected_model: 'claude-3-sonnet',
          routing_reason: 'High complexity detected',
          estimated_cost: 0.05,
          credits_deducted: 0.03,
          balance_after: 97.50,
          input_tokens: 1000,
          output_tokens: 500,
          created_at: '2024-01-20T00:00:00Z',
        },
      ];

      mockHttpClient.get.mockResolvedValueOnce({ data: mockLogs });

      const result = await logsClient.list();

      const log = result[0];
      expect(log.id).toBe('log_full');
      expect(log.log_type).toBe('proxy_request');
      expect(log.log_subtype).toBe('proxy_scan');
      expect(log.scan_result).toBeDefined();
      expect(log.task_type).toBe('Code Generation');
      expect(log.complexity_score).toBe(0.85);
      expect(log.credits_deducted).toBe(0.03);
    });

    it('should handle empty logs', async () => {
      mockHttpClient.get.mockResolvedValueOnce({ data: [] });

      const result = await logsClient.list();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('get', () => {
    it('should fetch single log by ID', async () => {
      const mockLog = {
        id: 'log_single',
        log_type: 'scan_api',
        request_id: 'req_single',
        status: 'success',
        scan_result: {
          safe: true,
          label: 0,
          confidence: 98,
          injection: 2,
          sensitivity: 'medium',
        },
        prompt_length: 50,
        created_at: '2024-01-05T00:00:00Z',
      };

      mockHttpClient.get.mockResolvedValueOnce({ data: mockLog });

      const result = await logsClient.get('log_single');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/logs/log_single', undefined);
      expect(result).toEqual(mockLog);
    });

    it('should include all log metadata', async () => {
      const mockLog = {
        id: 'log_detailed',
        log_type: 'proxy_request',
        log_subtype: 'proxy_block',
        request_id: 'req_detailed',
        status: 'error',
        scan_result: {
          safe: false,
          label: 1,
          confidence: 99,
          injection: 98,
          sensitivity: 'high',
          policy_violations: [
            {
              policy_name: 'No Medical Advice',
              violated_categories: [{ name: 'Medical Diagnosis' }],
            },
          ],
        },
        provider: 'openai',
        model: 'gpt-4',
        error_message: 'Blocked due to unsafe content',
        credits_deducted: 0.02,
        balance_after: 98.00,
        created_at: '2024-01-10T00:00:00Z',
      };

      mockHttpClient.get.mockResolvedValueOnce({ data: mockLog });

      const result = await logsClient.get('log_detailed');

      expect(result.scan_result).toBeDefined();
      expect(result.scan_result.policy_violations).toBeDefined();
      expect(result.error_message).toBe('Blocked due to unsafe content');
    });

    it('should throw error when log not found', async () => {
      const mockError = {
        error: {
          message: 'Log not found',
          type: 'not_found',
          code: 'log_not_found',
        },
      };

      mockHttpClient.get.mockRejectedValueOnce(mockError);

      await expect(logsClient.get('nonexistent')).rejects.toThrow();
    });
  });

  describe('log types', () => {
    it('should parse scan_api logs', async () => {
      const mockLogs = [
        {
          id: 'log_scan',
          log_type: 'scan_api',
          request_id: 'req_scan',
          status: 'success',
          scan_result: {
            safe: true,
            label: 0,
            confidence: 98,
            injection: 2,
            sensitivity: 'medium',
          },
          prompt_length: 100,
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockHttpClient.get.mockResolvedValueOnce({ data: mockLogs });

      const result = await logsClient.list({ log_type: 'scan_api' });

      expect(result[0].log_type).toBe('scan_api');
      expect(result[0].scan_result).toBeDefined();
      expect(result[0].prompt_length).toBeDefined();
    });

    it('should parse webhook_delivery logs', async () => {
      const mockLogs = [
        {
          id: 'log_webhook',
          log_type: 'webhook_delivery',
          request_id: 'req_webhook',
          status: 'success',
          webhook_url: 'https://example.com/webhook',
          webhook_status: 200,
          response_time_ms: 150,
          retry_count: 0,
          created_at: '2024-01-02T00:00:00Z',
        },
      ];

      mockHttpClient.get.mockResolvedValueOnce({ data: mockLogs });

      const result = await logsClient.list({ log_type: 'webhook_delivery' });

      expect(result[0].log_type).toBe('webhook_delivery');
      expect(result[0].webhook_url).toBeDefined();
      expect(result[0].webhook_status).toBe(200);
      expect(result[0].response_time_ms).toBeDefined();
    });

    it('should parse proxy_request logs', async () => {
      const mockLogs = [
        {
          id: 'log_proxy',
          log_type: 'proxy_request',
          log_subtype: 'proxy_forward',
          request_id: 'req_proxy',
          status: 'success',
          provider: 'anthropic',
          model: 'claude-3-sonnet',
          input_tokens: 500,
          output_tokens: 200,
          credits_deducted: 0.01,
          balance_after: 99.00,
          created_at: '2024-01-03T00:00:00Z',
        },
      ];

      mockHttpClient.get.mockResolvedValueOnce({ data: mockLogs });

      const result = await logsClient.list({ log_type: 'proxy_request' });

      expect(result[0].log_type).toBe('proxy_request');
      expect(result[0].log_subtype).toBe('proxy_forward');
      expect(result[0].provider).toBeDefined();
      expect(result[0].model).toBeDefined();
    });

    it('should include type-specific metadata', async () => {
      const mockLogs = [
        {
          id: 'log_proxy_scan',
          log_type: 'proxy_request',
          log_subtype: 'proxy_scan',
          request_id: 'req_proxy_scan',
          status: 'success',
          provider: 'openai',
          model: 'gpt-4',
          scan_result: {
            safe: true,
            label: 0,
            confidence: 99,
            injection: 1,
            sensitivity: 'low',
          },
          task_type: 'Summarization',
          complexity_score: 0.3,
          created_at: '2024-01-04T00:00:00Z',
        },
      ];

      mockHttpClient.get.mockResolvedValueOnce({ data: mockLogs });

      const result = await logsClient.list({ log_type: 'proxy_request' });

      expect(result[0].scan_result).toBeDefined();
      expect(result[0].task_type).toBe('Summarization');
      expect(result[0].complexity_score).toBe(0.3);
    });
  });

  describe('metadata parsing', () => {
    it('should parse scan_result when present', async () => {
      const mockLogs = [
        {
          id: 'log_1',
          log_type: 'scan_api',
          request_id: 'req_1',
          status: 'success',
          scan_result: {
            safe: false,
            label: 1,
            confidence: 95,
            injection: 92,
            sensitivity: 'high',
          },
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockHttpClient.get.mockResolvedValueOnce({ data: mockLogs });

      const result = await logsClient.list();

      expect(result[0].scan_result).toBeDefined();
      expect(result[0].scan_result.safe).toBe(false);
      expect(result[0].scan_result.confidence).toBe(95);
    });

    it('should parse routing metadata when present', async () => {
      const mockLogs = [
        {
          id: 'log_routing',
          log_type: 'proxy_request',
          request_id: 'req_routing',
          status: 'success',
          provider: 'anthropic',
          model: 'claude-3-opus',
          task_type: 'Code Generation',
          complexity_score: 0.75,
          selected_model: 'claude-3-sonnet',
          routing_reason: 'Medium complexity, cost optimization',
          estimated_cost: 0.03,
          created_at: '2024-01-05T00:00:00Z',
        },
      ];

      mockHttpClient.get.mockResolvedValueOnce({ data: mockLogs });

      const result = await logsClient.list();

      expect(result[0].task_type).toBe('Code Generation');
      expect(result[0].complexity_score).toBe(0.75);
      expect(result[0].selected_model).toBe('claude-3-sonnet');
      expect(result[0].routing_reason).toBeDefined();
    });

    it('should parse credit tracking when present', async () => {
      const mockLogs = [
        {
          id: 'log_credits',
          log_type: 'proxy_request',
          request_id: 'req_credits',
          status: 'success',
          provider: 'openai',
          model: 'gpt-3.5-turbo',
          credits_deducted: 0.015,
          balance_after: 84.50,
          input_tokens: 1500,
          output_tokens: 300,
          created_at: '2024-01-06T00:00:00Z',
        },
      ];

      mockHttpClient.get.mockResolvedValueOnce({ data: mockLogs });

      const result = await logsClient.list();

      expect(result[0].credits_deducted).toBe(0.015);
      expect(result[0].balance_after).toBe(84.50);
      expect(result[0].input_tokens).toBe(1500);
      expect(result[0].output_tokens).toBe(300);
    });

    it('should parse error_message when present', async () => {
      const mockLogs = [
        {
          id: 'log_error',
          log_type: 'webhook_delivery',
          request_id: 'req_error',
          status: 'error',
          webhook_url: 'https://example.com/webhook',
          webhook_status: 500,
          error_message: 'Internal Server Error',
          retry_count: 3,
          created_at: '2024-01-07T00:00:00Z',
        },
      ];

      mockHttpClient.get.mockResolvedValueOnce({ data: mockLogs });

      const result = await logsClient.list();

      expect(result[0].error_message).toBe('Internal Server Error');
      expect(result[0].status).toBe('error');
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

      await expect(logsClient.list()).rejects.toThrow();
    });

    it('should handle 400 invalid query', async () => {
      const mockError = {
        error: {
          message: 'Invalid query parameters',
          type: 'invalid_request',
          code: 'invalid_query',
        },
      };

      mockHttpClient.get.mockRejectedValueOnce(mockError);

      await expect(
        logsClient.list({ log_type: 'invalid_type' })
      ).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      const mockError = new Error('Network timeout');

      mockHttpClient.get.mockRejectedValueOnce(mockError);

      await expect(logsClient.list()).rejects.toThrow('Network timeout');
    });
  });
});
