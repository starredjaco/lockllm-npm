/**
 * Tests for main LockLLM client
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LockLLM } from '../src/client';
import { ConfigurationError } from '../src/errors';
import { HttpClient } from '../src/utils';
import { ScanClient } from '../src/scan';

// Mock dependencies
vi.mock('../src/utils', () => ({
  HttpClient: vi.fn().mockImplementation(() => ({
    post: vi.fn(),
    get: vi.fn(),
  })),
}));

vi.mock('../src/scan', () => ({
  ScanClient: vi.fn().mockImplementation(() => ({
    scan: vi.fn(),
  })),
}));

// Get the mocked constructors
const MockHttpClient = vi.mocked(HttpClient);
const MockScanClient = vi.mocked(ScanClient);

describe('LockLLM Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create client with valid config', () => {
      const client = new LockLLM({
        apiKey: 'test_api_key',
      });

      expect(client).toBeDefined();
      expect(client).toBeInstanceOf(LockLLM);
    });

    it('should throw error when API key is missing', () => {
      expect(() => {
        new LockLLM({
          apiKey: '',
        });
      }).toThrow(ConfigurationError);

      expect(() => {
        new LockLLM({});
      }).toThrow(ConfigurationError);
    });

    it('should use default base URL', () => {
      const client = new LockLLM({
        apiKey: 'test_api_key',
      });

      const config = client.getConfig();
      expect(config.baseURL).toBe('https://api.lockllm.com');
    });

    it('should accept custom base URL', () => {
      const customURL = 'https://custom.lockllm.com';

      const client = new LockLLM({
        apiKey: 'test_api_key',
        baseURL: customURL,
      });

      const config = client.getConfig();
      expect(config.baseURL).toBe(customURL);
    });

    it('should use default timeout', () => {
      const client = new LockLLM({
        apiKey: 'test_api_key',
      });

      const config = client.getConfig();
      expect(config.timeout).toBe(60000);
    });

    it('should accept custom timeout', () => {
      const client = new LockLLM({
        apiKey: 'test_api_key',
        timeout: 30000,
      });

      const config = client.getConfig();
      expect(config.timeout).toBe(30000);
    });

    it('should use default max retries', () => {
      const client = new LockLLM({
        apiKey: 'test_api_key',
      });

      const config = client.getConfig();
      expect(config.maxRetries).toBe(3);
    });

    it('should accept custom max retries', () => {
      const client = new LockLLM({
        apiKey: 'test_api_key',
        maxRetries: 5,
      });

      const config = client.getConfig();
      expect(config.maxRetries).toBe(5);
    });

    it('should handle maxRetries of 0', () => {
      const client = new LockLLM({
        apiKey: 'test_api_key',
        maxRetries: 0,
      });

      const config = client.getConfig();
      expect(config.maxRetries).toBe(0);
    });
  });

  describe('scan method', () => {
    it('should provide scan method', () => {
      const client = new LockLLM({
        apiKey: 'test_api_key',
      });

      expect(client.scan).toBeDefined();
      expect(typeof client.scan).toBe('function');
    });

    it('should call scan client', async () => {
      const mockScan = vi.fn().mockResolvedValue({
        request_id: 'req_12345',
        safe: true,
        label: 0,
        confidence: 98,
        injection: 2,
        sensitivity: 'medium',
        usage: {
          requests: 1,
          input_chars: 100,
        },
      });

      MockScanClient.mockImplementationOnce(() => ({
        scan: mockScan,
      }));

      const client = new LockLLM({
        apiKey: 'test_api_key',
      });

      await client.scan({
        input: 'Test prompt',
        sensitivity: 'medium',
      });

      expect(mockScan).toHaveBeenCalledWith({
        input: 'Test prompt',
        sensitivity: 'medium',
      });
    });
  });

  describe('getConfig', () => {
    it('should return current configuration', () => {
      const client = new LockLLM({
        apiKey: 'test_api_key',
        baseURL: 'https://custom.lockllm.com',
        timeout: 45000,
        maxRetries: 4,
      });

      const config = client.getConfig();

      expect(config).toEqual({
        apiKey: 'test_api_key',
        baseURL: 'https://custom.lockllm.com',
        timeout: 45000,
        maxRetries: 4,
      });
    });

    it('should return readonly config', () => {
      const client = new LockLLM({
        apiKey: 'test_api_key',
      });

      const config = client.getConfig();

      // TypeScript should prevent modification, but we can't test that at runtime
      // This just verifies it returns an object with the expected properties
      expect(config).toHaveProperty('apiKey');
      expect(config).toHaveProperty('baseURL');
      expect(config).toHaveProperty('timeout');
      expect(config).toHaveProperty('maxRetries');
    });
  });

  describe('Configuration validation', () => {
    it('should accept valid API key formats', () => {
      // API keys can be any non-empty string
      const validKeys = [
        'test_api_key',
        'sk_1234567890',
        'api-key-with-dashes',
        'UPPERCASE_KEY',
        '12345',
        'key_with_underscores_123',
      ];

      validKeys.forEach((key) => {
        expect(() => {
          new LockLLM({ apiKey: key });
        }).not.toThrow();
      });
    });

    it('should provide helpful error message for missing API key', () => {
      expect(() => {
        new LockLLM({ apiKey: '' });
      }).toThrow('API key is required');

      expect(() => {
        new LockLLM({ apiKey: '' });
      }).toThrow('https://www.lockllm.com/dashboard');
    });
  });

  describe('HTTP Client initialization', () => {
    it('should initialize HTTP client with correct parameters', () => {
      const client = new LockLLM({
        apiKey: 'test_api_key',
        baseURL: 'https://custom.lockllm.com',
        timeout: 45000,
        maxRetries: 5,
      });

      expect(MockHttpClient).toHaveBeenCalledWith(
        'https://custom.lockllm.com',
        'test_api_key',
        45000,
        5
      );
    });

    it('should initialize HTTP client with defaults', () => {
      const client = new LockLLM({
        apiKey: 'test_api_key',
      });

      expect(MockHttpClient).toHaveBeenCalledWith(
        'https://api.lockllm.com',
        'test_api_key',
        60000,
        3
      );
    });
  });

  describe('Scan Client initialization', () => {
    it('should initialize scan client with HTTP client', () => {
      const client = new LockLLM({
        apiKey: 'test_api_key',
      });

      expect(MockScanClient).toHaveBeenCalledWith(expect.any(Object));
    });
  });

  describe('Integration', () => {
    it('should allow chaining configuration', () => {
      const client = new LockLLM({
        apiKey: 'test_api_key',
        baseURL: 'https://custom.lockllm.com',
        timeout: 30000,
        maxRetries: 2,
      });

      const config = client.getConfig();

      expect(config.apiKey).toBe('test_api_key');
      expect(config.baseURL).toBe('https://custom.lockllm.com');
      expect(config.timeout).toBe(30000);
      expect(config.maxRetries).toBe(2);
    });

    it('should maintain immutable config', () => {
      const originalConfig = {
        apiKey: 'test_api_key',
        baseURL: 'https://custom.lockllm.com',
        timeout: 30000,
        maxRetries: 2,
      };

      const client = new LockLLM(originalConfig);

      // Modify original config
      originalConfig.baseURL = 'https://modified.lockllm.com';
      originalConfig.timeout = 10000;

      // Client config should be unchanged
      const clientConfig = client.getConfig();
      expect(clientConfig.baseURL).toBe('https://custom.lockllm.com');
      expect(clientConfig.timeout).toBe(30000);
    });
  });

  describe('Edge cases', () => {
    it('should handle whitespace in API key', () => {
      expect(() => {
        new LockLLM({ apiKey: '   ' });
      }).toThrow(ConfigurationError);
    });

    it('should handle very long API key', () => {
      const longKey = 'a'.repeat(1000);

      expect(() => {
        new LockLLM({ apiKey: longKey });
      }).not.toThrow();
    });

    it('should handle special characters in API key', () => {
      const specialKey = 'test!@#$%^&*()_+-=[]{}|;:,.<>?';

      expect(() => {
        new LockLLM({ apiKey: specialKey });
      }).not.toThrow();
    });

    it('should handle negative timeout', () => {
      // Negative timeout should be accepted (left to underlying HTTP client to handle)
      expect(() => {
        new LockLLM({ apiKey: 'test_api_key', timeout: -1 });
      }).not.toThrow();
    });

    it('should handle negative max retries', () => {
      // Negative max retries should be accepted (left to underlying HTTP client to handle)
      expect(() => {
        new LockLLM({ apiKey: 'test_api_key', maxRetries: -1 });
      }).not.toThrow();
    });

    it('should handle very large timeout', () => {
      expect(() => {
        new LockLLM({ apiKey: 'test_api_key', timeout: Number.MAX_SAFE_INTEGER });
      }).not.toThrow();
    });

    it('should handle very large max retries', () => {
      expect(() => {
        new LockLLM({ apiKey: 'test_api_key', maxRetries: 1000 });
      }).not.toThrow();
    });
  });
});
