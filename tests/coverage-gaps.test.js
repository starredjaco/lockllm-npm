import { describe, it, expect, vi } from 'vitest';
import {
  parseError,
  InsufficientCreditsError,
  ConfigurationError,
  LockLLMError,
} from '../src/errors';
import { parseProxyMetadata, buildLockLLMHeaders } from '../src/utils/proxy-headers';

// ============================================================
// errors.ts - parseError balance/credits code branches (lines 311-326)
// ============================================================
describe('parseError - balance/credits error codes', () => {
  it('should parse no_balance error code', () => {
    const response = {
      error: {
        code: 'no_balance',
        message: 'No balance found',
        type: 'lockllm_balance_error',
        request_id: 'req_no_bal',
        current_balance: 0,
        estimated_cost: 0.01,
      },
    };

    const error = parseError(response, 'req_fallback');

    expect(error).toBeInstanceOf(InsufficientCreditsError);
    expect(error.message).toBe('No balance found');
    expect(error.requestId).toBe('req_no_bal');
    expect(error.current_balance).toBe(0);
    expect(error.estimated_cost).toBe(0.01);
  });

  it('should parse balance_check_failed error code', () => {
    const response = {
      error: {
        code: 'balance_check_failed',
        message: 'Balance check failed',
        type: 'lockllm_balance_error',
        current_balance: 5.0,
        estimated_cost: 10.0,
      },
    };

    const error = parseError(response);

    expect(error).toBeInstanceOf(InsufficientCreditsError);
    expect(error.message).toBe('Balance check failed');
    expect(error.current_balance).toBe(5.0);
    expect(error.estimated_cost).toBe(10.0);
  });

  it('should parse credits_unavailable error code', () => {
    const response = {
      error: {
        code: 'credits_unavailable',
        message: 'Credits unavailable',
        type: 'lockllm_balance_error',
        request_id: 'req_cred_unavail',
      },
    };

    const error = parseError(response);

    expect(error).toBeInstanceOf(InsufficientCreditsError);
    expect(error.message).toBe('Credits unavailable');
    expect(error.requestId).toBe('req_cred_unavail');
    expect(error.current_balance).toBe(0);
    expect(error.estimated_cost).toBe(0);
  });

  it('should parse invalid_provider_for_credits_mode error code', () => {
    const response = {
      error: {
        code: 'invalid_provider_for_credits_mode',
        message: 'Provider not supported in credits mode',
        type: 'lockllm_balance_error',
        current_balance: 100,
        estimated_cost: 0.05,
      },
    };

    const error = parseError(response);

    expect(error).toBeInstanceOf(InsufficientCreditsError);
    expect(error.message).toBe('Provider not supported in credits mode');
    expect(error.current_balance).toBe(100);
    expect(error.estimated_cost).toBe(0.05);
  });

  it('should use fallback requestId for balance errors when error.request_id is missing', () => {
    const response = {
      error: {
        code: 'no_balance',
        message: 'No balance',
        type: 'lockllm_balance_error',
      },
    };

    const error = parseError(response, 'req_fb');

    expect(error).toBeInstanceOf(InsufficientCreditsError);
    expect(error.requestId).toBe('req_fb');
  });

  it('should parse insufficient_routing_credits error code', () => {
    const response = {
      error: {
        code: 'insufficient_routing_credits',
        message: 'Not enough credits for routing',
        type: 'lockllm_balance_error',
        current_balance: 0.01,
        estimated_cost: 0.50,
      },
    };

    const error = parseError(response);

    expect(error).toBeInstanceOf(InsufficientCreditsError);
    expect(error.message).toBe('Not enough credits for routing');
  });
});

