/**
 * Tests for Policies Management Client
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PoliciesClient } from '../src/policies';
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

describe('PoliciesClient', () => {
  let policiesClient;
  let mockHttpClient;

  beforeEach(() => {
    mockHttpClient = new HttpClient('https://api.lockllm.com', 'test_api_key');
    policiesClient = new PoliciesClient(mockHttpClient);
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('should fetch all policies', async () => {
      const mockPolicies = [
        {
          id: 'policy_1',
          policy_name: 'No Medical Advice',
          policy_description: 'Prohibit medical diagnoses',
          enabled: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'policy_2',
          policy_name: 'No Financial Advice',
          policy_description: 'Prohibit financial advice',
          enabled: true,
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
      ];

      mockHttpClient.get.mockResolvedValueOnce({ data: mockPolicies });

      const result = await policiesClient.list();

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/policies', undefined);
      expect(result).toEqual(mockPolicies);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no policies', async () => {
      mockHttpClient.get.mockResolvedValueOnce({ data: [] });

      const result = await policiesClient.list();

      expect(result).toEqual([]);
    });

    it('should parse policy objects correctly', async () => {
      const mockPolicies = [
        {
          id: 'policy_1',
          policy_name: 'Test Policy',
          policy_description: 'Test description',
          enabled: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockHttpClient.get.mockResolvedValueOnce({ data: mockPolicies });

      const result = await policiesClient.list();

      expect(result[0].id).toBe('policy_1');
      expect(result[0].policy_name).toBe('Test Policy');
      expect(result[0].enabled).toBe(true);
    });
  });

  describe('get', () => {
    it('should fetch single policy by ID', async () => {
      const mockPolicy = {
        id: 'policy_1',
        policy_name: 'No Medical Advice',
        policy_description: 'Prohibit medical diagnoses',
        enabled: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockHttpClient.get.mockResolvedValueOnce({ data: mockPolicy });

      const result = await policiesClient.get('policy_1');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/policies/policy_1', undefined);
      expect(result).toEqual(mockPolicy);
    });

    it('should throw error when policy not found', async () => {
      const mockError = {
        error: {
          message: 'Policy not found',
          type: 'not_found',
          code: 'policy_not_found',
        },
      };

      mockHttpClient.get.mockRejectedValueOnce(mockError);

      await expect(policiesClient.get('nonexistent')).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('should create new policy', async () => {
      const createRequest = {
        policy_name: 'No Medical Advice',
        policy_description: 'Prohibit medical diagnoses and treatment recommendations',
        enabled: true,
      };

      const mockResponse = {
        id: 'policy_1',
        ...createRequest,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockHttpClient.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await policiesClient.create(createRequest);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/v1/policies', createRequest, undefined);
      expect(result.id).toBe('policy_1');
      expect(result.policy_name).toBe('No Medical Advice');
    });

    it('should validate policy_name is provided', async () => {
      const createRequest = {
        policy_description: 'Test description',
      };

      const mockError = {
        error: {
          message: 'policy_name is required',
          type: 'validation_error',
          code: 'missing_field',
        },
      };

      mockHttpClient.post.mockRejectedValueOnce(mockError);

      await expect(policiesClient.create(createRequest)).rejects.toThrow();
    });

    it('should validate policy_description is provided', async () => {
      const createRequest = {
        policy_name: 'Test Policy',
      };

      const mockError = {
        error: {
          message: 'policy_description is required',
          type: 'validation_error',
          code: 'missing_field',
        },
      };

      mockHttpClient.post.mockRejectedValueOnce(mockError);

      await expect(policiesClient.create(createRequest)).rejects.toThrow();
    });

    it('should default enabled to true', async () => {
      const createRequest = {
        policy_name: 'Test Policy',
        policy_description: 'Test description',
      };

      const mockResponse = {
        id: 'policy_1',
        ...createRequest,
        enabled: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockHttpClient.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await policiesClient.create(createRequest);

      expect(result.enabled).toBe(true);
    });

    it('should return created policy with ID', async () => {
      const createRequest = {
        policy_name: 'Test Policy',
        policy_description: 'Test description',
        enabled: true,
      };

      const mockResponse = {
        id: 'policy_123',
        ...createRequest,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockHttpClient.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await policiesClient.create(createRequest);

      expect(result.id).toBeDefined();
      expect(result.id).toBe('policy_123');
    });
  });

  describe('update', () => {
    it('should update policy_name', async () => {
      const updateRequest = {
        policy_name: 'Updated Policy Name',
      };

      const mockResponse = {
        id: 'policy_1',
        policy_name: 'Updated Policy Name',
        policy_description: 'Original description',
        enabled: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      mockHttpClient.put.mockResolvedValueOnce({ data: mockResponse });

      const result = await policiesClient.update('policy_1', updateRequest);

      expect(mockHttpClient.put).toHaveBeenCalledWith('/api/v1/policies/policy_1', updateRequest, undefined);
      expect(result.policy_name).toBe('Updated Policy Name');
    });

    it('should update policy_description', async () => {
      const updateRequest = {
        policy_description: 'Updated description',
      };

      const mockResponse = {
        id: 'policy_1',
        policy_name: 'Test Policy',
        policy_description: 'Updated description',
        enabled: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      mockHttpClient.put.mockResolvedValueOnce({ data: mockResponse });

      const result = await policiesClient.update('policy_1', updateRequest);

      expect(result.policy_description).toBe('Updated description');
    });

    it('should update enabled flag', async () => {
      const updateRequest = {
        enabled: false,
      };

      const mockResponse = {
        id: 'policy_1',
        policy_name: 'Test Policy',
        policy_description: 'Test description',
        enabled: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      mockHttpClient.put.mockResolvedValueOnce({ data: mockResponse });

      const result = await policiesClient.update('policy_1', updateRequest);

      expect(result.enabled).toBe(false);
    });

    it('should throw error when policy not found', async () => {
      const mockError = {
        error: {
          message: 'Policy not found',
          type: 'not_found',
          code: 'policy_not_found',
        },
      };

      mockHttpClient.put.mockRejectedValueOnce(mockError);

      await expect(
        policiesClient.update('nonexistent', { enabled: false })
      ).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete policy by ID', async () => {
      mockHttpClient.delete.mockResolvedValueOnce();

      await policiesClient.delete('policy_1');

      expect(mockHttpClient.delete).toHaveBeenCalledWith('/api/v1/policies/policy_1', undefined);
    });

    it('should throw error when policy not found', async () => {
      const mockError = {
        error: {
          message: 'Policy not found',
          type: 'not_found',
          code: 'policy_not_found',
        },
      };

      mockHttpClient.delete.mockRejectedValueOnce(mockError);

      await expect(policiesClient.delete('nonexistent')).rejects.toThrow();
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

      await expect(policiesClient.list()).rejects.toThrow();
    });

    it('should handle 409 duplicate policy name', async () => {
      const mockError = {
        error: {
          message: 'Policy name already exists',
          type: 'conflict',
          code: 'duplicate_policy_name',
        },
      };

      mockHttpClient.post.mockRejectedValueOnce(mockError);

      await expect(
        policiesClient.create({
          policy_name: 'Duplicate',
          policy_description: 'Test',
        })
      ).rejects.toThrow();
    });

    it('should handle 400 validation errors', async () => {
      const mockError = {
        error: {
          message: 'Validation failed',
          type: 'validation_error',
          code: 'invalid_input',
        },
      };

      mockHttpClient.post.mockRejectedValueOnce(mockError);

      await expect(
        policiesClient.create({
          policy_name: '',
          policy_description: '',
        })
      ).rejects.toThrow();
    });
  });
});
