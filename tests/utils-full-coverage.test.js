/**
 * Full coverage tests for utils - targeting uncovered lines (PUT and DELETE methods)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HttpClient } from '../src/utils';

describe('HttpClient - PUT and DELETE methods', () => {
  let client;

  beforeEach(() => {
    client = new HttpClient('https://api.lockllm.com', 'test_api_key', 5000, 0);
  });

  describe('PUT method', () => {
    it('should make PUT request successfully', async () => {
      const mockResponse = { id: '123', status: 'updated' };

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          headers: new Map([['X-Request-Id', 'req_put_123']]),
          json: () => Promise.resolve(mockResponse),
        })
      );

      const result = await client.put('/test/resource', { name: 'Updated' });

      expect(result.data).toEqual(mockResponse);
      expect(result.requestId).toBe('req_put_123');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.lockllm.com/test/resource',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ name: 'Updated' }),
        })
      );
    });

    it('should make PUT request without body', async () => {
      const mockResponse = { success: true };

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          headers: new Map([['X-Request-Id', 'req_put_456']]),
          json: () => Promise.resolve(mockResponse),
        })
      );

      const result = await client.put('/test/resource');

      expect(result.data).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.lockllm.com/test/resource',
        expect.objectContaining({
          method: 'PUT',
          body: undefined,
        })
      );
    });

    it('should handle PUT request with custom options', async () => {
      const mockResponse = { updated: true };

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          headers: new Map([['X-Request-Id', 'req_custom']]),
          json: () => Promise.resolve(mockResponse),
        })
      );

      const options = {
        headers: { 'X-Custom-Header': 'test' },
        timeout: 10000,
      };

      await client.put('/resource', { value: 42 }, options);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.lockllm.com/resource',
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'X-Custom-Header': 'test',
          }),
        })
      );
    });
  });

  describe('DELETE method', () => {
    it('should make DELETE request successfully', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 204,
          headers: new Map([['X-Request-Id', 'req_delete_123']]),
          json: () => Promise.resolve({}),
        })
      );

      await client.delete('/test/resource/123');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.lockllm.com/test/resource/123',
        expect.objectContaining({
          method: 'DELETE',
          body: undefined,
        })
      );
    });

    it('should handle DELETE request with custom options', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          headers: new Map([['X-Request-Id', 'req_delete_custom']]),
          json: () => Promise.resolve({}),
        })
      );

      const options = {
        headers: { 'X-Delete-Reason': 'cleanup' },
        timeout: 15000,
      };

      await client.delete('/resource/456', options);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.lockllm.com/resource/456',
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'X-Delete-Reason': 'cleanup',
          }),
        })
      );
    });

    it('should handle DELETE request with error response', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          headers: new Map([['X-Request-Id', 'req_error']]),
          json: () =>
            Promise.resolve({
              error: {
                message: 'Resource not found',
                type: 'not_found_error',
                code: 'not_found',
              },
            }),
        })
      );

      await expect(client.delete('/resource/nonexistent')).rejects.toThrow();
    });

    it('should make DELETE request without response body', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 204,
          headers: new Map([['X-Request-Id', 'req_no_body']]),
          json: () => Promise.resolve(null),
        })
      );

      await expect(client.delete('/resource/789')).resolves.toBeUndefined();
    });
  });
});
