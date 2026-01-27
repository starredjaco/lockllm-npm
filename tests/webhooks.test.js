/**
 * Tests for Webhooks Management Client
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebhooksClient } from '../src/webhooks';
import { HttpClient } from '../src/utils';

// Mock HttpClient
vi.mock('../src/utils', () => {
  return {
    HttpClient: vi.fn().mockImplementation(() => ({
      get: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
    })),
  };
});

describe('WebhooksClient', () => {
  let webhooksClient;
  let mockHttpClient;

  beforeEach(() => {
    mockHttpClient = new HttpClient('https://api.lockllm.com', 'test_api_key');
    webhooksClient = new WebhooksClient(mockHttpClient);
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('should fetch all webhooks', async () => {
      const mockWebhooks = [
        {
          id: 'wh_1',
          url: 'https://example.com/webhook',
          enabled: true,
          events: ['scan.unsafe', 'policy.violation'],
          secret: 'whsec_xxx',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'wh_2',
          url: 'https://api.example.com/lockllm-webhook',
          enabled: false,
          events: ['scan.unsafe'],
          secret: 'whsec_yyy',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
      ];

      mockHttpClient.get.mockResolvedValueOnce({ data: mockWebhooks });

      const result = await webhooksClient.list();

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/webhooks', undefined);
      expect(result).toEqual(mockWebhooks);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no webhooks', async () => {
      mockHttpClient.get.mockResolvedValueOnce({ data: [] });

      const result = await webhooksClient.list();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should parse webhook objects correctly', async () => {
      const mockWebhooks = [
        {
          id: 'wh_test',
          url: 'https://webhook.site/test',
          enabled: true,
          events: ['scan.unsafe', 'policy.violation', 'abuse.detected'],
          secret: 'whsec_test123',
          created_at: '2024-01-15T00:00:00Z',
          updated_at: '2024-01-15T00:00:00Z',
        },
      ];

      mockHttpClient.get.mockResolvedValueOnce({ data: mockWebhooks });

      const result = await webhooksClient.list();

      expect(result[0].id).toBe('wh_test');
      expect(result[0].url).toBe('https://webhook.site/test');
      expect(result[0].enabled).toBe(true);
      expect(result[0].events).toEqual(['scan.unsafe', 'policy.violation', 'abuse.detected']);
      expect(result[0].secret).toBe('whsec_test123');
    });
  });

  describe('create', () => {
    it('should create new webhook', async () => {
      const createRequest = {
        url: 'https://example.com/webhook',
        enabled: true,
        events: ['scan.unsafe'],
      };

      const mockResponse = {
        id: 'wh_new',
        ...createRequest,
        secret: 'whsec_generated',
        created_at: '2024-01-20T00:00:00Z',
        updated_at: '2024-01-20T00:00:00Z',
      };

      mockHttpClient.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await webhooksClient.create(createRequest);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/v1/webhooks', createRequest, undefined);
      expect(result.id).toBe('wh_new');
      expect(result.url).toBe('https://example.com/webhook');
    });

    it('should validate URL format', async () => {
      const createRequest = {
        url: 'not-a-valid-url',
        enabled: true,
      };

      const mockError = {
        error: {
          message: 'Invalid URL format',
          type: 'validation_error',
          code: 'invalid_url',
        },
      };

      mockHttpClient.post.mockRejectedValueOnce(mockError);

      await expect(webhooksClient.create(createRequest)).rejects.toThrow();
    });

    it('should default enabled to true', async () => {
      const createRequest = {
        url: 'https://example.com/webhook',
      };

      const mockResponse = {
        id: 'wh_default',
        url: 'https://example.com/webhook',
        enabled: true,
        events: ['scan.unsafe', 'policy.violation', 'abuse.detected'],
        secret: 'whsec_default',
        created_at: '2024-01-21T00:00:00Z',
        updated_at: '2024-01-21T00:00:00Z',
      };

      mockHttpClient.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await webhooksClient.create(createRequest);

      expect(result.enabled).toBe(true);
    });

    it('should default events to all events', async () => {
      const createRequest = {
        url: 'https://example.com/webhook',
      };

      const mockResponse = {
        id: 'wh_all_events',
        url: 'https://example.com/webhook',
        enabled: true,
        events: ['scan.unsafe', 'policy.violation', 'abuse.detected'],
        secret: 'whsec_all',
        created_at: '2024-01-22T00:00:00Z',
        updated_at: '2024-01-22T00:00:00Z',
      };

      mockHttpClient.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await webhooksClient.create(createRequest);

      expect(result.events).toEqual(['scan.unsafe', 'policy.violation', 'abuse.detected']);
    });

    it('should return created webhook with ID and secret', async () => {
      const createRequest = {
        url: 'https://webhook.example.com/lockllm',
        enabled: true,
        events: ['policy.violation'],
      };

      const mockResponse = {
        id: 'wh_123456',
        url: 'https://webhook.example.com/lockllm',
        enabled: true,
        events: ['policy.violation'],
        secret: 'whsec_abc123xyz',
        created_at: '2024-01-23T00:00:00Z',
        updated_at: '2024-01-23T00:00:00Z',
      };

      mockHttpClient.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await webhooksClient.create(createRequest);

      expect(result.id).toBeDefined();
      expect(result.id).toBe('wh_123456');
      expect(result.secret).toBeDefined();
      expect(result.secret).toBe('whsec_abc123xyz');
    });

    it('should support custom events array', async () => {
      const createRequest = {
        url: 'https://example.com/webhook',
        enabled: true,
        events: ['abuse.detected'],
      };

      const mockResponse = {
        id: 'wh_custom',
        ...createRequest,
        secret: 'whsec_custom',
        created_at: '2024-01-24T00:00:00Z',
        updated_at: '2024-01-24T00:00:00Z',
      };

      mockHttpClient.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await webhooksClient.create(createRequest);

      expect(result.events).toEqual(['abuse.detected']);
    });
  });

  describe('delete', () => {
    it('should delete webhook by ID', async () => {
      mockHttpClient.delete.mockResolvedValueOnce();

      await webhooksClient.delete('wh_delete_me');

      expect(mockHttpClient.delete).toHaveBeenCalledWith('/api/v1/webhooks/wh_delete_me', undefined);
    });

    it('should throw error when webhook not found', async () => {
      const mockError = {
        error: {
          message: 'Webhook not found',
          type: 'not_found',
          code: 'webhook_not_found',
        },
      };

      mockHttpClient.delete.mockRejectedValueOnce(mockError);

      await expect(webhooksClient.delete('nonexistent')).rejects.toThrow();
    });

    it('should handle successful deletion', async () => {
      mockHttpClient.delete.mockResolvedValueOnce();

      await expect(webhooksClient.delete('wh_valid')).resolves.toBeUndefined();
    });
  });

  describe('validation', () => {
    it('should validate URL is HTTPS', async () => {
      const createRequest = {
        url: 'http://example.com/webhook',
        enabled: true,
      };

      const mockError = {
        error: {
          message: 'Webhook URL must use HTTPS',
          type: 'validation_error',
          code: 'url_not_https',
        },
      };

      mockHttpClient.post.mockRejectedValueOnce(mockError);

      await expect(webhooksClient.create(createRequest)).rejects.toThrow();
    });

    it('should validate URL format', async () => {
      const createRequest = {
        url: 'invalid-url-format',
      };

      const mockError = {
        error: {
          message: 'Invalid URL format',
          type: 'validation_error',
          code: 'invalid_url_format',
        },
      };

      mockHttpClient.post.mockRejectedValueOnce(mockError);

      await expect(webhooksClient.create(createRequest)).rejects.toThrow();
    });

    it('should handle 400 validation errors', async () => {
      const createRequest = {
        url: 'https://',
        events: ['invalid_event'],
      };

      const mockError = {
        error: {
          message: 'Validation failed',
          type: 'validation_error',
          code: 'invalid_input',
        },
      };

      mockHttpClient.post.mockRejectedValueOnce(mockError);

      await expect(webhooksClient.create(createRequest)).rejects.toThrow();
    });

    it('should validate events array', async () => {
      const createRequest = {
        url: 'https://example.com/webhook',
        events: ['unknown.event'],
      };

      const mockError = {
        error: {
          message: 'Invalid event type',
          type: 'validation_error',
          code: 'invalid_event_type',
        },
      };

      mockHttpClient.post.mockRejectedValueOnce(mockError);

      await expect(webhooksClient.create(createRequest)).rejects.toThrow();
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

      await expect(webhooksClient.list()).rejects.toThrow();
    });

    it('should handle 404 webhook not found', async () => {
      const mockError = {
        error: {
          message: 'Webhook not found',
          type: 'not_found',
          code: 'webhook_not_found',
        },
      };

      mockHttpClient.delete.mockRejectedValueOnce(mockError);

      await expect(webhooksClient.delete('wh_missing')).rejects.toThrow();
    });

    it('should handle 409 duplicate webhook URL', async () => {
      const createRequest = {
        url: 'https://example.com/webhook',
      };

      const mockError = {
        error: {
          message: 'Webhook URL already exists',
          type: 'conflict',
          code: 'duplicate_webhook_url',
        },
      };

      mockHttpClient.post.mockRejectedValueOnce(mockError);

      await expect(webhooksClient.create(createRequest)).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      const mockError = new Error('Connection timeout');

      mockHttpClient.get.mockRejectedValueOnce(mockError);

      await expect(webhooksClient.list()).rejects.toThrow('Connection timeout');
    });
  });

  describe('event types', () => {
    it('should support scan.unsafe event', async () => {
      const createRequest = {
        url: 'https://example.com/webhook',
        events: ['scan.unsafe'],
      };

      const mockResponse = {
        id: 'wh_scan_unsafe',
        ...createRequest,
        enabled: true,
        secret: 'whsec_scan',
        created_at: '2024-01-25T00:00:00Z',
        updated_at: '2024-01-25T00:00:00Z',
      };

      mockHttpClient.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await webhooksClient.create(createRequest);

      expect(result.events).toContain('scan.unsafe');
    });

    it('should support policy.violation event', async () => {
      const createRequest = {
        url: 'https://example.com/webhook',
        events: ['policy.violation'],
      };

      const mockResponse = {
        id: 'wh_policy',
        ...createRequest,
        enabled: true,
        secret: 'whsec_policy',
        created_at: '2024-01-26T00:00:00Z',
        updated_at: '2024-01-26T00:00:00Z',
      };

      mockHttpClient.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await webhooksClient.create(createRequest);

      expect(result.events).toContain('policy.violation');
    });

    it('should support abuse.detected event', async () => {
      const createRequest = {
        url: 'https://example.com/webhook',
        events: ['abuse.detected'],
      };

      const mockResponse = {
        id: 'wh_abuse',
        ...createRequest,
        enabled: true,
        secret: 'whsec_abuse',
        created_at: '2024-01-27T00:00:00Z',
        updated_at: '2024-01-27T00:00:00Z',
      };

      mockHttpClient.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await webhooksClient.create(createRequest);

      expect(result.events).toContain('abuse.detected');
    });

    it('should support multiple events', async () => {
      const createRequest = {
        url: 'https://example.com/webhook',
        events: ['scan.unsafe', 'policy.violation', 'abuse.detected'],
      };

      const mockResponse = {
        id: 'wh_multi',
        ...createRequest,
        enabled: true,
        secret: 'whsec_multi',
        created_at: '2024-01-28T00:00:00Z',
        updated_at: '2024-01-28T00:00:00Z',
      };

      mockHttpClient.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await webhooksClient.create(createRequest);

      expect(result.events).toHaveLength(3);
      expect(result.events).toContain('scan.unsafe');
      expect(result.events).toContain('policy.violation');
      expect(result.events).toContain('abuse.detected');
    });
  });
});
