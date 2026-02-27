/**
 * Common types used throughout the SDK
 */

import type { Sensitivity } from './scan';

export interface LockLLMConfig {
  /** Your LockLLM API key */
  apiKey: string;
  /** Base URL for LockLLM API (default: https://api.lockllm.com) */
  baseURL?: string;
  /** Request timeout in milliseconds (default: 60000) */
  timeout?: number;
  /** Maximum number of retries for rate-limited requests (default: 3) */
  maxRetries?: number;
}

export interface RequestOptions {
  /** Custom headers to include in the request */
  headers?: Record<string, string>;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Abort signal for cancelling requests */
  signal?: AbortSignal;
}

export interface ErrorResponse {
  error: {
    message: string;
    type: string;
    code?: string;
    [key: string]: any;
  };
}

export type Provider =
  | 'openai'
  | 'anthropic'
  | 'gemini'
  | 'cohere'
  | 'openrouter'
  | 'perplexity'
  | 'mistral'
  | 'groq'
  | 'deepseek'
  | 'together'
  | 'xai'
  | 'fireworks'
  | 'anyscale'
  | 'huggingface'
  | 'azure'
  | 'bedrock'
  | 'vertex-ai';

/** Scan mode for security checks */
export type ScanMode = 'normal' | 'policy_only' | 'combined';

/** Scan action for threat detection */
export type ScanAction = 'block' | 'allow_with_warning';

/** Routing action for intelligent model selection */
export type RouteAction = 'disabled' | 'auto' | 'custom';

/** PII detection action (opt-in) */
export type PIIAction = 'strip' | 'block' | 'allow_with_warning';

/** Prompt compression method (opt-in) */
export type CompressionAction = 'toon' | 'compact' | 'combined';

/** Proxy request options with advanced headers */
export interface ProxyRequestOptions extends RequestOptions {
  /** Scan mode (default: combined) - Check both core security and custom policies */
  scanMode?: ScanMode;
  /** Scan action for core injection (default: allow_with_warning) - Threats detected but not blocked */
  scanAction?: ScanAction;
  /** Policy action for custom policies (default: allow_with_warning) - Violations detected but not blocked */
  policyAction?: ScanAction;
  /** Abuse detection action (opt-in, default: null) - When null, abuse detection is disabled */
  abuseAction?: ScanAction | null;
  /** Routing action (default: disabled) - No smart routing unless explicitly enabled */
  routeAction?: RouteAction;
  /** PII detection action (opt-in, default: null) - When null, PII detection is disabled */
  piiAction?: PIIAction | null;
  /** Detection sensitivity level (default: medium) - Controls injection detection threshold */
  sensitivity?: Sensitivity;
  /** Response caching (default: enabled). Set false to disable. */
  cacheResponse?: boolean;
  /** Cache TTL in seconds (default: 3600) */
  cacheTTL?: number;
  /** Prompt compression method (opt-in, default: null) - When null, compression is disabled.
   *  "toon" converts JSON to compact notation (free). "compact" uses advanced compression ($0.0001/use).
   *  "combined" applies TOON first then Compact for maximum compression ($0.0001/use). */
  compressionAction?: CompressionAction | null;
  /** Compression rate for compact method (0.3-0.7, default: 0.5) - Lower = more compression */
  compressionRate?: number;
}

/** Response metadata from proxy */
export interface ProxyResponseMetadata {
  /** Unique request identifier */
  request_id: string;
  /** Whether the request was scanned */
  scanned: boolean;
  /** Whether the request is safe */
  safe: boolean;
  /** Scan mode used */
  scan_mode: ScanMode;
  /** Credits mode (lockllm_credits or byok) */
  credits_mode: 'lockllm_credits' | 'byok';
  /** Provider used */
  provider: string;
  /** Model used */
  model?: string;
  /** Detection sensitivity level used */
  sensitivity?: string;
  /** Safety label (0 = safe, 1 = unsafe) */
  label?: number;
  /** Whether the request was blocked */
  blocked?: boolean;
  /** Scan warning details */
  scan_warning?: {
    injection_score: number;
    confidence: number;
    detail: string;
  };
  /** Policy violation warnings */
  policy_warnings?: {
    count: number;
    confidence: number;
    detail: string;
  };
  /** Abuse detection warnings */
  abuse_detected?: {
    confidence: number;
    types: string;
    detail: string;
  };
  /** PII detection metadata */
  pii_detected?: {
    detected: boolean;
    entity_types: string;
    entity_count: number;
    action: string;
  };
  /** Routing metadata */
  routing?: {
    enabled: boolean;
    task_type: string;
    complexity: number;
    selected_model: string;
    routing_reason: string;
    original_provider: string;
    original_model: string;
    estimated_savings: number;
    estimated_original_cost: number;
    estimated_routed_cost: number;
    estimated_input_tokens: number;
    estimated_output_tokens: number;
    routing_fee_reason: string;
  };
  /** Credits reserved for this request */
  credits_reserved?: number;
  /** Routing fee reserved */
  routing_fee_reserved?: number;
  /** Actual credits deducted (available after completion) */
  credits_deducted?: number;
  /** Balance after this request (available after completion) */
  balance_after?: number;
  /** Cache status for this response */
  cache_status?: 'HIT' | 'MISS';
  /** Cache age in seconds (when cache hit) */
  cache_age?: number;
  /** Tokens saved from cache hit */
  tokens_saved?: number;
  /** Cost saved from cache hit */
  cost_saved?: number;
  /** Decoded scan detail (from base64 header) */
  scan_detail?: any;
  /** Decoded policy warning detail (from base64 header) */
  policy_detail?: any;
  /** Decoded abuse detail (from base64 header) */
  abuse_detail?: any;
  /** Compression metadata */
  compression?: {
    method: string;
    applied: boolean;
    ratio: number;
  };
}
