/**
 * Tests for Anthropic Wrapper with Advanced Headers
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createAnthropic } from '../../src/wrappers/anthropic-wrapper';

// Mock the @anthropic-ai/sdk module
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn().mockImplementation((config) => {
      return {
        messages: {
          create: vi.fn().mockResolvedValue({
            id: 'msg_123',
            content: [{ text: 'Test response' }],
          }),
        },
        _config: config,
      };
    }),
  };
});

describe.skip('Anthropic Wrapper with Headers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create wrapper with ProxyRequestOptions', () => {
    const client = createAnthropic({
      apiKey: 'test_key',
      proxyOptions: {
        scanMode: 'combined',
        scanAction: 'block',
      },
    });

    expect(client).toBeDefined();
    expect(client._config).toBeDefined();
  });

  it('should send scan mode header to proxy', () => {
    const client = createAnthropic({
      apiKey: 'test_key',
      proxyOptions: {
        scanMode: 'normal',
      },
    });

    expect(client._config.defaultHeaders['x-lockllm-scan-mode']).toBe('normal');
  });

  it('should send action headers to proxy', () => {
    const client = createAnthropic({
      apiKey: 'test_key',
      proxyOptions: {
        scanAction: 'block',
        policyAction: 'allow_with_warning',
      },
    });

    expect(client._config.defaultHeaders['x-lockllm-scan-action']).toBe('block');
    expect(client._config.defaultHeaders['x-lockllm-policy-action']).toBe('allow_with_warning');
  });

  it('should send routing header to proxy', () => {
    const client = createAnthropic({
      apiKey: 'test_key',
      proxyOptions: {
        routeAction: 'auto',
      },
    });

    expect(client._config.defaultHeaders['x-lockllm-route-action']).toBe('auto');
  });

  it('should send abuse detection header to proxy', () => {
    const client = createAnthropic({
      apiKey: 'test_key',
      proxyOptions: {
        abuseAction: 'block',
      },
    });

    expect(client._config.defaultHeaders['x-lockllm-abuse-action']).toBe('block');
  });

  it('should handle null abuseAction (opt-out)', () => {
    const client = createAnthropic({
      apiKey: 'test_key',
      proxyOptions: {
        abuseAction: null,
      },
    });

    expect(client._config.defaultHeaders['x-lockllm-abuse-action']).toBeUndefined();
  });

  it('should merge custom headers with LockLLM headers', () => {
    const client = createAnthropic({
      apiKey: 'test_key',
      defaultHeaders: {
        'X-Custom-Header': 'custom-value',
      },
      proxyOptions: {
        scanMode: 'combined',
        headers: {
          'X-Another-Header': 'another-value',
        },
      },
    });

    expect(client._config.defaultHeaders['X-Custom-Header']).toBe('custom-value');
    expect(client._config.defaultHeaders['x-lockllm-scan-mode']).toBe('combined');
    expect(client._config.defaultHeaders['X-Another-Header']).toBe('another-value');
  });

  it('should use LockLLM proxy base URL', () => {
    const client = createAnthropic({
      apiKey: 'test_key',
    });

    expect(client._config.baseURL).toBe('https://api.lockllm.com/v1/proxy/anthropic');
  });

  it('should allow custom base URL override', () => {
    const client = createAnthropic({
      apiKey: 'test_key',
      baseURL: 'https://custom.proxy.com',
    });

    expect(client._config.baseURL).toBe('https://custom.proxy.com');
  });

  it('should preserve Anthropic SDK options', () => {
    const client = createAnthropic({
      apiKey: 'test_key',
      timeout: 30000,
      maxRetries: 3,
    });

    expect(client._config.apiKey).toBe('test_key');
    expect(client._config.timeout).toBe(30000);
    expect(client._config.maxRetries).toBe(3);
  });

  it('should send multiple LockLLM headers', () => {
    const client = createAnthropic({
      apiKey: 'test_key',
      proxyOptions: {
        scanMode: 'combined',
        scanAction: 'block',
        policyAction: 'allow_with_warning',
        abuseAction: 'block',
        routeAction: 'auto',
      },
    });

    const headers = client._config.defaultHeaders;
    expect(headers['x-lockllm-scan-mode']).toBe('combined');
    expect(headers['x-lockllm-scan-action']).toBe('block');
    expect(headers['x-lockllm-policy-action']).toBe('allow_with_warning');
    expect(headers['x-lockllm-abuse-action']).toBe('block');
    expect(headers['x-lockllm-route-action']).toBe('auto');
  });

  it('should work without proxyOptions', () => {
    const client = createAnthropic({
      apiKey: 'test_key',
    });

    expect(client).toBeDefined();
    expect(client._config.baseURL).toBe('https://api.lockllm.com/v1/proxy/anthropic');
  });

  it('should work with empty proxyOptions', () => {
    const client = createAnthropic({
      apiKey: 'test_key',
      proxyOptions: {},
    });

    expect(client).toBeDefined();
    const lockllmHeaders = Object.keys(client._config.defaultHeaders).filter(
      (key) => key.startsWith('x-lockllm-')
    );
    expect(lockllmHeaders).toHaveLength(0);
  });

  it('should create functional Anthropic client', async () => {
    const client = createAnthropic({
      apiKey: 'test_key',
      proxyOptions: {
        scanMode: 'normal',
      },
    });

    const response = await client.messages.create({
      model: 'claude-3-sonnet',
      max_tokens: 1024,
      messages: [{ role: 'user', content: 'Hello' }],
    });

    expect(response).toBeDefined();
    expect(response.id).toBe('msg_123');
  });

  describe('scan modes', () => {
    it('should support normal mode', () => {
      const client = createAnthropic({
        apiKey: 'test_key',
        proxyOptions: { scanMode: 'normal' },
      });

      expect(client._config.defaultHeaders['x-lockllm-scan-mode']).toBe('normal');
    });

    it('should support policy_only mode', () => {
      const client = createAnthropic({
        apiKey: 'test_key',
        proxyOptions: { scanMode: 'policy_only' },
      });

      expect(client._config.defaultHeaders['x-lockllm-scan-mode']).toBe('policy_only');
    });

    it('should support combined mode', () => {
      const client = createAnthropic({
        apiKey: 'test_key',
        proxyOptions: { scanMode: 'combined' },
      });

      expect(client._config.defaultHeaders['x-lockllm-scan-mode']).toBe('combined');
    });
  });

  describe('scan actions', () => {
    it('should support block action', () => {
      const client = createAnthropic({
        apiKey: 'test_key',
        proxyOptions: { scanAction: 'block' },
      });

      expect(client._config.defaultHeaders['x-lockllm-scan-action']).toBe('block');
    });

    it('should support allow_with_warning action', () => {
      const client = createAnthropic({
        apiKey: 'test_key',
        proxyOptions: { scanAction: 'allow_with_warning' },
      });

      expect(client._config.defaultHeaders['x-lockllm-scan-action']).toBe('allow_with_warning');
    });
  });

  describe('routing actions', () => {
    it('should support disabled routing', () => {
      const client = createAnthropic({
        apiKey: 'test_key',
        proxyOptions: { routeAction: 'disabled' },
      });

      expect(client._config.defaultHeaders['x-lockllm-route-action']).toBe('disabled');
    });

    it('should support auto routing', () => {
      const client = createAnthropic({
        apiKey: 'test_key',
        proxyOptions: { routeAction: 'auto' },
      });

      expect(client._config.defaultHeaders['x-lockllm-route-action']).toBe('auto');
    });

    it('should support custom routing', () => {
      const client = createAnthropic({
        apiKey: 'test_key',
        proxyOptions: { routeAction: 'custom' },
      });

      expect(client._config.defaultHeaders['x-lockllm-route-action']).toBe('custom');
    });
  });

  describe('header priority', () => {
    it('should not override SDK headers with custom headers', () => {
      const client = createAnthropic({
        apiKey: 'test_key',
        defaultHeaders: {
          'x-lockllm-scan-mode': 'wrong-value',
        },
        proxyOptions: {
          scanMode: 'combined',
        },
      });

      expect(client._config.defaultHeaders['x-lockllm-scan-mode']).toBe('combined');
    });

    it('should preserve non-LockLLM custom headers', () => {
      const client = createAnthropic({
        apiKey: 'test_key',
        defaultHeaders: {
          'X-API-Version': '2024-01',
          'X-Client-ID': 'client-123',
        },
        proxyOptions: {
          scanMode: 'normal',
        },
      });

      expect(client._config.defaultHeaders['X-API-Version']).toBe('2024-01');
      expect(client._config.defaultHeaders['X-Client-ID']).toBe('client-123');
      expect(client._config.defaultHeaders['x-lockllm-scan-mode']).toBe('normal');
    });
  });

  describe('Anthropic-specific features', () => {
    it('should preserve anthropic-version header', () => {
      const client = createAnthropic({
        apiKey: 'test_key',
        defaultHeaders: {
          'anthropic-version': '2023-06-01',
        },
        proxyOptions: {
          scanMode: 'normal',
        },
      });

      expect(client._config.defaultHeaders['anthropic-version']).toBe('2023-06-01');
      expect(client._config.defaultHeaders['x-lockllm-scan-mode']).toBe('normal');
    });
  });
});
