/**
 * Tests for prompt compression features - covering remaining coverage gaps
 * Covers: scan.ts compressionAction/compressionRate, proxy-headers.ts compressionRate + compression metadata parsing
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScanClient } from '../src/scan';
import { HttpClient } from '../src/utils';
import {
  buildLockLLMHeaders,
  parseProxyMetadata,
} from '../src/utils/proxy-headers';

// Mock HttpClient
vi.mock('../src/utils', () => {
  return {
    HttpClient: vi.fn().mockImplementation(() => ({
      post: vi.fn(),
    })),
  };
});

// ============================================================
// scan.ts - compressionAction header (lines 98-100)
// ============================================================
describe('ScanClient - compression options', () => {
  let scanClient;
  let mockHttpClient;

  beforeEach(() => {
    mockHttpClient = new HttpClient('https://api.lockllm.com', 'test_key');
    scanClient = new ScanClient(mockHttpClient);
    vi.clearAllMocks();
  });

  it('should set x-lockllm-compression header when compressionAction is provided', async () => {
    mockHttpClient.post.mockResolvedValueOnce({
      data: { safe: true, request_id: 'req_comp_001' },
    });

    await scanClient.scan(
      { input: 'Hello world' },
      { compressionAction: 'toon' }
    );

    expect(mockHttpClient.post).toHaveBeenCalledWith(
      '/v1/scan',
      { input: 'Hello world' },
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-lockllm-compression': 'toon',
        }),
      })
    );
  });

  it('should set x-lockllm-compression header with compact method', async () => {
    mockHttpClient.post.mockResolvedValueOnce({
      data: { safe: true, request_id: 'req_comp_002' },
    });

    await scanClient.scan(
      { input: 'Some long prompt text' },
      { compressionAction: 'compact' }
    );

    expect(mockHttpClient.post).toHaveBeenCalledWith(
      '/v1/scan',
      { input: 'Some long prompt text' },
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-lockllm-compression': 'compact',
        }),
      })
    );
  });

  // scan.ts - compressionRate header (lines 104-105)
  it('should set x-lockllm-compression-rate header when compressionRate is provided', async () => {
    mockHttpClient.post.mockResolvedValueOnce({
      data: { safe: true, request_id: 'req_comp_003' },
    });

    await scanClient.scan(
      { input: 'Another prompt' },
      { compressionAction: 'compact', compressionRate: 0.5 }
    );

    expect(mockHttpClient.post).toHaveBeenCalledWith(
      '/v1/scan',
      { input: 'Another prompt' },
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-lockllm-compression': 'compact',
          'x-lockllm-compression-rate': '0.5',
        }),
      })
    );
  });

  it('should set compressionRate without compressionAction', async () => {
    mockHttpClient.post.mockResolvedValueOnce({
      data: { safe: true, request_id: 'req_comp_004' },
    });

    await scanClient.scan(
      { input: 'Test prompt' },
      { compressionRate: 0.3 }
    );

    expect(mockHttpClient.post).toHaveBeenCalledWith(
      '/v1/scan',
      { input: 'Test prompt' },
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-lockllm-compression-rate': '0.3',
        }),
      })
    );
  });

  it('should not set compression headers when options are not provided', async () => {
    mockHttpClient.post.mockResolvedValueOnce({
      data: { safe: true, request_id: 'req_comp_005' },
    });

    await scanClient.scan({ input: 'Plain scan' });

    const callHeaders = mockHttpClient.post.mock.calls[0][2].headers;
    expect(callHeaders['x-lockllm-compression']).toBeUndefined();
    expect(callHeaders['x-lockllm-compression-rate']).toBeUndefined();
  });
});

// ============================================================
// proxy-headers.ts - buildLockLLMHeaders compressionRate (lines 71-73)
// ============================================================
describe('buildLockLLMHeaders - compression rate', () => {
  it('should set x-lockllm-compression-rate when compressionRate is provided', () => {
    const headers = buildLockLLMHeaders({
      compressionAction: 'compact',
      compressionRate: 0.5,
    });

    expect(headers['x-lockllm-compression']).toBe('compact');
    expect(headers['x-lockllm-compression-rate']).toBe('0.5');
  });

  it('should set compressionRate independently of compressionAction', () => {
    const headers = buildLockLLMHeaders({
      compressionRate: 0.7,
    });

    expect(headers['x-lockllm-compression-rate']).toBe('0.7');
    expect(headers['x-lockllm-compression']).toBeUndefined();
  });

  it('should handle compressionRate of 0.3 (minimum)', () => {
    const headers = buildLockLLMHeaders({
      compressionRate: 0.3,
    });

    expect(headers['x-lockllm-compression-rate']).toBe('0.3');
  });

  it('should not set compressionRate when undefined', () => {
    const headers = buildLockLLMHeaders({
      compressionAction: 'toon',
    });

    expect(headers['x-lockllm-compression']).toBe('toon');
    expect(headers['x-lockllm-compression-rate']).toBeUndefined();
  });
});

// ============================================================
// proxy-headers.ts - parseProxyMetadata compression (lines 253-261)
// ============================================================
describe('parseProxyMetadata - compression metadata', () => {
  it('should parse compression metadata when compression-method header is present', () => {
    const headers = {
      'x-request-id': 'req_cmp_001',
      'x-lockllm-scanned': 'true',
      'x-lockllm-safe': 'true',
      'x-scan-mode': 'combined',
      'x-lockllm-credits-mode': 'byok',
      'x-lockllm-provider': 'openai',
      'x-lockllm-compression-method': 'toon',
      'x-lockllm-compression-applied': 'true',
      'x-lockllm-compression-ratio': '0.65',
    };

    const metadata = parseProxyMetadata(headers);

    expect(metadata.compression).toBeDefined();
    expect(metadata.compression.method).toBe('toon');
    expect(metadata.compression.applied).toBe(true);
    expect(metadata.compression.ratio).toBe(0.65);
  });

  it('should parse compression metadata with compact method', () => {
    const headers = {
      'x-request-id': 'req_cmp_002',
      'x-lockllm-scanned': 'true',
      'x-lockllm-safe': 'true',
      'x-scan-mode': 'combined',
      'x-lockllm-credits-mode': 'byok',
      'x-lockllm-provider': 'anthropic',
      'x-lockllm-compression-method': 'compact',
      'x-lockllm-compression-applied': 'true',
      'x-lockllm-compression-ratio': '0.42',
    };

    const metadata = parseProxyMetadata(headers);

    expect(metadata.compression).toBeDefined();
    expect(metadata.compression.method).toBe('compact');
    expect(metadata.compression.applied).toBe(true);
    expect(metadata.compression.ratio).toBe(0.42);
  });

  it('should handle compression not applied', () => {
    const headers = {
      'x-request-id': 'req_cmp_003',
      'x-lockllm-scanned': 'true',
      'x-lockllm-safe': 'true',
      'x-scan-mode': 'combined',
      'x-lockllm-credits-mode': 'byok',
      'x-lockllm-provider': 'openai',
      'x-lockllm-compression-method': 'toon',
      'x-lockllm-compression-applied': 'false',
      'x-lockllm-compression-ratio': '1.0',
    };

    const metadata = parseProxyMetadata(headers);

    expect(metadata.compression).toBeDefined();
    expect(metadata.compression.method).toBe('toon');
    expect(metadata.compression.applied).toBe(false);
    expect(metadata.compression.ratio).toBe(1.0);
  });

  it('should default compression ratio to 1.0 when not provided', () => {
    const headers = {
      'x-request-id': 'req_cmp_004',
      'x-lockllm-scanned': 'true',
      'x-lockllm-safe': 'true',
      'x-scan-mode': 'combined',
      'x-lockllm-credits-mode': 'byok',
      'x-lockllm-provider': 'openai',
      'x-lockllm-compression-method': 'toon',
      'x-lockllm-compression-applied': 'true',
    };

    const metadata = parseProxyMetadata(headers);

    expect(metadata.compression).toBeDefined();
    expect(metadata.compression.method).toBe('toon');
    expect(metadata.compression.applied).toBe(true);
    expect(metadata.compression.ratio).toBe(1.0);
  });

  it('should not include compression metadata when method header is absent', () => {
    const headers = {
      'x-request-id': 'req_cmp_005',
      'x-lockllm-scanned': 'true',
      'x-lockllm-safe': 'true',
      'x-scan-mode': 'combined',
      'x-lockllm-credits-mode': 'byok',
      'x-lockllm-provider': 'openai',
    };

    const metadata = parseProxyMetadata(headers);

    expect(metadata.compression).toBeUndefined();
  });
});