// ============================================================
// errors.ts - parseError configuration error codes
// ============================================================
describe('parseError - configuration error codes', () => {
  it('should parse lockllm_config_error type', () => {
    const response = {
      error: {
        type: 'lockllm_config_error',
        message: 'Config error occurred',
        code: 'some_config_code',
      },
    };

    const error = parseError(response);

    expect(error).toBeInstanceOf(ConfigurationError);
    expect(error.message).toBe('Config error occurred');
  });

  it('should parse no_upstream_key code', () => {
    const response = {
      error: {
        code: 'no_upstream_key',
        message: 'No upstream key configured',
        type: 'config_error',
      },
    };

    const error = parseError(response);

    expect(error).toBeInstanceOf(ConfigurationError);
    expect(error.message).toBe('No upstream key configured');
  });

  it('should parse no_byok_key code', () => {
    const response = {
      error: {
        code: 'no_byok_key',
        message: 'No BYOK key found for provider',
        type: 'config_error',
      },
    };

    const error = parseError(response);

    expect(error).toBeInstanceOf(ConfigurationError);
    expect(error.message).toBe('No BYOK key found for provider');
  });
});

// ============================================================
// errors.ts - parseError generic fallback
// ============================================================
describe('parseError - generic error fallback', () => {
  it('should return generic LockLLMError for unknown error types', () => {
    const response = {
      error: {
        type: 'some_unknown_type',
        message: 'Something went wrong',
        code: 'unknown_code',
      },
    };

    const error = parseError(response, 'req_generic');

    expect(error).toBeInstanceOf(LockLLMError);
    expect(error.message).toBe('Something went wrong');
    expect(error.type).toBe('some_unknown_type');
    expect(error.code).toBe('unknown_code');
    expect(error.requestId).toBe('req_generic');
  });

  it('should handle missing message in generic error', () => {
    const response = {
      error: {
        type: 'unknown',
      },
    };

    const error = parseError(response);

    expect(error).toBeInstanceOf(LockLLMError);
    expect(error.message).toBe('An error occurred');
  });

  it('should handle missing type in generic error', () => {
    const response = {
      error: {
        message: 'Some error',
      },
    };

    const error = parseError(response);

    expect(error).toBeInstanceOf(LockLLMError);
    expect(error.type).toBe('unknown_error');
  });
});

