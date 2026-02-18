/**
 * Tests for Policy Violation Detection
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

describe('Policy Violations', () => {
  let scanClient;
  let mockHttpClient;

  beforeEach(() => {
    mockHttpClient = new HttpClient('https://api.lockllm.com', 'test_api_key');
    scanClient = new ScanClient(mockHttpClient);
    vi.clearAllMocks();
  });

  it('should parse policy_warnings array correctly', async () => {
    const mockResponse = {
      request_id: 'req_policy_1',
      safe: false,
      label: 1,
      policy_confidence: 85,
      sensitivity: 'medium',
      policy_warnings: [
        {
          policy_name: 'No Medical Advice',
          violated_categories: [{ name: 'Medical Diagnosis' }],
          violation_details: 'Attempted to provide medical diagnosis',
        },
      ],
      usage: {
        requests: 1,
        input_chars: 100,
      },
    };

    mockHttpClient.post.mockResolvedValueOnce({ data: mockResponse });

    const result = await scanClient.scan({
      input: 'What medication should I take?',
      mode: 'policy_only',
    });

    expect(result.policy_warnings).toBeDefined();
    expect(result.policy_warnings).toHaveLength(1);
    expect(result.policy_warnings[0].policy_name).toBe('No Medical Advice');
  });

  it('should include policy_name and violated_categories', async () => {
    const mockResponse = {
      request_id: 'req_policy_2',
      safe: false,
      label: 1,
      policy_confidence: 80,
      sensitivity: 'medium',
      policy_warnings: [
        {
          policy_name: 'Content Safety Policy',
          violated_categories: [
            { name: 'Violence' },
            { name: 'Hate Speech' },
          ],
        },
      ],
      usage: {
        requests: 1,
        input_chars: 150,
      },
    };

    mockHttpClient.post.mockResolvedValueOnce({ data: mockResponse });

    const result = await scanClient.scan({
      input: 'Violent content',
      mode: 'policy_only',
    });

    expect(result.policy_warnings[0].violated_categories).toHaveLength(2);
    expect(result.policy_warnings[0].violated_categories[0].name).toBe('Violence');
  });

  it('should handle multiple policy violations', async () => {
    const mockResponse = {
      request_id: 'req_policy_3',
      safe: false,
      label: 1,
      policy_confidence: 90,
      sensitivity: 'medium',
      policy_warnings: [
        {
          policy_name: 'No Medical Advice',
          violated_categories: [{ name: 'Medical Diagnosis' }],
        },
        {
          policy_name: 'No Financial Advice',
          violated_categories: [{ name: 'Investment Recommendations' }],
        },
        {
          policy_name: 'No Legal Advice',
          violated_categories: [{ name: 'Legal Consultation' }],
        },
      ],
      usage: {
        requests: 1,
        input_chars: 200,
      },
    };

    mockHttpClient.post.mockResolvedValueOnce({ data: mockResponse });

    const result = await scanClient.scan({
      input: 'Multiple policy violations',
      mode: 'policy_only',
    });

    expect(result.policy_warnings).toHaveLength(3);
  });

  it('should handle built-in policies (S1-S14)', async () => {
    const mockResponse = {
      request_id: 'req_policy_4',
      safe: false,
      label: 1,
      policy_confidence: 95,
      sensitivity: 'medium',
      policy_warnings: [
        {
          policy_name: 'Standard Safety Policy',
          violated_categories: [
            { name: 'Violent Crimes' },
            { name: 'Hate' },
          ],
        },
      ],
      usage: {
        requests: 1,
        input_chars: 100,
      },
    };

    mockHttpClient.post.mockResolvedValueOnce({ data: mockResponse });

    const result = await scanClient.scan({
      input: 'Violent content',
      mode: 'policy_only',
    });

    expect(result.policy_warnings[0].policy_name).toBe('Standard Safety Policy');
  });

  it('should handle custom policies (S15+)', async () => {
    const mockResponse = {
      request_id: 'req_policy_5',
      safe: false,
      label: 1,
      policy_confidence: 88,
      sensitivity: 'medium',
      policy_warnings: [
        {
          policy_name: 'Company Brand Guidelines',
          violated_categories: [{ name: 'Trademark Usage' }],
          violation_details: 'Improper use of company trademark',
        },
      ],
      usage: {
        requests: 1,
        input_chars: 100,
      },
    };

    mockHttpClient.post.mockResolvedValueOnce({ data: mockResponse });

    const result = await scanClient.scan({
      input: 'Custom policy violation',
      mode: 'policy_only',
    });

    expect(result.policy_warnings[0].policy_name).toBe('Company Brand Guidelines');
  });

  it('should include violation_details when available', async () => {
    const mockResponse = {
      request_id: 'req_policy_6',
      safe: false,
      label: 1,
      policy_confidence: 92,
      sensitivity: 'medium',
      policy_warnings: [
        {
          policy_name: 'Data Privacy Policy',
          violated_categories: [{ name: 'Personal Information' }],
          violation_details: 'Request contains personally identifiable information',
        },
      ],
      usage: {
        requests: 1,
        input_chars: 150,
      },
    };

    mockHttpClient.post.mockResolvedValueOnce({ data: mockResponse });

    const result = await scanClient.scan({
      input: 'Sensitive data',
      mode: 'policy_only',
    });

    expect(result.policy_warnings[0].violation_details).toBeDefined();
    expect(result.policy_warnings[0].violation_details).toContain('personally identifiable');
  });

  it('should respect policy_confidence threshold', async () => {
    const mockResponse = {
      request_id: 'req_policy_7',
      safe: true,
      label: 0,
      policy_confidence: 98,
      sensitivity: 'medium',
      usage: {
        requests: 1,
        input_chars: 100,
      },
    };

    mockHttpClient.post.mockResolvedValueOnce({ data: mockResponse });

    const result = await scanClient.scan({
      input: 'Compliant content',
      mode: 'policy_only',
    });

    expect(result.safe).toBe(true);
    expect(result.policy_warnings).toBeUndefined();
  });

  it('should work in policy_only mode', async () => {
    const mockResponse = {
      request_id: 'req_policy_8',
      safe: false,
      label: 1,
      policy_confidence: 85,
      sensitivity: 'medium',
      policy_warnings: [
        {
          policy_name: 'No Medical Advice',
          violated_categories: [{ name: 'Medical Diagnosis' }],
        },
      ],
      usage: {
        requests: 1,
        input_chars: 100,
      },
    };

    mockHttpClient.post.mockResolvedValueOnce({ data: mockResponse });

    const result = await scanClient.scan({
      input: 'Policy check only',
      mode: 'policy_only',
    });

    expect(result.confidence).toBeUndefined();
    expect(result.injection).toBeUndefined();
    expect(result.policy_confidence).toBeDefined();
  });

  it('should work in combined mode', async () => {
    const mockResponse = {
      request_id: 'req_policy_9',
      safe: false,
      label: 1,
      confidence: 98,
      injection: 2,
      policy_confidence: 85,
      sensitivity: 'medium',
      policy_warnings: [
        {
          policy_name: 'No Medical Advice',
          violated_categories: [{ name: 'Medical Diagnosis' }],
        },
      ],
      usage: {
        requests: 2,
        input_chars: 100,
      },
    };

    mockHttpClient.post.mockResolvedValueOnce({ data: mockResponse });

    const result = await scanClient.scan({
      input: 'Combined scan',
      mode: 'combined',
    });

    expect(result.confidence).toBeDefined();
    expect(result.policy_confidence).toBeDefined();
    expect(result.policy_warnings).toBeDefined();
  });

  it('should handle empty policy_warnings when compliant', async () => {
    const mockResponse = {
      request_id: 'req_policy_10',
      safe: true,
      label: 0,
      policy_confidence: 95,
      sensitivity: 'medium',
      usage: {
        requests: 1,
        input_chars: 50,
      },
    };

    mockHttpClient.post.mockResolvedValueOnce({ data: mockResponse });

    const result = await scanClient.scan({
      input: 'Safe content',
      mode: 'policy_only',
    });

    expect(result.policy_warnings).toBeUndefined();
  });
});
