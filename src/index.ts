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
} from './types/scan';

export type {
  ScanResult,
  LockLLMErrorData,
  PromptInjectionErrorData,
  PolicyViolationErrorData,
  AbuseDetectedErrorData,
  InsufficientCreditsErrorData,
} from './types/errors';

export type { ProviderName } from './types/providers';

// Management API types
export type {
  CustomPolicy,
  CreatePolicyRequest,
  UpdatePolicyRequest,
} from './policies';

export type {
  TaskType,
  ComplexityTier,
  RoutingRule,
  CreateRoutingRuleRequest,
  UpdateRoutingRuleRequest,
} from './routing';

export type {
  TierInfo,
  CreditBalance,
  TransactionType,
  CreditTransaction,
  ListTransactionsOptions,
} from './tiers';

export type {
  LogType,
  LogStatus,
  ActivityLog,
  LogsQueryOptions,
} from './logs';

export type {
  WebhookConfig,
  CreateWebhookRequest,
} from './webhooks';

export type {
  UpstreamKey,
  CreateUpstreamKeyRequest,
  UpdateUpstreamKeyRequest,
} from './upstream-keys';

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
