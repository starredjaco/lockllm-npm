/**
 * Tests for error classes and error parsing
 */

import { describe, it, expect } from 'vitest';
import {
  LockLLMError,
  AuthenticationError,
  RateLimitError,
  PromptInjectionError,
  UpstreamError,
  ConfigurationError,
  NetworkError,
  parseError,
} from '../src/errors';

describe('LockLLMError', () => {
  it('should create error with basic properties', () => {
    const error = new LockLLMError({
      message: 'Test error',
      type: 'test_error',
      status: 500,
    });

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Test error');
    expect(error.type).toBe('test_error');
    expect(error.status).toBe(500);
    expect(error.name).toBe('LockLLMError');
  });

  it('should include optional properties', () => {
    const error = new LockLLMError({
      message: 'Test error',
      type: 'test_error',
      status: 400,
      code: 'ERR001',
      requestId: 'req_123',
    });

    expect(error.code).toBe('ERR001');
    expect(error.requestId).toBe('req_123');
  });
});

describe('AuthenticationError', () => {
  it('should create authentication error', () => {
    const error = new AuthenticationError('Invalid API key', 'req_123');

    expect(error).toBeInstanceOf(LockLLMError);
    expect(error.message).toBe('Invalid API key');
    expect(error.type).toBe('authentication_error');
    expect(error.status).toBe(401);
    expect(error.requestId).toBe('req_123');
  });
});

describe('RateLimitError', () => {
  it('should create rate limit error with retry after', () => {
    const error = new RateLimitError('Rate limit exceeded', 5000, 'req_123');

    expect(error).toBeInstanceOf(LockLLMError);
    expect(error.message).toBe('Rate limit exceeded');
    expect(error.type).toBe('rate_limit_error');
    expect(error.status).toBe(429);
    expect(error.retryAfter).toBe(5000);
    expect(error.requestId).toBe('req_123');
  });
});

describe('PromptInjectionError', () => {
  it('should create prompt injection error with scan result', () => {
    const scanResult = {
      safe: false,
      label: 1,
      confidence: 95,
      injection: 92,
      sensitivity: 'medium',
    };

    const error = new PromptInjectionError({
      message: 'Malicious prompt detected',
      scanResult,
      requestId: 'req_123',
    });

    expect(error).toBeInstanceOf(LockLLMError);
    expect(error.message).toBe('Malicious prompt detected');
    expect(error.type).toBe('lockllm_security_error');
    expect(error.status).toBe(400);
    expect(error.scanResult).toEqual(scanResult);
    expect(error.requestId).toBe('req_123');
  });
});

describe('UpstreamError', () => {
  it('should create upstream error', () => {
    const error = new UpstreamError('OpenAI API error', 'openai', 500, 'req_123');

    expect(error).toBeInstanceOf(LockLLMError);
    expect(error.message).toBe('OpenAI API error');
    expect(error.type).toBe('upstream_error');
    expect(error.status).toBe(502);
    expect(error.provider).toBe('openai');
    expect(error.upstreamStatus).toBe(500);
    expect(error.requestId).toBe('req_123');
  });
});

describe('ConfigurationError', () => {
  it('should create configuration error', () => {
    const error = new ConfigurationError('Invalid API key');

    expect(error).toBeInstanceOf(LockLLMError);
    expect(error.message).toBe('Invalid API key');
    expect(error.type).toBe('configuration_error');
    expect(error.status).toBe(400);
  });
});

describe('NetworkError', () => {
  it('should create network error', () => {
    const originalError = new Error('Connection timeout');
    const error = new NetworkError('Network request failed', originalError, 'req_123');

    expect(error).toBeInstanceOf(LockLLMError);
    expect(error.message).toBe('Network request failed');
    expect(error.type).toBe('network_error');
    expect(error.cause).toBe(originalError);
    expect(error.requestId).toBe('req_123');
  });
});

describe('parseError', () => {
  it('should parse authentication error', () => {
    const response = {
      error: {
        message: 'Invalid API key',
        type: 'authentication_error',
      },
    };

    const error = parseError(response, 'req_123');

    expect(error).toBeInstanceOf(AuthenticationError);
    expect(error.message).toBe('Invalid API key');
    expect(error.requestId).toBe('req_123');
  });

  it('should parse rate limit error', () => {
    const response = {
      error: {
        message: 'Rate limit exceeded',
        type: 'rate_limit_error',
      },
    };

    const error = parseError(response, 'req_123');

    expect(error).toBeInstanceOf(RateLimitError);
    expect(error.message).toBe('Rate limit exceeded');
  });

  it('should parse prompt injection error', () => {
    const response = {
      error: {
        message: 'Malicious prompt detected',
        type: 'lockllm_security_error',
        code: 'prompt_injection_detected',
        scan_result: {
          safe: false,
          label: 1,
          confidence: 95,
          injection: 92,
          sensitivity: 'medium',
        },
      },
    };

    const error = parseError(response, 'req_123');

    expect(error).toBeInstanceOf(PromptInjectionError);
    expect(error.message).toBe('Malicious prompt detected');
    if (error instanceof PromptInjectionError) {
      expect(error.scanResult.injection).toBe(92);
    }
  });

  it('should parse upstream error', () => {
    const response = {
      error: {
        message: 'Provider API error',
        type: 'upstream_error',
      },
    };

    const error = parseError(response, 'req_123');

    expect(error).toBeInstanceOf(UpstreamError);
    expect(error.message).toBe('Provider API error');
  });

  it('should parse configuration error', () => {
    const response = {
      error: {
        message: 'Invalid configuration',
        type: 'lockllm_config_error',
      },
    };

    const error = parseError(response, 'req_123');

    expect(error).toBeInstanceOf(ConfigurationError);
    expect(error.message).toBe('Invalid configuration');
  });

  it('should create generic error for unknown type', () => {
    const response = {
      error: {
        message: 'Unknown error',
        type: 'unknown_error',
      },
    };

    const error = parseError(response, 'req_123');

    expect(error).toBeInstanceOf(LockLLMError);
    expect(error.message).toBe('Unknown error');
    expect(error.type).toBe('unknown_error');
  });

  it('should handle missing error object', () => {
    const response = {};

    const error = parseError(response, 'req_123');

    expect(error).toBeInstanceOf(LockLLMError);
    expect(error.message).toContain('Unknown error');
  });

  it('should handle error with no message or type', () => {
    const response = {
      error: {
        code: 'ERR_CODE',
      },
    };

    const error = parseError(response, 'req_123');

    expect(error).toBeInstanceOf(LockLLMError);
    expect(error.message).toBe('An error occurred');
    expect(error.type).toBe('unknown_error');
  });

  it('should use default message when error.message is missing', () => {
    const response = {
      error: {
        type: 'custom_error',
      },
    };

    const error = parseError(response, 'req_123');

    expect(error).toBeInstanceOf(LockLLMError);
    expect(error.message).toBe('An error occurred');
    expect(error.type).toBe('custom_error');
  });
});