// ============================================================
// proxy-headers.ts - parseProxyMetadata tokens_saved and cost_saved
// ============================================================
describe('parseProxyMetadata - cache and credit metadata', () => {
  it('should parse tokens_saved header', () => {
    const headers = {
      'x-request-id': 'req_123',
      'x-lockllm-scanned': 'true',
      'x-lockllm-safe': 'true',
      'x-scan-mode': 'combined',
      'x-lockllm-credits-mode': 'byok',
      'x-lockllm-provider': 'openai',
      'x-lockllm-cache-status': 'HIT',
      'x-lockllm-tokens-saved': '5000',
    };

    const metadata = parseProxyMetadata(headers);

    expect(metadata.cache_status).toBe('HIT');
    expect(metadata.tokens_saved).toBe(5000);
  });

  it('should parse cost_saved header', () => {
    const headers = {
      'x-request-id': 'req_124',
      'x-lockllm-scanned': 'true',
      'x-lockllm-safe': 'true',
      'x-scan-mode': 'combined',
      'x-lockllm-credits-mode': 'byok',
      'x-lockllm-provider': 'openai',
      'x-lockllm-cost-saved': '0.035',
    };

    const metadata = parseProxyMetadata(headers);

    expect(metadata.cost_saved).toBe(0.035);
  });

  it('should parse both tokens_saved and cost_saved together', () => {
    const headers = {
      'x-request-id': 'req_125',
      'x-lockllm-scanned': 'true',
      'x-lockllm-safe': 'true',
      'x-scan-mode': 'combined',
      'x-lockllm-credits-mode': 'lockllm_credits',
      'x-lockllm-provider': 'anthropic',
      'x-lockllm-cache-status': 'HIT',
      'x-lockllm-cache-age': '1800',
      'x-lockllm-tokens-saved': '12000',
      'x-lockllm-cost-saved': '0.15',
    };

    const metadata = parseProxyMetadata(headers);

    expect(metadata.cache_status).toBe('HIT');
    expect(metadata.cache_age).toBe(1800);
    expect(metadata.tokens_saved).toBe(12000);
    expect(metadata.cost_saved).toBe(0.15);
  });

  it('should not set tokens_saved when header is missing', () => {
    const headers = {
      'x-request-id': 'req_126',
      'x-lockllm-scanned': 'false',
      'x-lockllm-safe': 'true',
      'x-scan-mode': 'combined',
      'x-lockllm-credits-mode': 'byok',
      'x-lockllm-provider': 'openai',
    };

    const metadata = parseProxyMetadata(headers);

    expect(metadata.tokens_saved).toBeUndefined();
    expect(metadata.cost_saved).toBeUndefined();
  });

  it('should parse credits_deducted header', () => {
    const headers = {
      'x-request-id': 'req_127',
      'x-lockllm-scanned': 'true',
      'x-lockllm-safe': 'false',
      'x-scan-mode': 'combined',
      'x-lockllm-credits-mode': 'lockllm_credits',
      'x-lockllm-provider': 'openai',
      'x-lockllm-credits-deducted': '0.02',
    };

    const metadata = parseProxyMetadata(headers);

    expect(metadata.credits_deducted).toBe(0.02);
  });

  it('should parse balance_after header', () => {
    const headers = {
      'x-request-id': 'req_128',
      'x-lockllm-scanned': 'true',
      'x-lockllm-safe': 'false',
      'x-scan-mode': 'combined',
      'x-lockllm-credits-mode': 'lockllm_credits',
      'x-lockllm-provider': 'openai',
      'x-lockllm-balance-after': '99.98',
    };

    const metadata = parseProxyMetadata(headers);

    expect(metadata.balance_after).toBe(99.98);
  });

  it('should parse all credit tracking headers together', () => {
    const headers = {
      'x-request-id': 'req_129',
      'x-lockllm-scanned': 'true',
      'x-lockllm-safe': 'false',
      'x-scan-mode': 'combined',
      'x-lockllm-credits-mode': 'lockllm_credits',
      'x-lockllm-provider': 'openai',
      'x-lockllm-credits-reserved': '0.10',
      'x-lockllm-routing-fee-reserved': '0.05',
      'x-lockllm-credits-deducted': '0.08',
      'x-lockllm-balance-after': '49.92',
      'x-lockllm-cache-status': 'MISS',
      'x-lockllm-tokens-saved': '0',
      'x-lockllm-cost-saved': '0',
    };

    const metadata = parseProxyMetadata(headers);

    expect(metadata.credits_reserved).toBe(0.10);
    expect(metadata.routing_fee_reserved).toBe(0.05);
    expect(metadata.credits_deducted).toBe(0.08);
    expect(metadata.balance_after).toBe(49.92);
    expect(metadata.cache_status).toBe('MISS');
    expect(metadata.tokens_saved).toBe(0);
    expect(metadata.cost_saved).toBe(0);
  });

  it('should parse metadata from Headers instance with tokens_saved and cost_saved', () => {
    const headers = new Headers();
    headers.set('x-request-id', 'req_130');
    headers.set('x-lockllm-scanned', 'true');
    headers.set('x-lockllm-safe', 'true');
    headers.set('x-scan-mode', 'combined');
    headers.set('x-lockllm-credits-mode', 'byok');
    headers.set('x-lockllm-provider', 'anthropic');
    headers.set('x-lockllm-cache-status', 'HIT');
    headers.set('x-lockllm-tokens-saved', '8000');
    headers.set('x-lockllm-cost-saved', '0.24');

    const metadata = parseProxyMetadata(headers);

    expect(metadata.cache_status).toBe('HIT');
    expect(metadata.tokens_saved).toBe(8000);
    expect(metadata.cost_saved).toBe(0.24);
  });
});

