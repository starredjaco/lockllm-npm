/**
 * Tests for Proxy Metadata Parsing
 */

import { describe, it, expect } from 'vitest';
import { parseProxyMetadata } from '../../src/utils/proxy-headers';

describe('Proxy Metadata', () => {
  describe('parseProxyMetadata', () => {
    it('should extract request_id from X-Request-Id', () => {
      const headers = new Map([
        ['x-request-id', 'req_12345'],
      ]);

      const metadata = parseProxyMetadata(headers);

      expect(metadata.request_id).toBe('req_12345');
    });

    it('should extract scanned flag from X-LockLLM-Scanned', () => {
      const headers = new Map([
        ['x-request-id', 'req_1'],
        ['x-lockllm-scanned', 'true'],
      ]);

      const metadata = parseProxyMetadata(headers);

      expect(metadata.scanned).toBe(true);
    });

    it('should extract safe flag from X-LockLLM-Safe', () => {
      const headers = new Map([
        ['x-request-id', 'req_1'],
        ['x-lockllm-safe', 'false'],
      ]);

      const metadata = parseProxyMetadata(headers);

      expect(metadata.safe).toBe(false);
    });

    it('should extract scan_mode from X-Scan-Mode', () => {
      const headers = new Map([
        ['x-request-id', 'req_1'],
        ['x-scan-mode', 'combined'],
      ]);

      const metadata = parseProxyMetadata(headers);

      expect(metadata.scan_mode).toBe('combined');
    });

    it('should extract credits_mode from X-LockLLM-Credits-Mode', () => {
      const headers = new Map([
        ['x-request-id', 'req_1'],
        ['x-lockllm-credits-mode', 'byok'],
      ]);

      const metadata = parseProxyMetadata(headers);

      expect(metadata.credits_mode).toBe('byok');
    });

    it('should extract provider from X-LockLLM-Provider', () => {
      const headers = new Map([
        ['x-request-id', 'req_1'],
        ['x-lockllm-provider', 'openai'],
      ]);

      const metadata = parseProxyMetadata(headers);

      expect(metadata.provider).toBe('openai');
    });
  });

  describe('scan warnings metadata', () => {
    it('should parse X-LockLLM-Scan-Warning', () => {
      const headers = new Map([
        ['x-request-id', 'req_1'],
        ['x-lockllm-scan-warning', 'true'],
      ]);

      const metadata = parseProxyMetadata(headers);

      expect(metadata.scan_warning).toBeDefined();
    });

    it('should parse X-LockLLM-Injection-Score', () => {
      const headers = new Map([
        ['x-request-id', 'req_1'],
        ['x-lockllm-scan-warning', 'true'],
        ['x-lockllm-injection-score', '92'],
      ]);

      const metadata = parseProxyMetadata(headers);

      expect(metadata.scan_warning?.injection_score).toBe(92);
    });

    it('should parse X-LockLLM-Confidence', () => {
      const headers = new Map([
        ['x-request-id', 'req_1'],
        ['x-lockllm-scan-warning', 'true'],
        ['x-lockllm-confidence', '95'],
      ]);

      const metadata = parseProxyMetadata(headers);

      expect(metadata.scan_warning?.confidence).toBe(95);
    });

    it('should decode X-LockLLM-Scan-Detail (base64)', () => {
      const detail = { message: 'Prompt injection detected', label: 1 };
      const encoded = Buffer.from(JSON.stringify(detail)).toString('base64');

      const headers = new Map([
        ['x-request-id', 'req_1'],
        ['x-lockllm-scan-warning', 'true'],
        ['x-lockllm-scan-detail', encoded],
      ]);

      const metadata = parseProxyMetadata(headers);

      expect(metadata.scan_warning?.detail).toBe(encoded);
    });
  });

  describe('policy warnings metadata', () => {
    it('should parse X-LockLLM-Policy-Warnings', () => {
      const headers = new Map([
        ['x-request-id', 'req_1'],
        ['x-lockllm-policy-warnings', 'true'],
      ]);

      const metadata = parseProxyMetadata(headers);

      expect(metadata.policy_warnings).toBeDefined();
    });

    it('should parse X-LockLLM-Warning-Count', () => {
      const headers = new Map([
        ['x-request-id', 'req_1'],
        ['x-lockllm-policy-warnings', 'true'],
        ['x-lockllm-warning-count', '2'],
      ]);

      const metadata = parseProxyMetadata(headers);

      expect(metadata.policy_warnings?.count).toBe(2);
    });

    it('should parse X-LockLLM-Policy-Confidence', () => {
      const headers = new Map([
        ['x-request-id', 'req_1'],
        ['x-lockllm-policy-warnings', 'true'],
        ['x-lockllm-policy-confidence', '85'],
      ]);

      const metadata = parseProxyMetadata(headers);

      expect(metadata.policy_warnings?.confidence).toBe(85);
    });

    it('should decode X-LockLLM-Warning-Detail (base64)', () => {
      const detail = [
        {
          policy_name: 'No Medical Advice',
          violated_categories: [{ name: 'Medical Diagnosis' }],
        },
      ];
      const encoded = Buffer.from(JSON.stringify(detail)).toString('base64');

      const headers = new Map([
        ['x-request-id', 'req_1'],
        ['x-lockllm-policy-warnings', 'true'],
        ['x-lockllm-warning-detail', encoded],
      ]);

      const metadata = parseProxyMetadata(headers);

      expect(metadata.policy_warnings?.detail).toBe(encoded);
    });
  });

  describe('abuse warnings metadata', () => {
    it('should parse X-LockLLM-Abuse-Detected', () => {
      const headers = new Map([
        ['x-request-id', 'req_1'],
        ['x-lockllm-abuse-detected', 'true'],
      ]);

      const metadata = parseProxyMetadata(headers);

      expect(metadata.abuse_detected).toBeDefined();
    });

    it('should parse X-LockLLM-Abuse-Confidence', () => {
      const headers = new Map([
        ['x-request-id', 'req_1'],
        ['x-lockllm-abuse-detected', 'true'],
        ['x-lockllm-abuse-confidence', '90'],
      ]);

      const metadata = parseProxyMetadata(headers);

      expect(metadata.abuse_detected?.confidence).toBe(90);
    });

    it('should parse X-LockLLM-Abuse-Types (comma-separated)', () => {
      const headers = new Map([
        ['x-request-id', 'req_1'],
        ['x-lockllm-abuse-detected', 'true'],
        ['x-lockllm-abuse-types', 'bot_generated,repetition'],
      ]);

      const metadata = parseProxyMetadata(headers);

      expect(metadata.abuse_detected?.types).toBe('bot_generated,repetition');
    });

    it('should decode X-LockLLM-Abuse-Detail (base64)', () => {
      const detail = {
        abuse_types: ['bot_generated'],
        indicators: { bot_score: 95 },
      };
      const encoded = Buffer.from(JSON.stringify(detail)).toString('base64');

      const headers = new Map([
        ['x-request-id', 'req_1'],
        ['x-lockllm-abuse-detected', 'true'],
        ['x-lockllm-abuse-detail', encoded],
      ]);

      const metadata = parseProxyMetadata(headers);

      expect(metadata.abuse_detected?.detail).toBe(encoded);
    });
  });

  describe('routing metadata', () => {
    it('should parse X-LockLLM-Route-Enabled', () => {
      const headers = new Map([
        ['x-request-id', 'req_1'],
        ['x-lockllm-route-enabled', 'true'],
      ]);

      const metadata = parseProxyMetadata(headers);

      expect(metadata.routing?.enabled).toBe(true);
    });

    it('should parse X-LockLLM-Task-Type', () => {
      const headers = new Map([
        ['x-request-id', 'req_1'],
        ['x-lockllm-route-enabled', 'true'],
        ['x-lockllm-task-type', 'Code Generation'],
      ]);

      const metadata = parseProxyMetadata(headers);

      expect(metadata.routing?.task_type).toBe('Code Generation');
    });

    it('should parse X-LockLLM-Complexity', () => {
      const headers = new Map([
        ['x-request-id', 'req_1'],
        ['x-lockllm-route-enabled', 'true'],
        ['x-lockllm-complexity', '0.75'],
      ]);

      const metadata = parseProxyMetadata(headers);

      expect(metadata.routing?.complexity).toBe(0.75);
    });

    it('should parse X-LockLLM-Selected-Model', () => {
      const headers = new Map([
        ['x-request-id', 'req_1'],
        ['x-lockllm-route-enabled', 'true'],
        ['x-lockllm-selected-model', 'claude-3-sonnet'],
      ]);

      const metadata = parseProxyMetadata(headers);

      expect(metadata.routing?.selected_model).toBe('claude-3-sonnet');
    });

    it('should parse X-LockLLM-Routing-Reason', () => {
      const headers = new Map([
        ['x-request-id', 'req_1'],
        ['x-lockllm-route-enabled', 'true'],
        ['x-lockllm-routing-reason', 'Cost optimization'],
      ]);

      const metadata = parseProxyMetadata(headers);

      expect(metadata.routing?.routing_reason).toBe('Cost optimization');
    });

    it('should parse X-LockLLM-Original-Provider', () => {
      const headers = new Map([
        ['x-request-id', 'req_1'],
        ['x-lockllm-route-enabled', 'true'],
        ['x-lockllm-original-provider', 'anthropic'],
      ]);

      const metadata = parseProxyMetadata(headers);

      expect(metadata.routing?.original_provider).toBe('anthropic');
    });

    it('should parse X-LockLLM-Original-Model', () => {
      const headers = new Map([
        ['x-request-id', 'req_1'],
        ['x-lockllm-route-enabled', 'true'],
        ['x-lockllm-original-model', 'claude-3-opus'],
      ]);

      const metadata = parseProxyMetadata(headers);

      expect(metadata.routing?.original_model).toBe('claude-3-opus');
    });

    it('should parse cost and savings headers', () => {
      const headers = new Map([
        ['x-request-id', 'req_1'],
        ['x-lockllm-route-enabled', 'true'],
        ['x-lockllm-estimated-savings', '0.05'],
      ]);

      const metadata = parseProxyMetadata(headers);

      expect(metadata.routing?.estimated_savings).toBe(0.05);
    });

    it('should parse complete routing metadata', () => {
      const headers = new Map([
        ['x-request-id', 'req_routing_full'],
        ['x-lockllm-route-enabled', 'true'],
        ['x-lockllm-task-type', 'Summarization'],
        ['x-lockllm-complexity', '0.3'],
        ['x-lockllm-selected-model', 'gpt-3.5-turbo'],
        ['x-lockllm-routing-reason', 'Low complexity task'],
        ['x-lockllm-original-provider', 'openai'],
        ['x-lockllm-original-model', 'gpt-4'],
        ['x-lockllm-estimated-savings', '0.08'],
      ]);

      const metadata = parseProxyMetadata(headers);

      expect(metadata.routing?.enabled).toBe(true);
      expect(metadata.routing?.task_type).toBe('Summarization');
      expect(metadata.routing?.complexity).toBe(0.3);
      expect(metadata.routing?.selected_model).toBe('gpt-3.5-turbo');
      expect(metadata.routing?.routing_reason).toBe('Low complexity task');
      expect(metadata.routing?.original_provider).toBe('openai');
      expect(metadata.routing?.original_model).toBe('gpt-4');
      expect(metadata.routing?.estimated_savings).toBe(0.08);
    });
  });

  describe('credit tracking metadata', () => {
    it('should parse X-LockLLM-Credits-Reserved', () => {
      const headers = new Map([
        ['x-request-id', 'req_1'],
        ['x-lockllm-credits-reserved', '0.05'],
      ]);

      const metadata = parseProxyMetadata(headers);

      expect(metadata.credits_reserved).toBe(0.05);
    });

    it('should parse X-LockLLM-Routing-Fee-Reserved', () => {
      const headers = new Map([
        ['x-request-id', 'req_1'],
        ['x-lockllm-routing-fee-reserved', '0.02'],
      ]);

      const metadata = parseProxyMetadata(headers);

      expect(metadata.routing_fee_reserved).toBe(0.02);
    });

    it('should parse both credit tracking headers', () => {
      const headers = new Map([
        ['x-request-id', 'req_credits'],
        ['x-lockllm-credits-reserved', '0.10'],
        ['x-lockllm-routing-fee-reserved', '0.03'],
      ]);

      const metadata = parseProxyMetadata(headers);

      expect(metadata.credits_reserved).toBe(0.10);
      expect(metadata.routing_fee_reserved).toBe(0.03);
    });
  });

  describe('complete metadata parsing', () => {
    it('should parse all metadata fields together', () => {
      const headers = new Map([
        ['x-request-id', 'req_complete'],
        ['x-lockllm-scanned', 'true'],
        ['x-lockllm-safe', 'false'],
        ['x-scan-mode', 'combined'],
        ['x-lockllm-credits-mode', 'lockllm_credits'],
        ['x-lockllm-provider', 'anthropic'],
        ['x-lockllm-scan-warning', 'true'],
        ['x-lockllm-injection-score', '92'],
        ['x-lockllm-confidence', '95'],
        ['x-lockllm-policy-warnings', 'true'],
        ['x-lockllm-warning-count', '1'],
        ['x-lockllm-policy-confidence', '85'],
        ['x-lockllm-route-enabled', 'true'],
        ['x-lockllm-task-type', 'Code Generation'],
        ['x-lockllm-complexity', '0.8'],
        ['x-lockllm-selected-model', 'claude-3-sonnet'],
        ['x-lockllm-credits-reserved', '0.05'],
      ]);

      const metadata = parseProxyMetadata(headers);

      expect(metadata.request_id).toBe('req_complete');
      expect(metadata.scanned).toBe(true);
      expect(metadata.safe).toBe(false);
      expect(metadata.scan_mode).toBe('combined');
      expect(metadata.credits_mode).toBe('lockllm_credits');
      expect(metadata.provider).toBe('anthropic');
      expect(metadata.scan_warning).toBeDefined();
      expect(metadata.policy_warnings).toBeDefined();
      expect(metadata.routing).toBeDefined();
      expect(metadata.credits_reserved).toBe(0.05);
    });
  });

  describe('edge cases', () => {
    it('should handle missing headers gracefully', () => {
      const headers = new Map([
        ['x-request-id', 'req_minimal'],
      ]);

      const metadata = parseProxyMetadata(headers);

      expect(metadata.request_id).toBe('req_minimal');
      expect(metadata.scanned).toBe(false);
      expect(metadata.safe).toBe(false);
      expect(metadata.scan_warning).toBeUndefined();
      expect(metadata.policy_warnings).toBeUndefined();
      expect(metadata.abuse_detected).toBeUndefined();
      expect(metadata.routing).toBeUndefined();
    });

    it('should handle plain object headers', () => {
      const headers = {
        'x-request-id': 'req_object',
        'x-lockllm-scanned': 'true',
      };

      const metadata = parseProxyMetadata(headers);

      expect(metadata.request_id).toBe('req_object');
      expect(metadata.scanned).toBe(true);
    });

    it('should handle case-insensitive headers', () => {
      const headers = new Map([
        ['X-Request-Id', 'req_case'],
        ['X-LockLLM-Scanned', 'true'],
      ]);

      const metadata = parseProxyMetadata(headers);

      expect(metadata.request_id).toBeDefined();
      expect(metadata.scanned).toBeDefined();
    });

    it('should handle empty headers', () => {
      const headers = new Map();

      const metadata = parseProxyMetadata(headers);

      expect(metadata.request_id).toBe('');
      expect(metadata.scanned).toBe(false);
    });

    it('should parse numeric headers correctly', () => {
      const headers = new Map([
        ['x-request-id', 'req_numeric'],
        ['x-lockllm-injection-score', '92.5'],
        ['x-lockllm-complexity', '0.753'],
        ['x-lockllm-credits-reserved', '0.123456'],
      ]);

      const metadata = parseProxyMetadata(headers);

      expect(metadata.scan_warning?.injection_score).toBe(92.5);
      expect(metadata.routing?.complexity).toBe(0.753);
      expect(metadata.credits_reserved).toBe(0.123456);
    });

    it('should handle boolean string conversions', () => {
      const trueCases = new Map([
        ['x-request-id', 'req_bool'],
        ['x-lockllm-scanned', 'true'],
        ['x-lockllm-safe', 'true'],
      ]);

      const falseCases = new Map([
        ['x-request-id', 'req_bool'],
        ['x-lockllm-scanned', 'false'],
        ['x-lockllm-safe', 'false'],
      ]);

      const trueMetadata = parseProxyMetadata(trueCases);
      const falseMetadata = parseProxyMetadata(falseCases);

      expect(trueMetadata.scanned).toBe(true);
      expect(trueMetadata.safe).toBe(true);
      expect(falseMetadata.scanned).toBe(false);
      expect(falseMetadata.safe).toBe(false);
    });
  });
});
