/**
 * Tests for PII-related features and remaining coverage gaps
 * Covers: PIIDetectedError, parseError PII branch, scan piiAction header,
 * proxy-headers blocked status, proxy-headers PII parsing, buildLockLLMHeaders piiAction
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  PIIDetectedError,
  parseError,
} from '../src/errors';
import {
  buildLockLLMHeaders,
  parseProxyMetadata,
} from '../src/utils/proxy-headers';

// ============================================================
// errors.ts - PIIDetectedError constructor (lines 203-212)
// ============================================================
describe('PIIDetectedError', () => {
  it('should create PII detected error with details', () => {
    const error = new PIIDetectedError({
      message: 'PII detected in prompt',
      pii_details: {
        entity_types: ['email', 'phone_number'],
        entity_count: 3,
      },
      requestId: 'req_pii_001',
    });

    expect(error).toBeInstanceOf(PIIDetectedError);
    expect(error.name).toBe('PIIDetectedError');
    expect(error.message).toBe('PII detected in prompt');
    expect(error.type).toBe('lockllm_pii_error');
    expect(error.code).toBe('pii_detected');
    expect(error.status).toBe(403);
    expect(error.requestId).toBe('req_pii_001');
    expect(error.pii_details).toEqual({
      entity_types: ['email', 'phone_number'],
      entity_count: 3,
    });
  });

  it('should create PII detected error without requestId', () => {
    const error = new PIIDetectedError({
      message: 'PII found',
      pii_details: {
        entity_types: ['ssn'],
        entity_count: 1,
      },
    });

    expect(error.name).toBe('PIIDetectedError');
    expect(error.requestId).toBeUndefined();
    expect(error.pii_details.entity_types).toEqual(['ssn']);
    expect(error.pii_details.entity_count).toBe(1);
  });

  it('should be an instance of Error', () => {
    const error = new PIIDetectedError({
      message: 'PII error',
      pii_details: {
        entity_types: [],
        entity_count: 0,
      },
    });

    expect(error).toBeInstanceOf(Error);
  });
});

// ============================================================
// errors.ts - parseError PII detected branch (lines 295-303)
// ============================================================
describe('parseError - PII detected error', () => {
  it('should parse pii_detected error from API response', () => {
    const response = {
      error: {
        code: 'pii_detected',
        message: 'Personal information detected',
        type: 'lockllm_pii_error',
        request_id: 'req_pii_parse',
        pii_details: {
          entity_types: ['email', 'credit_card'],
          entity_count: 2,
        },
      },
    };

    const error = parseError(response, 'req_fallback');

    expect(error).toBeInstanceOf(PIIDetectedError);
    expect(error.message).toBe('Personal information detected');
    expect(error.requestId).toBe('req_pii_parse');
    expect(error.pii_details).toEqual({
      entity_types: ['email', 'credit_card'],
      entity_count: 2,
    });
  });

  it('should use fallback requestId when error.request_id is missing for PII', () => {
    const response = {
      error: {
        code: 'pii_detected',
        message: 'PII found',
        type: 'lockllm_pii_error',
        pii_details: {
          entity_types: ['address'],
          entity_count: 1,
        },
      },
    };

    const error = parseError(response, 'req_pii_fallback');

    expect(error).toBeInstanceOf(PIIDetectedError);
    expect(error.requestId).toBe('req_pii_fallback');
  });

  it('should NOT match pii_detected without pii_details', () => {
    const response = {
      error: {
        code: 'pii_detected',
        message: 'PII detected but no details',
        type: 'lockllm_pii_error',
      },
    };

    const error = parseError(response);

    // Should fall through to generic error, not PIIDetectedError
    expect(error).not.toBeInstanceOf(PIIDetectedError);
  });
});

// ============================================================
// scan.ts - piiAction header (lines 94-95)
// ============================================================
describe('ScanClient - piiAction header', () => {
  it('should set x-lockllm-pii-action header when piiAction is provided', async () => {
    let capturedHeaders = {};

    const mockHttp = {
      post: vi.fn().mockImplementation(async (url, body, options) => {
        capturedHeaders = options?.headers || {};
        return {
          data: {
            request_id: 'req_pii_scan',
            safe: true,
            label: 0,
            sensitivity: 'medium',
            confidence: 99,
            injection: 0,
          },
        };
      }),
    };

    const { ScanClient } = await import('../src/scan');
    const scanClient = new ScanClient(mockHttp);

    await scanClient.scan(
      { input: 'My email is test@example.com' },
      { piiAction: 'block' }
    );

    expect(mockHttp.post).toHaveBeenCalled();
    expect(capturedHeaders['x-lockllm-pii-action']).toBe('block');
  });

  it('should set piiAction to strip', async () => {
    let capturedHeaders = {};

    const mockHttp = {
      post: vi.fn().mockImplementation(async (url, body, options) => {
        capturedHeaders = options?.headers || {};
        return {
          data: {
            request_id: 'req_pii_strip',
            safe: true,
            label: 0,
            sensitivity: 'medium',
            confidence: 99,
            injection: 0,
          },
        };
      }),
    };

    const { ScanClient } = await import('../src/scan');
    const scanClient = new ScanClient(mockHttp);

    await scanClient.scan(
      { input: 'Test prompt' },
      { piiAction: 'strip' }
    );

    expect(capturedHeaders['x-lockllm-pii-action']).toBe('strip');
  });

  it('should set piiAction to allow_with_warning', async () => {
    let capturedHeaders = {};

    const mockHttp = {
      post: vi.fn().mockImplementation(async (url, body, options) => {
        capturedHeaders = options?.headers || {};
        return {
          data: {
            request_id: 'req_pii_warn',
            safe: true,
            label: 0,
            sensitivity: 'medium',
            confidence: 99,
            injection: 0,
          },
        };
      }),
    };

    const { ScanClient } = await import('../src/scan');
    const scanClient = new ScanClient(mockHttp);

    await scanClient.scan(
      { input: 'Test prompt' },
      { piiAction: 'allow_with_warning' }
    );

    expect(capturedHeaders['x-lockllm-pii-action']).toBe('allow_with_warning');
  });

  it('should NOT set pii-action header when piiAction is undefined', async () => {
    let capturedHeaders = {};

    const mockHttp = {
      post: vi.fn().mockImplementation(async (url, body, options) => {
        capturedHeaders = options?.headers || {};
        return {
          data: {
            request_id: 'req_no_pii',
            safe: true,
            label: 0,
            sensitivity: 'medium',
            confidence: 99,
            injection: 0,
          },
        };
      }),
    };

    const { ScanClient } = await import('../src/scan');
    const scanClient = new ScanClient(mockHttp);

    await scanClient.scan(
      { input: 'Test prompt' },
      { scanAction: 'block' }
    );

    expect(capturedHeaders['x-lockllm-pii-action']).toBeUndefined();
  });

  it('should NOT set pii-action header when piiAction is null', async () => {
    let capturedHeaders = {};

    const mockHttp = {
      post: vi.fn().mockImplementation(async (url, body, options) => {
        capturedHeaders = options?.headers || {};
        return {
          data: {
            request_id: 'req_null_pii',
            safe: true,
            label: 0,
            sensitivity: 'medium',
            confidence: 99,
            injection: 0,
          },
        };
      }),
    };

    const { ScanClient } = await import('../src/scan');
    const scanClient = new ScanClient(mockHttp);

    await scanClient.scan(
      { input: 'Test prompt' },
      { piiAction: null }
    );

    expect(capturedHeaders['x-lockllm-pii-action']).toBeUndefined();
  });
});

// ============================================================
// proxy-headers.ts - blocked status (lines 103-105)
// ============================================================
describe('parseProxyMetadata - blocked status', () => {
  it('should parse blocked=true', () => {
    const headers = new Headers({
      'x-request-id': 'req_blocked',
      'x-lockllm-scanned': 'true',
      'x-lockllm-safe': 'false',
      'x-lockllm-blocked': 'true',
    });

    const metadata = parseProxyMetadata(headers);

    expect(metadata.blocked).toBe(true);
  });

  it('should not set blocked when header is false', () => {
    const headers = new Headers({
      'x-request-id': 'req_not_blocked',
      'x-lockllm-scanned': 'true',
      'x-lockllm-safe': 'true',
      'x-lockllm-blocked': 'false',
    });

    const metadata = parseProxyMetadata(headers);

    expect(metadata.blocked).toBeUndefined();
  });

  it('should not set blocked when header is absent', () => {
    const headers = new Headers({
      'x-request-id': 'req_no_blocked',
      'x-lockllm-scanned': 'true',
      'x-lockllm-safe': 'true',
    });

    const metadata = parseProxyMetadata(headers);

    expect(metadata.blocked).toBeUndefined();
  });
});

// ============================================================
// proxy-headers.ts - PII detection parsing (lines 151-162)
// ============================================================
describe('parseProxyMetadata - PII detection', () => {
  it('should parse PII detected=true with all fields', () => {
    const headers = new Headers({
      'x-request-id': 'req_pii_meta',
      'x-lockllm-scanned': 'true',
      'x-lockllm-safe': 'true',
      'x-lockllm-pii-detected': 'true',
      'x-lockllm-pii-types': 'email,phone_number,ssn',
      'x-lockllm-pii-count': '5',
      'x-lockllm-pii-action': 'strip',
    });

    const metadata = parseProxyMetadata(headers);

    expect(metadata.pii_detected).toBeDefined();
    expect(metadata.pii_detected.detected).toBe(true);
    expect(metadata.pii_detected.entity_types).toBe('email,phone_number,ssn');
    expect(metadata.pii_detected.entity_count).toBe(5);
    expect(metadata.pii_detected.action).toBe('strip');
  });

  it('should parse PII detected=false', () => {
    const headers = new Headers({
      'x-request-id': 'req_pii_false',
      'x-lockllm-scanned': 'true',
      'x-lockllm-safe': 'true',
      'x-lockllm-pii-detected': 'false',
    });

    const metadata = parseProxyMetadata(headers);

    expect(metadata.pii_detected).toBeDefined();
    expect(metadata.pii_detected.detected).toBe(false);
    expect(metadata.pii_detected.entity_types).toBe('');
    expect(metadata.pii_detected.entity_count).toBe(0);
    expect(metadata.pii_detected.action).toBe('');
  });

  it('should handle PII with missing optional fields', () => {
    const headers = new Headers({
      'x-request-id': 'req_pii_partial',
      'x-lockllm-scanned': 'true',
      'x-lockllm-safe': 'true',
      'x-lockllm-pii-detected': 'true',
    });

    const metadata = parseProxyMetadata(headers);

    expect(metadata.pii_detected).toBeDefined();
    expect(metadata.pii_detected.detected).toBe(true);
    expect(metadata.pii_detected.entity_types).toBe('');
    expect(metadata.pii_detected.entity_count).toBe(0);
    expect(metadata.pii_detected.action).toBe('');
  });

  it('should not set pii_detected when header is absent', () => {
    const headers = new Headers({
      'x-request-id': 'req_no_pii',
      'x-lockllm-scanned': 'true',
      'x-lockllm-safe': 'true',
    });

    const metadata = parseProxyMetadata(headers);

    expect(metadata.pii_detected).toBeUndefined();
  });
});

// ============================================================
// proxy-headers.ts - buildLockLLMHeaders with piiAction (lines 46-48)
// ============================================================
describe('buildLockLLMHeaders - piiAction', () => {
  it('should set pii-action header when piiAction is block', () => {
    const headers = buildLockLLMHeaders({ piiAction: 'block' });

    expect(headers['x-lockllm-pii-action']).toBe('block');
  });

  it('should set pii-action header when piiAction is strip', () => {
    const headers = buildLockLLMHeaders({ piiAction: 'strip' });

    expect(headers['x-lockllm-pii-action']).toBe('strip');
  });

  it('should set pii-action header when piiAction is allow_with_warning', () => {
    const headers = buildLockLLMHeaders({ piiAction: 'allow_with_warning' });

    expect(headers['x-lockllm-pii-action']).toBe('allow_with_warning');
  });

  it('should not set pii-action header when piiAction is null', () => {
    const headers = buildLockLLMHeaders({ piiAction: null });

    expect(headers['x-lockllm-pii-action']).toBeUndefined();
  });

  it('should not set pii-action header when piiAction is undefined', () => {
    const headers = buildLockLLMHeaders({ piiAction: undefined });

    expect(headers['x-lockllm-pii-action']).toBeUndefined();
  });
});

// ============================================================
// proxy-headers.ts - buildLockLLMHeaders with sensitivity (lines 51-53)
// ============================================================
describe('buildLockLLMHeaders - sensitivity', () => {
  it('should set sensitivity header when provided', () => {
    const headers = buildLockLLMHeaders({ sensitivity: 'high' });

    expect(headers['x-lockllm-sensitivity']).toBe('high');
  });

  it('should set sensitivity to low', () => {
    const headers = buildLockLLMHeaders({ sensitivity: 'low' });

    expect(headers['x-lockllm-sensitivity']).toBe('low');
  });

  it('should set sensitivity to medium', () => {
    const headers = buildLockLLMHeaders({ sensitivity: 'medium' });

    expect(headers['x-lockllm-sensitivity']).toBe('medium');
  });

  it('should not set sensitivity header when not provided', () => {
    const headers = buildLockLLMHeaders({});

    expect(headers['x-lockllm-sensitivity']).toBeUndefined();
  });
});

// ============================================================
// proxy-headers.ts - parseProxyMetadata sensitivity + label (lines 90-99)
// ============================================================
describe('parseProxyMetadata - sensitivity and label', () => {
  it('should parse sensitivity from response headers', () => {
    const headers = new Headers({
      'x-request-id': 'req_sens',
      'x-lockllm-scanned': 'true',
      'x-lockllm-safe': 'true',
      'x-lockllm-sensitivity': 'high',
    });

    const metadata = parseProxyMetadata(headers);

    expect(metadata.sensitivity).toBe('high');
  });

  it('should not set sensitivity when header is absent', () => {
    const headers = new Headers({
      'x-request-id': 'req_no_sens',
      'x-lockllm-scanned': 'true',
      'x-lockllm-safe': 'true',
    });

    const metadata = parseProxyMetadata(headers);

    expect(metadata.sensitivity).toBeUndefined();
  });

  it('should parse label from response headers', () => {
    const headers = new Headers({
      'x-request-id': 'req_label',
      'x-lockllm-scanned': 'true',
      'x-lockllm-safe': 'false',
      'x-lockllm-label': '1',
    });

    const metadata = parseProxyMetadata(headers);

    expect(metadata.label).toBe(1);
  });

  it('should parse label=0', () => {
    const headers = new Headers({
      'x-request-id': 'req_label_0',
      'x-lockllm-scanned': 'true',
      'x-lockllm-safe': 'true',
      'x-lockllm-label': '0',
    });

    const metadata = parseProxyMetadata(headers);

    expect(metadata.label).toBe(0);
  });

  it('should not set label when header is absent', () => {
    const headers = new Headers({
      'x-request-id': 'req_no_label',
      'x-lockllm-scanned': 'true',
      'x-lockllm-safe': 'true',
    });

    const metadata = parseProxyMetadata(headers);

    expect(metadata.label).toBeUndefined();
  });
});

// ============================================================
// proxy-headers.ts - routing cost/token fields (lines 190-193)
// ============================================================
describe('parseProxyMetadata - routing cost and token fields', () => {
  it('should parse all routing cost and token headers', () => {
    const headers = new Headers({
      'x-request-id': 'req_route_full',
      'x-lockllm-scanned': 'true',
      'x-lockllm-safe': 'true',
      'x-lockllm-route-enabled': 'true',
      'x-lockllm-task-type': 'code_generation',
      'x-lockllm-complexity': '0.85',
      'x-lockllm-selected-model': 'claude-3-7-sonnet',
      'x-lockllm-routing-reason': 'High complexity',
      'x-lockllm-original-provider': 'openai',
      'x-lockllm-original-model': 'gpt-4',
      'x-lockllm-estimated-savings': '1.25',
      'x-lockllm-estimated-original-cost': '5.50',
      'x-lockllm-estimated-routed-cost': '4.25',
      'x-lockllm-estimated-input-tokens': '1500',
      'x-lockllm-estimated-output-tokens': '800',
      'x-lockllm-routing-fee-reason': 'cost_savings',
    });

    const metadata = parseProxyMetadata(headers);

    expect(metadata.routing).toBeDefined();
    expect(metadata.routing.estimated_original_cost).toBe(5.50);
    expect(metadata.routing.estimated_routed_cost).toBe(4.25);
    expect(metadata.routing.estimated_input_tokens).toBe(1500);
    expect(metadata.routing.estimated_output_tokens).toBe(800);
    expect(metadata.routing.routing_fee_reason).toBe('cost_savings');
  });

  it('should default routing cost/token fields to 0 when headers are absent', () => {
    const headers = new Headers({
      'x-request-id': 'req_route_minimal',
      'x-lockllm-scanned': 'true',
      'x-lockllm-safe': 'true',
      'x-lockllm-route-enabled': 'true',
    });

    const metadata = parseProxyMetadata(headers);

    expect(metadata.routing).toBeDefined();
    expect(metadata.routing.estimated_original_cost).toBe(0);
    expect(metadata.routing.estimated_routed_cost).toBe(0);
    expect(metadata.routing.estimated_input_tokens).toBe(0);
    expect(metadata.routing.estimated_output_tokens).toBe(0);
    expect(metadata.routing.routing_fee_reason).toBe('');
  });
});
