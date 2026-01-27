/**
 * Full coverage tests for proxy-headers - targeting uncovered lines (decodeDetailField)
 */

import { describe, it, expect } from 'vitest';
import {
  buildLockLLMHeaders,
  parseProxyMetadata,
  decodeDetailField,
} from '../src/utils/proxy-headers';

describe('decodeDetailField', () => {
  it('should decode valid base64-encoded JSON detail', () => {
    const data = { message: 'Injection detected', confidence: 95 };
    const encoded = btoa(JSON.stringify(data));

    const result = decodeDetailField(encoded);

    expect(result).toEqual(data);
  });

  it('should decode complex nested object', () => {
    const data = {
      violations: [
        {
          category: 'S15',
          name: 'Custom Policy',
          details: {
            reason: 'Contains prohibited content',
            examples: ['example1', 'example2'],
          },
        },
      ],
      metadata: {
        timestamp: '2024-01-27T12:00:00Z',
        version: '1.0',
      },
    };
    const encoded = btoa(JSON.stringify(data));

    const result = decodeDetailField(encoded);

    expect(result).toEqual(data);
  });

  it('should return null for invalid base64', () => {
    const invalid = 'not-valid-base64!!!@@@';

    const result = decodeDetailField(invalid);

    expect(result).toBeNull();
  });

  it('should return null for valid base64 but invalid JSON', () => {
    const notJson = btoa('this is not JSON');

    const result = decodeDetailField(notJson);

    expect(result).toBeNull();
  });

  it('should return null for empty string', () => {
    const result = decodeDetailField('');

    expect(result).toBeNull();
  });

  it('should decode detail with special characters', () => {
    const data = {
      text: 'Hello! <script>alert("xss")</script> @#$%^&*()',
      symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    };
    const encoded = btoa(JSON.stringify(data));

    const result = decodeDetailField(encoded);

    expect(result).toEqual(data);
  });

  it('should decode detail with arrays and numbers', () => {
    const data = {
      scores: [0.1, 0.5, 0.9],
      counts: [1, 2, 3, 4, 5],
      threshold: 0.75,
    };
    const encoded = btoa(JSON.stringify(data));

    const result = decodeDetailField(encoded);

    expect(result).toEqual(data);
  });
});

describe('buildLockLLMHeaders - edge cases', () => {
  it('should handle empty options object', () => {
    const headers = buildLockLLMHeaders({});

    expect(headers).toEqual({});
  });

  it('should handle undefined options', () => {
    const headers = buildLockLLMHeaders(undefined);

    expect(headers).toEqual({});
  });

  it('should handle null abuseAction explicitly', () => {
    const headers = buildLockLLMHeaders({
      scanMode: 'combined',
      abuseAction: null,
    });

    expect(headers).toEqual({
      'x-lockllm-scan-mode': 'combined',
    });
  });

  it('should handle undefined abuseAction', () => {
    const headers = buildLockLLMHeaders({
      scanMode: 'normal',
      abuseAction: undefined,
    });

    expect(headers).toEqual({
      'x-lockllm-scan-mode': 'normal',
    });
  });

  it('should include abuseAction when set to valid value', () => {
    const headers = buildLockLLMHeaders({
      abuseAction: 'block',
    });

    expect(headers).toEqual({
      'x-lockllm-abuse-action': 'block',
    });
  });

  it('should build all headers when all options provided', () => {
    const headers = buildLockLLMHeaders({
      scanMode: 'combined',
      scanAction: 'block',
      policyAction: 'allow_with_warning',
      abuseAction: 'block',
      routeAction: 'auto',
    });

    expect(headers).toEqual({
      'x-lockllm-scan-mode': 'combined',
      'x-lockllm-scan-action': 'block',
      'x-lockllm-policy-action': 'allow_with_warning',
      'x-lockllm-abuse-action': 'block',
      'x-lockllm-route-action': 'auto',
    });
  });
});

