/**
 * Tests for wrapper branch coverage - targeting uncovered branches in wrappers
 * Lines: openai-wrapper.ts:109, anthropic-wrapper.ts:102,111,121
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createOpenAI } from '../src/wrappers/openai-wrapper';
import { createAnthropic } from '../src/wrappers/anthropic-wrapper';

describe('Wrapper Branch Coverage', () => {
  describe('OpenAI Wrapper - proxyOptions.headers branch', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should handle proxyOptions with custom headers', () => {
      const mockOpenAI = vi.fn().mockImplementation(function (config) {
        this.config = config;
      });

      vi.doMock('openai', () => ({
        default: mockOpenAI,
      }));

      const { createOpenAI: createOpenAIMocked } = require('../src/wrappers/openai-wrapper');

      const client = createOpenAIMocked({
        apiKey: 'test_key',
        proxyOptions: {
          scanMode: 'combined',
          headers: {
            'X-Custom-Header': 'custom-value',
            'X-Another-Header': 'another-value',
          },
        },
      });

      expect(mockOpenAI).toHaveBeenCalledWith(
        expect.objectContaining({
          defaultHeaders: expect.objectContaining({
            'X-Custom-Header': 'custom-value',
            'X-Another-Header': 'another-value',
            'x-lockllm-scan-mode': 'combined',
          }),
        })
      );

      vi.doUnmock('openai');
    });

    it('should handle proxyOptions without headers (null branch)', () => {
      const mockOpenAI = vi.fn().mockImplementation(function (config) {
        this.config = config;
      });

      vi.doMock('openai', () => ({
        default: mockOpenAI,
      }));

      const { createOpenAI: createOpenAIMocked } = require('../src/wrappers/openai-wrapper');

      const client = createOpenAIMocked({
        apiKey: 'test_key',
        proxyOptions: {
          scanMode: 'normal',
          // No headers property
        },
      });

      expect(mockOpenAI).toHaveBeenCalledWith(
        expect.objectContaining({
          defaultHeaders: expect.objectContaining({
            'x-lockllm-scan-mode': 'normal',
          }),
        })
      );

      vi.doUnmock('openai');
    });

    it('should handle undefined proxyOptions', () => {
      const mockOpenAI = vi.fn().mockImplementation(function (config) {
        this.config = config;
      });

      vi.doMock('openai', () => ({
        default: mockOpenAI,
      }));

      const { createOpenAI: createOpenAIMocked } = require('../src/wrappers/openai-wrapper');

      const client = createOpenAIMocked({
        apiKey: 'test_key',
        // No proxyOptions at all
      });

      expect(mockOpenAI).toHaveBeenCalledWith(
        expect.objectContaining({
          apiKey: 'test_key',
        })
      );

      vi.doUnmock('openai');
    });

    it('should merge proxyOptions.headers with defaultHeaders', () => {
      const mockOpenAI = vi.fn().mockImplementation(function (config) {
        this.config = config;
      });

      vi.doMock('openai', () => ({
        default: mockOpenAI,
      }));

      const { createOpenAI: createOpenAIMocked } = require('../src/wrappers/openai-wrapper');

      const client = createOpenAIMocked({
        apiKey: 'test_key',
        defaultHeaders: {
          'X-Existing-Header': 'existing-value',
        },
        proxyOptions: {
          scanMode: 'combined',
          headers: {
            'X-Proxy-Header': 'proxy-value',
          },
        },
      });

      expect(mockOpenAI).toHaveBeenCalledWith(
        expect.objectContaining({
          defaultHeaders: expect.objectContaining({
            'X-Existing-Header': 'existing-value',
            'X-Proxy-Header': 'proxy-value',
            'x-lockllm-scan-mode': 'combined',
          }),
        })
      );

      vi.doUnmock('openai');
    });
  });

  describe('Anthropic Wrapper - proxyOptions.headers branch', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should handle proxyOptions with custom headers', () => {
      const mockAnthropic = vi.fn().mockImplementation(function (config) {
        this.config = config;
      });

      vi.doMock('@anthropic-ai/sdk', () => ({
        default: mockAnthropic,
      }));

      const { createAnthropic: createAnthropicMocked } = require('../src/wrappers/anthropic-wrapper');

      const client = createAnthropicMocked({
        apiKey: 'test_key',
        proxyOptions: {
          scanMode: 'policy_only',
          headers: {
            'X-Custom-Anthropic': 'custom-value',
          },
        },
      });

      expect(mockAnthropic).toHaveBeenCalledWith(
        expect.objectContaining({
          defaultHeaders: expect.objectContaining({
            'X-Custom-Anthropic': 'custom-value',
            'x-lockllm-scan-mode': 'policy_only',
          }),
        })
      );

      vi.doUnmock('@anthropic-ai/sdk');
    });

    it('should handle proxyOptions without headers (null branch)', () => {
      const mockAnthropic = vi.fn().mockImplementation(function (config) {
        this.config = config;
      });

      vi.doMock('@anthropic-ai/sdk', () => ({
        default: mockAnthropic,
      }));

      const { createAnthropic: createAnthropicMocked } = require('../src/wrappers/anthropic-wrapper');

      const client = createAnthropicMocked({
        apiKey: 'test_key',
        proxyOptions: {
          scanAction: 'block',
          // No headers property
        },
      });

      expect(mockAnthropic).toHaveBeenCalledWith(
        expect.objectContaining({
          defaultHeaders: expect.objectContaining({
            'x-lockllm-scan-action': 'block',
          }),
        })
      );

      vi.doUnmock('@anthropic-ai/sdk');
    });

    it('should handle undefined proxyOptions', () => {
      const mockAnthropic = vi.fn().mockImplementation(function (config) {
        this.config = config;
      });

      vi.doMock('@anthropic-ai/sdk', () => ({
        default: mockAnthropic,
      }));

      const { createAnthropic: createAnthropicMocked } = require('../src/wrappers/anthropic-wrapper');

      const client = createAnthropicMocked({
        apiKey: 'test_key',
        // No proxyOptions at all
      });

      expect(mockAnthropic).toHaveBeenCalledWith(
        expect.objectContaining({
          apiKey: 'test_key',
        })
      );

      vi.doUnmock('@anthropic-ai/sdk');
    });

    it('should merge all headers correctly with priority order', () => {
      const mockAnthropic = vi.fn().mockImplementation(function (config) {
        this.config = config;
      });

      vi.doMock('@anthropic-ai/sdk', () => ({
        default: mockAnthropic,
      }));

      const { createAnthropic: createAnthropicMocked } = require('../src/wrappers/anthropic-wrapper');

      const client = createAnthropicMocked({
        apiKey: 'test_key',
        defaultHeaders: {
          'X-Default-Header': 'default-value',
          'X-Override-Me': 'original',
        },
        proxyOptions: {
          scanMode: 'combined',
          policyAction: 'allow_with_warning',
          headers: {
            'X-Proxy-Header': 'proxy-value',
            'X-Override-Me': 'overridden',
          },
        },
      });

      expect(mockAnthropic).toHaveBeenCalledWith(
        expect.objectContaining({
          defaultHeaders: expect.objectContaining({
            'X-Default-Header': 'default-value',
            'X-Proxy-Header': 'proxy-value',
            'X-Override-Me': 'overridden', // proxyOptions.headers should override defaultHeaders
            'x-lockllm-scan-mode': 'combined',
            'x-lockllm-policy-action': 'allow_with_warning',
          }),
        })
      );

      vi.doUnmock('@anthropic-ai/sdk');
    });

    it('should pass through additional options to constructor', () => {
      const mockAnthropic = vi.fn().mockImplementation(function (config) {
        this.config = config;
      });

      vi.doMock('@anthropic-ai/sdk', () => ({
        default: mockAnthropic,
      }));

      const { createAnthropic: createAnthropicMocked } = require('../src/wrappers/anthropic-wrapper');

      const client = createAnthropicMocked({
        apiKey: 'test_key',
        timeout: 30000,
        maxRetries: 5,
        customOption: 'custom-value',
        proxyOptions: {
          scanMode: 'normal',
        },
      });

      expect(mockAnthropic).toHaveBeenCalledWith(
        expect.objectContaining({
          apiKey: 'test_key',
          timeout: 30000,
          maxRetries: 5,
          customOption: 'custom-value',
        })
      );

      vi.doUnmock('@anthropic-ai/sdk');
    });
  });

  describe('Custom baseURL handling', () => {
    it('should use custom baseURL for OpenAI when provided', () => {
      const mockOpenAI = vi.fn().mockImplementation(function (config) {
        this.config = config;
      });

      vi.doMock('openai', () => ({
        default: mockOpenAI,
      }));

      const { createOpenAI: createOpenAIMocked } = require('../src/wrappers/openai-wrapper');

      const client = createOpenAIMocked({
        apiKey: 'test_key',
        baseURL: 'https://custom.endpoint.com/v1/proxy/openai',
      });

      expect(mockOpenAI).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://custom.endpoint.com/v1/proxy/openai',
        })
      );

      vi.doUnmock('openai');
    });

    it('should use custom baseURL for Anthropic when provided', () => {
      const mockAnthropic = vi.fn().mockImplementation(function (config) {
        this.config = config;
      });

      vi.doMock('@anthropic-ai/sdk', () => ({
        default: mockAnthropic,
      }));

      const { createAnthropic: createAnthropicMocked } = require('../src/wrappers/anthropic-wrapper');

      const client = createAnthropicMocked({
        apiKey: 'test_key',
        baseURL: 'https://custom.endpoint.com/v1/proxy/anthropic',
      });

      expect(mockAnthropic).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://custom.endpoint.com/v1/proxy/anthropic',
        })
      );

      vi.doUnmock('@anthropic-ai/sdk');
    });
  });
});
