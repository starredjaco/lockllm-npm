/**
 * Tests for scan chunk parameter - targeting uncovered branch at line 73
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

describe('ScanClient - chunk parameter', () => {
  let scanClient;
  let mockHttpClient;

  beforeEach(() => {
    mockHttpClient = new HttpClient('https://api.lockllm.com', 'test_api_key');
    scanClient = new ScanClient(mockHttpClient);
    vi.clearAllMocks();
  });

  it('should include chunk header when chunk is true', async () => {
    const mockResponse = {
      request_id: 'req_chunk_true',
      safe: true,
      label: 0,
      confidence: 98,
      injection: 2,
      sensitivity: 'medium',
    };

    mockHttpClient.post.mockResolvedValueOnce({ data: mockResponse });

    await scanClient.scan({
      input: 'Test prompt',
      chunk: true,
    });

    expect(mockHttpClient.post).toHaveBeenCalledWith(
      '/v1/scan',
      { input: 'Test prompt' },
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-lockllm-chunk': 'true',
        }),
      })
    );
  });

  it('should include chunk header when chunk is false', async () => {
    const mockResponse = {
      request_id: 'req_chunk_false',
      safe: true,
      label: 0,
      confidence: 98,
      injection: 2,
      sensitivity: 'medium',
    };

    mockHttpClient.post.mockResolvedValueOnce({ data: mockResponse });

    await scanClient.scan({
      input: 'Test prompt',
      chunk: false,
    });

    expect(mockHttpClient.post).toHaveBeenCalledWith(
      '/v1/scan',
      { input: 'Test prompt' },
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-lockllm-chunk': 'false',
        }),
      })
    );
  });

  it('should not include chunk header when chunk is undefined', async () => {
    const mockResponse = {
      request_id: 'req_no_chunk',
      safe: true,
      label: 0,
      confidence: 98,
      injection: 2,
      sensitivity: 'medium',
    };

    mockHttpClient.post.mockResolvedValueOnce({ data: mockResponse });

    await scanClient.scan({
      input: 'Test prompt',
    });

    const callArgs = mockHttpClient.post.mock.calls[0];
    const headers = callArgs[2]?.headers || {};

    expect(headers['x-lockllm-chunk']).toBeUndefined();
  });
});
