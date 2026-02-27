/**
 * LockLLM JavaScript/TypeScript SDK
 *
 * Universal AI security SDK with prompt injection detection.
 * Completely free with unlimited usage. BYOK (Bring Your Own Key).
 *
 * @packageDocumentation
 */

// Main client
export { LockLLM } from './client';

// Error classes
export {
  LockLLMError,
  AuthenticationError,
  RateLimitError,
  PromptInjectionError,
  PolicyViolationError,
  AbuseDetectedError,
  PIIDetectedError,
  InsufficientCreditsError,
  UpstreamError,
  ConfigurationError,
  NetworkError,
} from './errors';

// Types
export type {
  LockLLMConfig,
  RequestOptions,
  Provider,
  ScanMode,
  ScanAction,
  RouteAction,
  PIIAction,
  CompressionAction,
  ProxyRequestOptions,
  ProxyResponseMetadata,
} from './types/common';

export type {
  ScanRequest,
  ScanResponse,
  ScanOptions,
  Sensitivity,
  PolicyViolation,
  ScanWarning,
  AbuseWarning,
  PIIResult,
  CompressionResult,
} from './types/scan';

export type {
  ScanResult,
  LockLLMErrorData,
  PromptInjectionErrorData,
  PolicyViolationErrorData,
  AbuseDetectedErrorData,
  PIIDetectedErrorData,
  InsufficientCreditsErrorData,
} from './types/errors';

export type { ProviderName } from './types/providers';

// Utilities
export { getProxyURL, getAllProxyURLs, getUniversalProxyURL } from './utils';
export { buildLockLLMHeaders, parseProxyMetadata, decodeDetailField } from './utils/proxy-headers';

// Wrappers (re-exported for convenience)
export {
  createOpenAI,
  createAnthropic,
  createClient,
  createOpenAICompatible,
  createGroq,
  createDeepSeek,
  createPerplexity,
  createMistral,
  createOpenRouter,
  createTogether,
  createXAI,
  createFireworks,
  createAnyscale,
  createHuggingFace,
  createGemini,
  createCohere,
  createAzure,
  createBedrock,
  createVertexAI,
} from './wrappers';
