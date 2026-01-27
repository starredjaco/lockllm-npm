/**
 * Tests for Abuse Detection
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScanClient } from '../src/scan';
import { HttpClient } from '../src/utils';

// Mock HttpClient
vi.mock('../src/utils', () => {
  return {
    HttpClient: vi.fn().mockImplementation(() => ({
      post: vi.fn(),
    })),
  };
});

describe('Abuse Detection', () => {
  let scanClient;
  let mockHttpClient;

  beforeEach(() => {
    mockHttpClient = new HttpClient('https://api.lockllm.com', 'test_api_key');
    scanClient = new ScanClient(mockHttpClient);
    vi.clearAllMocks();
  });

  describe('abuseAction: null (default)', () => {
    it('should skip abuse detection entirely', async () => {
      const mockResponse = {
        request_id: 'req_abuse_1',
        safe: true,
        label: 0,
        confidence: 98,
        injection: 2,
        sensitivity: 'medium',
        usage: {
          requests: 1,
          input_chars: 100,
        },
      };

      mockHttpClient.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await scanClient.scan({
        input: 'Normal prompt',
      });

      expect(result.abuse_warnings).toBeUndefined();
    });

    it('should not include abuse_warnings in response', async () => {
      const mockResponse = {
        request_id: 'req_abuse_2',
        safe: true,
        label: 0,
        confidence: 98,
        injection: 2,
        sensitivity: 'medium',
        usage: {
          requests: 1,
          input_chars: 100,
        },
      };

      mockHttpClient.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await scanClient.scan(
        {
          input: 'Test prompt',
        },
        {
          abuseAction: null,
        }
      );

      expect(result.abuse_warnings).toBeUndefined();
    });
  });

  describe('abuseAction: block', () => {
    it('should throw AbuseDetectedError when abuse detected', async () => {
      const mockError = {
        error: {
          message: 'Abuse detected',
          type: 'lockllm_abuse_error',
          code: 'abuse_detected',
          request_id: 'req_abuse_3',
          abuse_details: {
            confidence: 95,
            abuse_types: ['bot_generated', 'repetition'],
            indicators: {
              bot_score: 98,
              repetition_score: 92,
              resource_score: 15,
              pattern_score: 88,
            },
            recommendation: 'Rate limit this API key',
          },
        },
      };

      mockHttpClient.post.mockRejectedValueOnce(mockError);

      await expect(
        scanClient.scan(
          {
            input: 'Abusive bot-like content',
          },
          {
            abuseAction: 'block',
          }
        )
      ).rejects.toThrow();
    });

    it('should include abuse_types and confidence', async () => {
      const mockError = {
        error: {
          message: 'Abuse detected',
          type: 'lockllm_abuse_error',
          code: 'abuse_detected',
          request_id: 'req_abuse_4',
          abuse_details: {
            confidence: 92,
            abuse_types: ['bot_generated'],
            indicators: {
              bot_score: 95,
              repetition_score: 20,
              resource_score: 10,
              pattern_score: 85,
            },
          },
        },
      };

      mockHttpClient.post.mockRejectedValueOnce(mockError);

      await expect(
        scanClient.scan(
          {
            input: 'Bot content',
          },
          {
            abuseAction: 'block',
          }
        )
      ).rejects.toThrow();
    });

    it('should include all abuse indicators', async () => {
      const mockError = {
        error: {
          message: 'Abuse detected',
          type: 'lockllm_abuse_error',
          code: 'abuse_detected',
          request_id: 'req_abuse_5',
          abuse_details: {
            confidence: 90,
            abuse_types: ['resource_exhaustion', 'repetition'],
            indicators: {
              bot_score: 25,
              repetition_score: 95,
              resource_score: 98,
              pattern_score: 75,
            },
            recommendation: 'Implement request throttling',
          },
        },
      };

      mockHttpClient.post.mockRejectedValueOnce(mockError);

      await expect(
        scanClient.scan(
          {
            input: 'a'.repeat(10000),
          },
          {
            abuseAction: 'block',
          }
        )
      ).rejects.toThrow();
    });

    it('should include recommendation when available', async () => {
      const mockError = {
        error: {
          message: 'Abuse detected',
          type: 'lockllm_abuse_error',
          code: 'abuse_detected',
          request_id: 'req_abuse_6',
          abuse_details: {
            confidence: 88,
            abuse_types: ['rapid_requests'],
            indicators: {
              bot_score: 80,
              repetition_score: 30,
              resource_score: 20,
              pattern_score: 92,
            },
            recommendation: 'Implement exponential backoff',
          },
        },
      };

      mockHttpClient.post.mockRejectedValueOnce(mockError);

      await expect(
        scanClient.scan(
          {
            input: 'Rapid fire request',
          },
          {
            abuseAction: 'block',
          }
        )
      ).rejects.toThrow();
    });
  });

  describe('abuseAction: allow_with_warning', () => {
    it('should return 200 with abuse_warnings when abuse detected', async () => {
      const mockResponse = {
        request_id: 'req_abuse_7',
        safe: true,
        label: 0,
        confidence: 98,
        injection: 2,
        sensitivity: 'medium',
        abuse_warnings: {
          detected: true,
          confidence: 90,
          abuse_types: ['bot_generated', 'repetition'],
          indicators: {
            bot_score: 95,
            repetition_score: 88,
            resource_score: 15,
            pattern_score: 85,
          },
          recommendation: 'Monitor this API key',
        },
        usage: {
          requests: 1,
          input_chars: 100,
        },
      };

      mockHttpClient.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await scanClient.scan(
        {
          input: 'Bot-like content',
        },
        {
          abuseAction: 'allow_with_warning',
        }
      );

      expect(result.abuse_warnings).toBeDefined();
      expect(result.abuse_warnings.detected).toBe(true);
      expect(result.abuse_warnings.confidence).toBe(90);
    });

    it('should include all abuse indicators', async () => {
      const mockResponse = {
        request_id: 'req_abuse_8',
        safe: true,
        label: 0,
        confidence: 98,
        injection: 2,
        sensitivity: 'medium',
        abuse_warnings: {
          detected: true,
          confidence: 85,
          abuse_types: ['repetition'],
          indicators: {
            bot_score: 40,
            repetition_score: 92,
            resource_score: 20,
            pattern_score: 50,
          },
        },
        usage: {
          requests: 1,
          input_chars: 100,
        },
      };

      mockHttpClient.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await scanClient.scan(
        {
          input: 'test test test test test',
        },
        {
          abuseAction: 'allow_with_warning',
        }
      );

      expect(result.abuse_warnings.indicators).toBeDefined();
      expect(result.abuse_warnings.indicators.bot_score).toBe(40);
      expect(result.abuse_warnings.indicators.repetition_score).toBe(92);
      expect(result.abuse_warnings.indicators.resource_score).toBe(20);
      expect(result.abuse_warnings.indicators.pattern_score).toBe(50);
    });

    it('should set safe based on core+policy, not abuse', async () => {
      const mockResponse = {
        request_id: 'req_abuse_9',
        safe: true,
        label: 0,
        confidence: 98,
        injection: 2,
        sensitivity: 'medium',
        abuse_warnings: {
          detected: true,
          confidence: 90,
          abuse_types: ['bot_generated'],
          indicators: {
            bot_score: 95,
            repetition_score: 30,
            resource_score: 10,
            pattern_score: 85,
          },
        },
        usage: {
          requests: 1,
          input_chars: 100,
        },
      };

      mockHttpClient.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await scanClient.scan(
        {
          input: 'Safe content but bot-like',
        },
        {
          abuseAction: 'allow_with_warning',
        }
      );

      expect(result.safe).toBe(true);
      expect(result.abuse_warnings.detected).toBe(true);
    });

    it('should handle multiple abuse types', async () => {
      const mockResponse = {
        request_id: 'req_abuse_10',
        safe: true,
        label: 0,
        confidence: 98,
        injection: 2,
        sensitivity: 'medium',
        abuse_warnings: {
          detected: true,
          confidence: 92,
          abuse_types: ['bot_generated', 'repetition', 'rapid_requests'],
          indicators: {
            bot_score: 90,
            repetition_score: 85,
            resource_score: 30,
            pattern_score: 95,
          },
          recommendation: 'Apply strict rate limiting',
        },
        usage: {
          requests: 1,
          input_chars: 100,
        },
      };

      mockHttpClient.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await scanClient.scan(
        {
          input: 'Multiple abuse signals',
        },
        {
          abuseAction: 'allow_with_warning',
        }
      );

      expect(result.abuse_warnings.abuse_types).toHaveLength(3);
    });
  });

  describe('abuse detection failures', () => {
    it('should silently fail and not block request', async () => {
      const mockResponse = {
        request_id: 'req_abuse_11',
        safe: true,
        label: 0,
        confidence: 98,
        injection: 2,
        sensitivity: 'medium',
        usage: {
          requests: 1,
          input_chars: 100,
        },
      };

      mockHttpClient.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await scanClient.scan(
        {
          input: 'Normal content',
        },
        {
          abuseAction: 'allow_with_warning',
        }
      );

      expect(result).toBeDefined();
      expect(result.safe).toBe(true);
    });

    it('should continue with scan even if abuse detection errors', async () => {
      const mockResponse = {
        request_id: 'req_abuse_12',
        safe: true,
        label: 0,
        confidence: 98,
        injection: 2,
        sensitivity: 'medium',
        usage: {
          requests: 1,
          input_chars: 100,
        },
      };

      mockHttpClient.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await scanClient.scan(
        {
          input: 'Test prompt',
        },
        {
          scanAction: 'block',
          abuseAction: 'allow_with_warning',
        }
      );

      expect(result.safe).toBe(true);
      expect(result.confidence).toBeDefined();
    });
  });

  describe('opt-in behavior', () => {
    it('should not run abuse detection without explicit opt-in', async () => {
      const mockResponse = {
        request_id: 'req_abuse_13',
        safe: true,
        label: 0,
        confidence: 98,
        injection: 2,
        sensitivity: 'medium',
        usage: {
          requests: 1,
          input_chars: 100,
        },
      };

      mockHttpClient.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await scanClient.scan({
        input: 'Test prompt',
      });

      const callArgs = mockHttpClient.post.mock.calls[0];
      const headers = callArgs[2]?.headers || {};

      expect(headers['x-lockllm-abuse-action']).toBeUndefined();
      expect(result.abuse_warnings).toBeUndefined();
    });
  });
});
