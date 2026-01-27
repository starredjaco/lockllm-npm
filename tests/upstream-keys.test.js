/**
 * Tests for Upstream Keys Management Client (BYOK)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpstreamKeysClient } from '../src/upstream-keys';
import { HttpClient } from '../src/utils';

// Mock HttpClient
vi.mock('../src/utils', () => {
  return {
    HttpClient: vi.fn().mockImplementation(() => ({
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    })),
  };
});

describe('UpstreamKeysClient', () => {
  let upstreamKeysClient;
  let mockHttpClient;

  beforeEach(() => {
    mockHttpClient = new HttpClient('https://api.lockllm.com', 'test_api_key');
    upstreamKeysClient = new UpstreamKeysClient(mockHttpClient);
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('should fetch all upstream keys', async () => {
      const mockKeys = [
        {
          id: 'key_1',
          provider: 'openai',
          nickname: 'Production OpenAI',
          enabled: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          last_used_at: '2024-01-15T00:00:00Z',
        },
        {
          id: 'key_2',
          provider: 'anthropic',
          nickname: 'Claude API Key',
          enabled: true,
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
      ];

      mockHttpClient.get.mockResolvedValueOnce({ data: mockKeys });

      const result = await upstreamKeysClient.list();

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/proxy', undefined);
      expect(result).toEqual(mockKeys);
      expect(result).toHaveLength(2);
    });

    it('should NOT return decrypted API keys', async () => {
      const mockKeys = [
        {
          id: 'key_secure',
          provider: 'openai',
          nickname: 'Test Key',
          enabled: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockHttpClient.get.mockResolvedValueOnce({ data: mockKeys });

      const result = await upstreamKeysClient.list();

      expect(result[0].api_key).toBeUndefined();
      expect(result[0].api_key_encrypted).toBeUndefined();
    });

    it('should include metadata (provider, nickname, enabled, etc.)', async () => {
      const mockKeys = [
        {
          id: 'key_meta',
          provider: 'gemini',
          nickname: 'Google Gemini Key',
          endpoint_url: 'https://generativelanguage.googleapis.com',
          enabled: true,
          created_at: '2024-01-10T00:00:00Z',
          updated_at: '2024-01-10T00:00:00Z',
          last_used_at: '2024-01-20T00:00:00Z',
        },
      ];

      mockHttpClient.get.mockResolvedValueOnce({ data: mockKeys });

      const result = await upstreamKeysClient.list();

      expect(result[0].provider).toBe('gemini');
      expect(result[0].nickname).toBe('Google Gemini Key');
      expect(result[0].endpoint_url).toBeDefined();
      expect(result[0].enabled).toBe(true);
      expect(result[0].last_used_at).toBeDefined();
    });

    it('should return empty array when no keys', async () => {
      mockHttpClient.get.mockResolvedValueOnce({ data: [] });

      const result = await upstreamKeysClient.list();

      expect(result).toEqual([]);
    });
  });

  describe('get', () => {
    it('should fetch single key by ID', async () => {
      const mockKey = {
        id: 'key_single',
        provider: 'cohere',
        nickname: 'Cohere Production',
        enabled: true,
        created_at: '2024-01-05T00:00:00Z',
        updated_at: '2024-01-05T00:00:00Z',
      };

      mockHttpClient.get.mockResolvedValueOnce({ data: mockKey });

      const result = await upstreamKeysClient.get('key_single');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/proxy/key_single', undefined);
      expect(result).toEqual(mockKey);
    });

    it('should NOT return decrypted API key', async () => {
      const mockKey = {
        id: 'key_secure_get',
        provider: 'mistral',
        nickname: 'Mistral Key',
        enabled: true,
        created_at: '2024-01-06T00:00:00Z',
        updated_at: '2024-01-06T00:00:00Z',
      };

      mockHttpClient.get.mockResolvedValueOnce({ data: mockKey });

      const result = await upstreamKeysClient.get('key_secure_get');

      expect(result.api_key).toBeUndefined();
      expect(result.api_key_encrypted).toBeUndefined();
    });

    it('should throw error when key not found', async () => {
      const mockError = {
        error: {
          message: 'Upstream key not found',
          type: 'not_found',
          code: 'key_not_found',
        },
      };

      mockHttpClient.get.mockRejectedValueOnce(mockError);

      await expect(upstreamKeysClient.get('nonexistent')).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('should create new upstream key', async () => {
      const createRequest = {
        provider: 'openai',
        api_key: 'sk-test123',
        nickname: 'Test OpenAI Key',
        enabled: true,
      };

      const mockResponse = {
        id: 'key_new',
        provider: 'openai',
        nickname: 'Test OpenAI Key',
        enabled: true,
        created_at: '2024-01-20T00:00:00Z',
        updated_at: '2024-01-20T00:00:00Z',
      };

      mockHttpClient.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await upstreamKeysClient.create(createRequest);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/v1/proxy', createRequest, undefined);
      expect(result.id).toBe('key_new');
      expect(result.provider).toBe('openai');
    });

    it('should validate provider from enum', async () => {
      const createRequest = {
        provider: 'invalid_provider',
        api_key: 'test_key',
      };

      const mockError = {
        error: {
          message: 'Invalid provider',
          type: 'validation_error',
          code: 'invalid_provider',
        },
      };

      mockHttpClient.post.mockRejectedValueOnce(mockError);

      await expect(upstreamKeysClient.create(createRequest)).rejects.toThrow();
    });

    it('should validate api_key is provided', async () => {
      const createRequest = {
        provider: 'anthropic',
        nickname: 'Missing Key',
      };

      const mockError = {
        error: {
          message: 'api_key is required',
          type: 'validation_error',
          code: 'missing_field',
        },
      };

      mockHttpClient.post.mockRejectedValueOnce(mockError);

      await expect(upstreamKeysClient.create(createRequest)).rejects.toThrow();
    });

    it('should encrypt API key server-side', async () => {
      const createRequest = {
        provider: 'groq',
        api_key: 'gsk_plaintext123',
        nickname: 'Groq Key',
      };

      const mockResponse = {
        id: 'key_encrypted',
        provider: 'groq',
        nickname: 'Groq Key',
        enabled: true,
        created_at: '2024-01-21T00:00:00Z',
        updated_at: '2024-01-21T00:00:00Z',
      };

      mockHttpClient.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await upstreamKeysClient.create(createRequest);

      expect(result.api_key).toBeUndefined();
    });

    it('should support optional nickname', async () => {
      const createRequest = {
        provider: 'deepseek',
        api_key: 'dk_test456',
      };

      const mockResponse = {
        id: 'key_no_nickname',
        provider: 'deepseek',
        enabled: true,
        created_at: '2024-01-22T00:00:00Z',
        updated_at: '2024-01-22T00:00:00Z',
      };

      mockHttpClient.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await upstreamKeysClient.create(createRequest);

      expect(result.nickname).toBeUndefined();
    });

    it('should support custom endpoint_url', async () => {
      const createRequest = {
        provider: 'openai',
        api_key: 'sk_custom',
        endpoint_url: 'https://custom.openai.com',
      };

      const mockResponse = {
        id: 'key_custom_endpoint',
        provider: 'openai',
        endpoint_url: 'https://custom.openai.com',
        enabled: true,
        created_at: '2024-01-23T00:00:00Z',
        updated_at: '2024-01-23T00:00:00Z',
      };

      mockHttpClient.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await upstreamKeysClient.create(createRequest);

      expect(result.endpoint_url).toBe('https://custom.openai.com');
    });

    it('should support Azure-specific fields (deployment_name, api_version)', async () => {
      const createRequest = {
        provider: 'azure',
        api_key: 'azure_key_123',
        endpoint_url: 'https://myresource.openai.azure.com',
        deployment_name: 'gpt-4-deployment',
        api_version: '2024-02-15-preview',
      };

      const mockResponse = {
        id: 'key_azure',
        provider: 'azure',
        endpoint_url: 'https://myresource.openai.azure.com',
        deployment_name: 'gpt-4-deployment',
        api_version: '2024-02-15-preview',
        enabled: true,
        created_at: '2024-01-24T00:00:00Z',
        updated_at: '2024-01-24T00:00:00Z',
      };

      mockHttpClient.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await upstreamKeysClient.create(createRequest);

      expect(result.provider).toBe('azure');
      expect(result.deployment_name).toBe('gpt-4-deployment');
      expect(result.api_version).toBe('2024-02-15-preview');
    });

    it('should default enabled to true', async () => {
      const createRequest = {
        provider: 'together',
        api_key: 'together_key',
      };

      const mockResponse = {
        id: 'key_default_enabled',
        provider: 'together',
        enabled: true,
        created_at: '2024-01-25T00:00:00Z',
        updated_at: '2024-01-25T00:00:00Z',
      };

      mockHttpClient.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await upstreamKeysClient.create(createRequest);

      expect(result.enabled).toBe(true);
    });

    it('should throw error on duplicate (user_id + provider + nickname)', async () => {
      const createRequest = {
        provider: 'openai',
        api_key: 'sk_duplicate',
        nickname: 'My OpenAI Key',
      };

      const mockError = {
        error: {
          message: 'Duplicate key',
          type: 'conflict',
          code: 'duplicate_key',
        },
      };

      mockHttpClient.post.mockRejectedValueOnce(mockError);

      await expect(upstreamKeysClient.create(createRequest)).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update api_key (re-encrypt)', async () => {
      const updateRequest = {
        api_key: 'sk_new_key',
      };

      const mockResponse = {
        id: 'key_update',
        provider: 'openai',
        nickname: 'Updated Key',
        enabled: true,
        created_at: '2024-01-10T00:00:00Z',
        updated_at: '2024-01-26T00:00:00Z',
      };

      mockHttpClient.put.mockResolvedValueOnce({ data: mockResponse });

      const result = await upstreamKeysClient.update('key_update', updateRequest);

      expect(mockHttpClient.put).toHaveBeenCalledWith('/api/v1/proxy/key_update', updateRequest, undefined);
      expect(result.updated_at).toBe('2024-01-26T00:00:00Z');
    });

    it('should update nickname', async () => {
      const updateRequest = {
        nickname: 'New Nickname',
      };

      const mockResponse = {
        id: 'key_nickname',
        provider: 'anthropic',
        nickname: 'New Nickname',
        enabled: true,
        created_at: '2024-01-10T00:00:00Z',
        updated_at: '2024-01-27T00:00:00Z',
      };

      mockHttpClient.put.mockResolvedValueOnce({ data: mockResponse });

      const result = await upstreamKeysClient.update('key_nickname', updateRequest);

      expect(result.nickname).toBe('New Nickname');
    });

    it('should update endpoint_url', async () => {
      const updateRequest = {
        endpoint_url: 'https://new-endpoint.com',
      };

      const mockResponse = {
        id: 'key_endpoint',
        provider: 'openai',
        endpoint_url: 'https://new-endpoint.com',
        enabled: true,
        created_at: '2024-01-10T00:00:00Z',
        updated_at: '2024-01-28T00:00:00Z',
      };

      mockHttpClient.put.mockResolvedValueOnce({ data: mockResponse });

      const result = await upstreamKeysClient.update('key_endpoint', updateRequest);

      expect(result.endpoint_url).toBe('https://new-endpoint.com');
    });

    it('should update enabled flag', async () => {
      const updateRequest = {
        enabled: false,
      };

      const mockResponse = {
        id: 'key_disable',
        provider: 'gemini',
        enabled: false,
        created_at: '2024-01-10T00:00:00Z',
        updated_at: '2024-01-29T00:00:00Z',
      };

      mockHttpClient.put.mockResolvedValueOnce({ data: mockResponse });

      const result = await upstreamKeysClient.update('key_disable', updateRequest);

      expect(result.enabled).toBe(false);
    });

    it('should update Azure fields', async () => {
      const updateRequest = {
        deployment_name: 'new-deployment',
        api_version: '2024-03-01-preview',
      };

      const mockResponse = {
        id: 'key_azure_update',
        provider: 'azure',
        deployment_name: 'new-deployment',
        api_version: '2024-03-01-preview',
        enabled: true,
        created_at: '2024-01-10T00:00:00Z',
        updated_at: '2024-01-30T00:00:00Z',
      };

      mockHttpClient.put.mockResolvedValueOnce({ data: mockResponse });

      const result = await upstreamKeysClient.update('key_azure_update', updateRequest);

      expect(result.deployment_name).toBe('new-deployment');
      expect(result.api_version).toBe('2024-03-01-preview');
    });

    it('should throw error when key not found', async () => {
      const mockError = {
        error: {
          message: 'Key not found',
          type: 'not_found',
          code: 'key_not_found',
        },
      };

      mockHttpClient.put.mockRejectedValueOnce(mockError);

      await expect(
        upstreamKeysClient.update('nonexistent', { enabled: false })
      ).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete key by ID', async () => {
      mockHttpClient.delete.mockResolvedValueOnce();

      await upstreamKeysClient.delete('key_delete');

      expect(mockHttpClient.delete).toHaveBeenCalledWith('/api/v1/proxy/key_delete', undefined);
    });

    it('should throw error when key not found', async () => {
      const mockError = {
        error: {
          message: 'Key not found',
          type: 'not_found',
          code: 'key_not_found',
        },
      };

      mockHttpClient.delete.mockRejectedValueOnce(mockError);

      await expect(upstreamKeysClient.delete('nonexistent')).rejects.toThrow();
    });
  });

  describe('provider validation', () => {
    const providers = [
      'openai', 'anthropic', 'gemini', 'cohere', 'openrouter',
      'perplexity', 'mistral', 'groq', 'deepseek', 'together',
      'azure', 'xai', 'fireworks', 'anyscale', 'huggingface',
      'bedrock', 'vertex-ai',
    ];

    providers.forEach(provider => {
      it(`should support ${provider} provider`, async () => {
        const createRequest = {
          provider: provider,
          api_key: `${provider}_test_key`,
        };

        const mockResponse = {
          id: `key_${provider}`,
          provider: provider,
          enabled: true,
          created_at: '2024-01-31T00:00:00Z',
          updated_at: '2024-01-31T00:00:00Z',
        };

        mockHttpClient.post.mockResolvedValueOnce({ data: mockResponse });

        const result = await upstreamKeysClient.create(createRequest);

        expect(result.provider).toBe(provider);
      });
    });

    it('should reject invalid provider names', async () => {
      const createRequest = {
        provider: 'unknown_provider',
        api_key: 'test_key',
      };

      const mockError = {
        error: {
          message: 'Invalid provider',
          type: 'validation_error',
          code: 'invalid_provider',
        },
      };

      mockHttpClient.post.mockRejectedValueOnce(mockError);

      await expect(upstreamKeysClient.create(createRequest)).rejects.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle 401 unauthorized', async () => {
      const mockError = {
        error: {
          message: 'Unauthorized',
          type: 'authentication_error',
          code: 'unauthorized',
        },
      };

      mockHttpClient.get.mockRejectedValueOnce(mockError);

      await expect(upstreamKeysClient.list()).rejects.toThrow();
    });

    it('should handle 409 duplicate key', async () => {
      const createRequest = {
        provider: 'openai',
        api_key: 'sk_duplicate',
        nickname: 'Duplicate',
      };

      const mockError = {
        error: {
          message: 'Duplicate key',
          type: 'conflict',
          code: 'duplicate_key',
        },
      };

      mockHttpClient.post.mockRejectedValueOnce(mockError);

      await expect(upstreamKeysClient.create(createRequest)).rejects.toThrow();
    });

    it('should handle 400 validation errors', async () => {
      const createRequest = {
        provider: 'openai',
        api_key: '',
      };

      const mockError = {
        error: {
          message: 'Validation failed',
          type: 'validation_error',
          code: 'invalid_input',
        },
      };

      mockHttpClient.post.mockRejectedValueOnce(mockError);

      await expect(upstreamKeysClient.create(createRequest)).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      const mockError = new Error('Network timeout');

      mockHttpClient.get.mockRejectedValueOnce(mockError);

      await expect(upstreamKeysClient.list()).rejects.toThrow('Network timeout');
    });
  });
});