// ============================================================
// proxy-headers.ts - buildLockLLMHeaders with cacheResponse and cacheTTL
// ============================================================
describe('buildLockLLMHeaders - cache options', () => {
  it('should set cache-response to false when explicitly disabled', () => {
    const headers = buildLockLLMHeaders({ cacheResponse: false });
    expect(headers['x-lockllm-cache-response']).toBe('false');
  });

  it('should not set cache-response when cacheResponse is true', () => {
    const headers = buildLockLLMHeaders({ cacheResponse: true });
    expect(headers['x-lockllm-cache-response']).toBeUndefined();
  });

  it('should not set cache-response when cacheResponse is undefined', () => {
    const headers = buildLockLLMHeaders({});
    expect(headers['x-lockllm-cache-response']).toBeUndefined();
  });

  it('should set cache-ttl when provided', () => {
    const headers = buildLockLLMHeaders({ cacheTTL: 7200 });
    expect(headers['x-lockllm-cache-ttl']).toBe('7200');
  });

  it('should set cache-ttl to 0', () => {
    const headers = buildLockLLMHeaders({ cacheTTL: 0 });
    expect(headers['x-lockllm-cache-ttl']).toBe('0');
  });

  it('should not set cache-ttl when undefined', () => {
    const headers = buildLockLLMHeaders({});
    expect(headers['x-lockllm-cache-ttl']).toBeUndefined();
  });
});

// ============================================================
// Wrapper branch coverage - proxyOptions.headers branch
// ============================================================
describe('Wrapper branch coverage - proxyOptions.headers', () => {
  it('createOpenAI with proxyOptions.headers should merge custom headers', async () => {
    const { createOpenAI } = await import('../src/wrappers/openai-wrapper');

    const client = createOpenAI({
      apiKey: 'test-key',
      proxyOptions: {
        scanMode: 'combined',
        scanAction: 'block',
        headers: { 'x-custom-openai': 'custom-value' },
      },
    });

    expect(client).toBeDefined();
  });

  it('createOpenAI with proxyOptions but no headers', async () => {
    const { createOpenAI } = await import('../src/wrappers/openai-wrapper');

    const client = createOpenAI({
      apiKey: 'test-key',
      proxyOptions: {
        scanMode: 'normal',
      },
    });

    expect(client).toBeDefined();
  });

  it('createOpenAI with defaultHeaders and proxyOptions.headers', async () => {
    const { createOpenAI } = await import('../src/wrappers/openai-wrapper');

    const client = createOpenAI({
      apiKey: 'test-key',
      defaultHeaders: { 'x-existing': 'existing' },
      proxyOptions: {
        scanAction: 'block',
        headers: { 'x-override': 'override-val' },
      },
    });

    expect(client).toBeDefined();
  });

  it('createAnthropic with proxyOptions.headers should merge custom headers', async () => {
    const { createAnthropic } = await import('../src/wrappers/anthropic-wrapper');

    const client = createAnthropic({
      apiKey: 'test-key',
      proxyOptions: {
        policyAction: 'block',
        abuseAction: 'allow_with_warning',
        headers: { 'x-custom-anthropic': 'custom-value' },
      },
    });

    expect(client).toBeDefined();
  });

  it('createAnthropic with proxyOptions but no headers', async () => {
    const { createAnthropic } = await import('../src/wrappers/anthropic-wrapper');

    const client = createAnthropic({
      apiKey: 'test-key',
      proxyOptions: {
        scanMode: 'policy_only',
      },
    });

    expect(client).toBeDefined();
  });

  it('createAnthropic with defaultHeaders and proxyOptions.headers', async () => {
    const { createAnthropic } = await import('../src/wrappers/anthropic-wrapper');

    const client = createAnthropic({
      apiKey: 'test-key',
      defaultHeaders: { 'x-base-header': 'base-val' },
      proxyOptions: {
        routeAction: 'auto',
        headers: { 'x-extra': 'extra-val' },
      },
    });

    expect(client).toBeDefined();
  });

  it('createClient (generic) with proxyOptions.headers', async () => {
    const { createClient } = await import('../src/wrappers/generic-wrapper');

    class MockClient {
      constructor(config) {
        this.config = config;
      }
    }

    const client = createClient('openai', MockClient, {
      apiKey: 'test-key',
      proxyOptions: {
        scanMode: 'combined',
        headers: { 'x-generic-custom': 'test' },
      },
    });

    expect(client).toBeDefined();
    expect(client.config.defaultHeaders['x-generic-custom']).toBe('test');
    expect(client.config.defaultHeaders['x-lockllm-scan-mode']).toBe('combined');
  });

  it('createClient (generic) with proxyOptions but no headers', async () => {
    const { createClient } = await import('../src/wrappers/generic-wrapper');

    class MockClient {
      constructor(config) {
        this.config = config;
      }
    }

    const client = createClient('groq', MockClient, {
      apiKey: 'test-key',
      proxyOptions: {
        scanAction: 'block',
      },
    });

    expect(client).toBeDefined();
    expect(client.config.defaultHeaders['x-lockllm-scan-action']).toBe('block');
  });

  it('createClient (generic) without proxyOptions', async () => {
    const { createClient } = await import('../src/wrappers/generic-wrapper');

    class MockClient {
      constructor(config) {
        this.config = config;
      }
    }

    const client = createClient('deepseek', MockClient, {
      apiKey: 'test-key',
    });

    expect(client).toBeDefined();
    expect(client.config.baseURL).toBe('https://api.lockllm.com/v1/proxy/deepseek');
  });

  it('createClient (generic) with custom baseURL', async () => {
    const { createClient } = await import('../src/wrappers/generic-wrapper');

    class MockClient {
      constructor(config) {
        this.config = config;
      }
    }

    const client = createClient('openai', MockClient, {
      apiKey: 'test-key',
      baseURL: 'https://custom.example.com',
    });

    expect(client).toBeDefined();
    expect(client.config.baseURL).toBe('https://custom.example.com');
  });
});