describe('parseProxyMetadata - complete coverage', () => {
  it('should parse metadata from Headers object', () => {
    const headers = new Headers({
      'x-request-id': 'req_123',
      'x-lockllm-scanned': 'true',
      'x-lockllm-safe': 'true',
      'x-scan-mode': 'combined',
      'x-lockllm-credits-mode': 'byok',
      'x-lockllm-provider': 'openai',
      'x-lockllm-model': 'gpt-4',
    });

    const metadata = parseProxyMetadata(headers);

    expect(metadata.request_id).toBe('req_123');
    expect(metadata.scanned).toBe(true);
    expect(metadata.safe).toBe(true);
    expect(metadata.scan_mode).toBe('combined');
    expect(metadata.credits_mode).toBe('byok');
    expect(metadata.provider).toBe('openai');
    expect(metadata.model).toBe('gpt-4');
  });

  it('should parse metadata from plain object with lowercase keys', () => {
    const headers = {
      'x-request-id': 'req_456',
      'x-lockllm-scanned': 'true',
      'x-lockllm-safe': 'false',
    };

    const metadata = parseProxyMetadata(headers);

    expect(metadata.request_id).toBe('req_456');
    expect(metadata.scanned).toBe(true);
    expect(metadata.safe).toBe(false);
  });

  it('should handle missing headers with defaults', () => {
    const headers = new Headers();

    const metadata = parseProxyMetadata(headers);

    expect(metadata.request_id).toBe('');
    expect(metadata.scanned).toBe(false);
    expect(metadata.safe).toBe(false);
    expect(metadata.scan_mode).toBe('combined');
    expect(metadata.credits_mode).toBe('byok');
    expect(metadata.provider).toBe('');
    expect(metadata.model).toBeUndefined();
  });

  it('should parse all credit tracking headers', () => {
    const headers = new Headers({
      'x-request-id': 'req_credits',
      'x-lockllm-scanned': 'true',
      'x-lockllm-safe': 'true',
      'x-lockllm-credits-reserved': '2.5',
      'x-lockllm-routing-fee-reserved': '0.5',
      'x-lockllm-credits-deducted': '2.3',
      'x-lockllm-balance-after': '97.7',
    });

    const metadata = parseProxyMetadata(headers);

    expect(metadata.credits_reserved).toBe(2.5);
    expect(metadata.routing_fee_reserved).toBe(0.5);
    expect(metadata.credits_deducted).toBe(2.3);
    expect(metadata.balance_after).toBe(97.7);
  });

  it('should parse scan warning with all fields', () => {
    const headers = new Headers({
      'x-request-id': 'req_warn',
      'x-lockllm-scanned': 'true',
      'x-lockllm-safe': 'true',
      'x-lockllm-scan-warning': 'true',
      'x-lockllm-injection-score': '75.5',
      'x-lockllm-confidence': '92.3',
      'x-lockllm-scan-detail': 'Suspicious pattern detected',
    });

    const metadata = parseProxyMetadata(headers);

    expect(metadata.scan_warning).toBeDefined();
    expect(metadata.scan_warning.injection_score).toBe(75.5);
    expect(metadata.scan_warning.confidence).toBe(92.3);
    expect(metadata.scan_warning.detail).toBe('Suspicious pattern detected');
  });

  it('should parse policy warnings with all fields', () => {
    const headers = new Headers({
      'x-request-id': 'req_policy',
      'x-lockllm-scanned': 'true',
      'x-lockllm-safe': 'true',
      'x-lockllm-policy-warnings': 'true',
      'x-lockllm-warning-count': '3',
      'x-lockllm-policy-confidence': '88.5',
      'x-lockllm-warning-detail': 'Multiple policy violations',
    });

    const metadata = parseProxyMetadata(headers);

    expect(metadata.policy_warnings).toBeDefined();
    expect(metadata.policy_warnings.count).toBe(3);
    expect(metadata.policy_warnings.confidence).toBe(88.5);
    expect(metadata.policy_warnings.detail).toBe('Multiple policy violations');
  });

  it('should parse abuse detection with all fields', () => {
    const headers = new Headers({
      'x-request-id': 'req_abuse',
      'x-lockllm-scanned': 'true',
      'x-lockllm-safe': 'false',
      'x-lockllm-abuse-detected': 'true',
      'x-lockllm-abuse-confidence': '95.5',
      'x-lockllm-abuse-types': 'bot_generated,rapid_requests',
      'x-lockllm-abuse-detail': 'Automated abuse detected',
    });

    const metadata = parseProxyMetadata(headers);

    expect(metadata.abuse_detected).toBeDefined();
    expect(metadata.abuse_detected.confidence).toBe(95.5);
    expect(metadata.abuse_detected.types).toBe('bot_generated,rapid_requests');
    expect(metadata.abuse_detected.detail).toBe('Automated abuse detected');
  });

  it('should parse routing metadata with all fields', () => {
    const headers = new Headers({
      'x-request-id': 'req_route',
      'x-lockllm-scanned': 'true',
      'x-lockllm-safe': 'true',
      'x-lockllm-route-enabled': 'true',
      'x-lockllm-task-type': 'code_generation',
      'x-lockllm-complexity': '0.85',
      'x-lockllm-selected-model': 'claude-3-7-sonnet',
      'x-lockllm-routing-reason': 'High complexity task',
      'x-lockllm-original-provider': 'openai',
      'x-lockllm-original-model': 'gpt-4',
      'x-lockllm-estimated-savings': '1.25',
    });

    const metadata = parseProxyMetadata(headers);

    expect(metadata.routing).toBeDefined();
    expect(metadata.routing.enabled).toBe(true);
    expect(metadata.routing.task_type).toBe('code_generation');
    expect(metadata.routing.complexity).toBe(0.85);
    expect(metadata.routing.selected_model).toBe('claude-3-7-sonnet');
    expect(metadata.routing.routing_reason).toBe('High complexity task');
    expect(metadata.routing.original_provider).toBe('openai');
    expect(metadata.routing.original_model).toBe('gpt-4');
    expect(metadata.routing.estimated_savings).toBe(1.25);
  });

  it('should handle routing disabled', () => {
    const headers = new Headers({
      'x-request-id': 'req_no_route',
      'x-lockllm-scanned': 'true',
      'x-lockllm-safe': 'true',
    });

    const metadata = parseProxyMetadata(headers);

    expect(metadata.routing).toBeUndefined();
  });

  it('should handle missing optional fields gracefully', () => {
    const headers = new Headers({
      'x-request-id': 'req_minimal',
      'x-lockllm-scanned': 'true',
      'x-lockllm-safe': 'true',
      'x-lockllm-scan-warning': 'true',
    });

    const metadata = parseProxyMetadata(headers);

    expect(metadata.scan_warning).toBeDefined();
    expect(metadata.scan_warning.injection_score).toBe(0);
    expect(metadata.scan_warning.confidence).toBe(0);
    expect(metadata.scan_warning.detail).toBe('');
  });
});
