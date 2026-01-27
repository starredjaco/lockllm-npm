/**
 * Tests for Routing Management Client
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RoutingClient } from '../src/routing';
import { HttpClient } from '../src/utils';

// Mock HttpClient
vi.mock('../src/utils', () => {
  return {
    HttpClient: vi.fn().mockImplementation(() => ({
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    })),
  };
});

describe('RoutingClient', () => {
  let routingClient;
  let mockHttpClient;

  beforeEach(() => {
    mockHttpClient = new HttpClient('https://api.lockllm.com', 'test_api_key');
    routingClient = new RoutingClient(mockHttpClient);
    vi.clearAllMocks();
  });

  describe('listRules', () => {
    it('should fetch all routing rules', async () => {
      const mockRules = [
        {
          id: 'rule_1',
          task_type: 'Code Generation',
          complexity_tier: 'high',
          model_name: 'claude-3-7-sonnet',
          provider_preference: 'anthropic',
          use_byok: true,
          enabled: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockHttpClient.get.mockResolvedValueOnce({ data: mockRules });

      const result = await routingClient.listRules();

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/routing', undefined);
      expect(result).toEqual(mockRules);
    });

    it('should return empty array when no rules', async () => {
      mockHttpClient.get.mockResolvedValueOnce({ data: [] });

      const result = await routingClient.listRules();

      expect(result).toEqual([]);
    });
  });

  describe('getRule', () => {
    it('should fetch single rule by ID', async () => {
      const mockRule = {
        id: 'rule_1',
        task_type: 'Code Generation',
        complexity_tier: 'high',
        model_name: 'claude-3-7-sonnet',
        provider_preference: 'anthropic',
        use_byok: true,
        enabled: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockHttpClient.get.mockResolvedValueOnce({ data: mockRule });

      const result = await routingClient.getRule('rule_1');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/routing/rule_1', undefined);
      expect(result).toEqual(mockRule);
    });

    it('should throw error when rule not found', async () => {
      const mockError = {
        error: {
          message: 'Rule not found',
          type: 'not_found',
        },
      };

      mockHttpClient.get.mockRejectedValueOnce(mockError);

      await expect(routingClient.getRule('nonexistent')).rejects.toThrow();
    });
  });

  describe('createRule', () => {
    it('should create new routing rule', async () => {
      const createRequest = {
        task_type: 'Code Generation',
        complexity_tier: 'high',
        model_name: 'claude-3-7-sonnet',
        provider_preference: 'anthropic',
        use_byok: true,
      };

      const mockResponse = {
        id: 'rule_1',
        ...createRequest,
        enabled: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockHttpClient.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await routingClient.createRule(createRequest);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/v1/routing', createRequest, undefined);
      expect(result.id).toBe('rule_1');
    });

    it('should validate task_type from enum', async () => {
      const createRequest = {
        task_type: 'Invalid Type',
        complexity_tier: 'high',
        model_name: 'gpt-4',
        provider_preference: 'openai',
      };

      const mockError = {
        error: {
          message: 'Invalid task_type',
          type: 'validation_error',
        },
      };

      mockHttpClient.post.mockRejectedValueOnce(mockError);

      await expect(routingClient.createRule(createRequest)).rejects.toThrow();
    });

    it('should default use_byok to false', async () => {
      const createRequest = {
        task_type: 'Summarization',
        complexity_tier: 'low',
        model_name: 'gpt-3.5-turbo',
        provider_preference: 'openai',
      };

      const mockResponse = {
        id: 'rule_1',
        ...createRequest,
        use_byok: false,
        enabled: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockHttpClient.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await routingClient.createRule(createRequest);

      expect(result.use_byok).toBe(false);
    });

    it('should throw error on duplicate rule', async () => {
      const createRequest = {
        task_type: 'Code Generation',
        complexity_tier: 'high',
        model_name: 'claude-3-7-sonnet',
        provider_preference: 'anthropic',
      };

      const mockError = {
        error: {
          message: 'Duplicate routing rule',
          type: 'conflict',
        },
      };

      mockHttpClient.post.mockRejectedValueOnce(mockError);

      await expect(routingClient.createRule(createRequest)).rejects.toThrow();
    });
  });

  describe('updateRule', () => {
    it('should update model_name', async () => {
      const updateRequest = {
        model_name: 'gpt-4',
      };

      const mockResponse = {
        id: 'rule_1',
        task_type: 'Code Generation',
        complexity_tier: 'high',
        model_name: 'gpt-4',
        provider_preference: 'openai',
        use_byok: true,
        enabled: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      mockHttpClient.put.mockResolvedValueOnce({ data: mockResponse });

      const result = await routingClient.updateRule('rule_1', updateRequest);

      expect(result.model_name).toBe('gpt-4');
    });

    it('should update enabled flag', async () => {
      const updateRequest = {
        enabled: false,
      };

      const mockResponse = {
        id: 'rule_1',
        task_type: 'Code Generation',
        complexity_tier: 'high',
        model_name: 'claude-3-7-sonnet',
        provider_preference: 'anthropic',
        use_byok: true,
        enabled: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      mockHttpClient.put.mockResolvedValueOnce({ data: mockResponse });

      const result = await routingClient.updateRule('rule_1', updateRequest);

      expect(result.enabled).toBe(false);
    });
  });

  describe('deleteRule', () => {
    it('should delete rule by ID', async () => {
      mockHttpClient.delete.mockResolvedValueOnce();

      await routingClient.deleteRule('rule_1');

      expect(mockHttpClient.delete).toHaveBeenCalledWith('/api/v1/routing/rule_1', undefined);
    });
  });
});
