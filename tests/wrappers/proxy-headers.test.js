/**
 * Tests for Proxy Headers Utility
 */

import { describe, it, expect } from 'vitest';
import { buildLockLLMHeaders } from '../../src/utils/proxy-headers';

describe('Proxy Headers', () => {
  describe('buildLockLLMHeaders', () => {
    it('should build x-lockllm-scan-mode header', () => {
      const headers = buildLockLLMHeaders({
        scanMode: 'combined',
      });

      expect(headers['x-lockllm-scan-mode']).toBe('combined');
    });

    it('should build x-lockllm-scan-action header', () => {
      const headers = buildLockLLMHeaders({
        scanAction: 'block',
      });

      expect(headers['x-lockllm-scan-action']).toBe('block');
    });

    it('should build x-lockllm-policy-action header', () => {
      const headers = buildLockLLMHeaders({
        policyAction: 'allow_with_warning',
      });

      expect(headers['x-lockllm-policy-action']).toBe('allow_with_warning');
    });

    it('should build x-lockllm-abuse-action header', () => {
      const headers = buildLockLLMHeaders({
        abuseAction: 'block',
      });

      expect(headers['x-lockllm-abuse-action']).toBe('block');
    });

    it('should build x-lockllm-route-action header', () => {
      const headers = buildLockLLMHeaders({
        routeAction: 'auto',
      });

      expect(headers['x-lockllm-route-action']).toBe('auto');
    });

    it('should omit headers when not provided', () => {
      const headers = buildLockLLMHeaders({});

      expect(Object.keys(headers)).toHaveLength(0);
    });

    it('should handle null abuseAction (opt-out)', () => {
      const headers = buildLockLLMHeaders({
        abuseAction: null,
      });

      expect(headers['x-lockllm-abuse-action']).toBeUndefined();
    });

    it('should handle undefined options', () => {
      const headers = buildLockLLMHeaders();

      expect(Object.keys(headers)).toHaveLength(0);
    });

    it('should build multiple headers', () => {
      const headers = buildLockLLMHeaders({
        scanMode: 'combined',
        scanAction: 'block',
        policyAction: 'allow_with_warning',
        abuseAction: 'block',
        routeAction: 'auto',
      });

      expect(headers['x-lockllm-scan-mode']).toBe('combined');
      expect(headers['x-lockllm-scan-action']).toBe('block');
      expect(headers['x-lockllm-policy-action']).toBe('allow_with_warning');
      expect(headers['x-lockllm-abuse-action']).toBe('block');
      expect(headers['x-lockllm-route-action']).toBe('auto');
      expect(Object.keys(headers)).toHaveLength(5);
    });

    it('should validate scan mode values', () => {
      const normal = buildLockLLMHeaders({ scanMode: 'normal' });
      const policyOnly = buildLockLLMHeaders({ scanMode: 'policy_only' });
      const combined = buildLockLLMHeaders({ scanMode: 'combined' });

      expect(normal['x-lockllm-scan-mode']).toBe('normal');
      expect(policyOnly['x-lockllm-scan-mode']).toBe('policy_only');
      expect(combined['x-lockllm-scan-mode']).toBe('combined');
    });

    it('should validate scan action values', () => {
      const block = buildLockLLMHeaders({ scanAction: 'block' });
      const warn = buildLockLLMHeaders({ scanAction: 'allow_with_warning' });

      expect(block['x-lockllm-scan-action']).toBe('block');
      expect(warn['x-lockllm-scan-action']).toBe('allow_with_warning');
    });

    it('should validate policy action values', () => {
      const block = buildLockLLMHeaders({ policyAction: 'block' });
      const warn = buildLockLLMHeaders({ policyAction: 'allow_with_warning' });

      expect(block['x-lockllm-policy-action']).toBe('block');
      expect(warn['x-lockllm-policy-action']).toBe('allow_with_warning');
    });

    it('should validate route action values', () => {
      const disabled = buildLockLLMHeaders({ routeAction: 'disabled' });
      const auto = buildLockLLMHeaders({ routeAction: 'auto' });
      const custom = buildLockLLMHeaders({ routeAction: 'custom' });

      expect(disabled['x-lockllm-route-action']).toBe('disabled');
      expect(auto['x-lockllm-route-action']).toBe('auto');
      expect(custom['x-lockllm-route-action']).toBe('custom');
    });

    it('should handle partial options', () => {
      const headers = buildLockLLMHeaders({
        scanMode: 'normal',
        routeAction: 'auto',
      });

      expect(headers['x-lockllm-scan-mode']).toBe('normal');
      expect(headers['x-lockllm-route-action']).toBe('auto');
      expect(headers['x-lockllm-scan-action']).toBeUndefined();
      expect(headers['x-lockllm-policy-action']).toBeUndefined();
      expect(Object.keys(headers)).toHaveLength(2);
    });
  });

  describe('header forwarding', () => {
    it('should forward LockLLM headers to proxy', () => {
      const headers = buildLockLLMHeaders({
        scanMode: 'combined',
        scanAction: 'block',
      });

      expect(headers).toHaveProperty('x-lockllm-scan-mode');
      expect(headers).toHaveProperty('x-lockllm-scan-action');
    });

    it('should preserve header format for HTTP requests', () => {
      const headers = buildLockLLMHeaders({
        scanMode: 'normal',
        scanAction: 'block',
        policyAction: 'allow_with_warning',
      });

      Object.keys(headers).forEach((key) => {
        expect(key).toMatch(/^x-lockllm-/);
        expect(typeof headers[key]).toBe('string');
      });
    });

    it('should return plain object suitable for merging', () => {
      const headers = buildLockLLMHeaders({
        scanMode: 'combined',
      });

      expect(Object.getPrototypeOf(headers)).toBe(Object.prototype);
      expect(Array.isArray(headers)).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle empty object', () => {
      const headers = buildLockLLMHeaders({});

      expect(headers).toEqual({});
    });

    it('should handle null options', () => {
      const headers = buildLockLLMHeaders(null);

      expect(headers).toEqual({});
    });

    it('should handle options with only custom headers', () => {
      const headers = buildLockLLMHeaders({
        headers: { 'X-Custom': 'value' },
      });

      expect(headers).toEqual({});
    });

    it('should not include non-LockLLM options', () => {
      const headers = buildLockLLMHeaders({
        scanMode: 'normal',
        timeout: 5000,
        signal: new AbortController().signal,
      });

      expect(headers).toEqual({
        'x-lockllm-scan-mode': 'normal',
      });
    });

    it('should handle boolean abuseAction correctly', () => {
      const withBlock = buildLockLLMHeaders({ abuseAction: 'block' });
      const withWarn = buildLockLLMHeaders({ abuseAction: 'allow_with_warning' });
      const withNull = buildLockLLMHeaders({ abuseAction: null });
      const withoutAbuse = buildLockLLMHeaders({});

      expect(withBlock['x-lockllm-abuse-action']).toBe('block');
      expect(withWarn['x-lockllm-abuse-action']).toBe('allow_with_warning');
      expect(withNull['x-lockllm-abuse-action']).toBeUndefined();
      expect(withoutAbuse['x-lockllm-abuse-action']).toBeUndefined();
    });
  });

  describe('default behavior', () => {
    it('should return empty headers when no scan options provided', () => {
      const headers = buildLockLLMHeaders({
        headers: { 'Authorization': 'Bearer token' },
        timeout: 10000,
      });

      expect(Object.keys(headers)).toHaveLength(0);
    });

    it('should build only specified headers', () => {
      const headers = buildLockLLMHeaders({
        scanAction: 'block',
      });

      expect(headers).toEqual({
        'x-lockllm-scan-action': 'block',
      });
    });

    it('should not add undefined values', () => {
      const headers = buildLockLLMHeaders({
        scanMode: 'normal',
        scanAction: undefined,
        policyAction: undefined,
      });

      expect(headers).toEqual({
        'x-lockllm-scan-mode': 'normal',
      });
      expect(headers['x-lockllm-scan-action']).toBeUndefined();
      expect(headers['x-lockllm-policy-action']).toBeUndefined();
    });
  });
});