// ============================================================
// generic-wrapper.ts - getGenericOpenAIConstructor module loading branches
// ============================================================
describe('getGenericOpenAIConstructor - module shape branches', () => {
  it('should return module.default when available', async () => {
    const { getGenericOpenAIConstructor } = await import('../src/wrappers/generic-wrapper');

    const MockDefault = class {};
    const mockRequire = vi.fn().mockReturnValue({ default: MockDefault });

    const result = getGenericOpenAIConstructor(mockRequire);
    expect(result).toBe(MockDefault);
  });

  it('should return module.OpenAI when default is not available', async () => {
    const { getGenericOpenAIConstructor } = await import('../src/wrappers/generic-wrapper');

    const MockOpenAI = class {};
    const mockRequire = vi.fn().mockReturnValue({ OpenAI: MockOpenAI });

    const result = getGenericOpenAIConstructor(mockRequire);
    expect(result).toBe(MockOpenAI);
  });

  it('should return module itself when neither default nor OpenAI is available', async () => {
    const { getGenericOpenAIConstructor } = await import('../src/wrappers/generic-wrapper');

    const MockModule = class {};
    const mockRequire = vi.fn().mockReturnValue(MockModule);

    const result = getGenericOpenAIConstructor(mockRequire);
    expect(result).toBe(MockModule);
  });

  it('should throw when module is not found', async () => {
    const { getGenericOpenAIConstructor } = await import('../src/wrappers/generic-wrapper');

    const mockRequire = vi.fn().mockImplementation(() => {
      throw new Error('Cannot find module');
    });

    expect(() => getGenericOpenAIConstructor(mockRequire)).toThrow(
      'OpenAI SDK not found'
    );
  });
});
