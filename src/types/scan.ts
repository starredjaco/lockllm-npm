/**
 * Scan API types
 */

import type { ScanResult } from './errors';

export type Sensitivity = 'low' | 'medium' | 'high';

/** Scan mode determines which security checks are performed */
export type ScanMode = 'normal' | 'policy_only' | 'combined';

/** Scan action determines behavior when threats are detected */
export type ScanAction = 'block' | 'allow_with_warning';

export interface ScanRequest {
  /** The text prompt to scan for injection attacks */
  input: string;
  /** Detection sensitivity level (default: medium) */
  sensitivity?: Sensitivity;
  /** Scan mode (default: combined) - Check both core security and custom policies */
  mode?: ScanMode;
  /** Force chunking for large inputs */
  chunk?: boolean;
}

/** Scan request options with action headers */
export interface ScanOptions {
  /** Scan action for core injection (default: allow_with_warning) - Threats detected but not blocked */
  scanAction?: ScanAction;
  /** Policy action for custom policies (default: allow_with_warning) - Violations detected but not blocked */
  policyAction?: ScanAction;
  /** Abuse detection action (opt-in, default: null) - When null, abuse detection is disabled */
  abuseAction?: ScanAction | null;
  /** Custom headers to include in the request */
  headers?: Record<string, string>;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Abort signal for cancelling requests */
  signal?: AbortSignal;
}

/** Policy violation details */
export interface PolicyViolation {
  /** Policy name (user-defined or built-in) */
  policy_name: string;
  /** Categories that were violated */
  violated_categories: Array<{
    /** Category name */
    name: string;
  }>;
  /** Specific details about the violation */
  violation_details?: string;
}

/** Scan warning when core injection is detected with allow_with_warning */
export interface ScanWarning {
  /** Warning message */
  message: string;
  /** Injection score (0-100) */
  injection_score: number;
  /** Confidence score (0-100) */
  confidence: number;
  /** Safety label (0 = safe, 1 = unsafe) */
  label: 0 | 1;
}

/** Abuse detection warning */
export interface AbuseWarning {
  /** Whether abuse was detected */
  detected: true;
  /** Overall confidence score (0-100) */
  confidence: number;
  /** Types of abuse detected */
  abuse_types: string[];
  /** Individual abuse indicators */
  indicators: {
    /** Bot-generated content score (0-100) */
    bot_score: number;
    /** Repetition detection score (0-100) */
    repetition_score: number;
    /** Resource exhaustion score (0-100) */
    resource_score: number;
    /** Pattern analysis score (0-100) */
    pattern_score: number;
  };
  /** Recommended mitigation action */
  recommendation?: string;
}

/**
 * Full scan response from the scan API endpoint
 */
export interface ScanResponse {
  /** Unique request identifier */
  request_id: string;
  /** Whether the prompt is safe */
  safe: boolean;
  /** Safety label (0 = safe, 1 = unsafe) */
  label: 0 | 1;
  /** Detection sensitivity level used */
  sensitivity: Sensitivity;
  /** Core injection confidence (not present in policy_only mode) */
  confidence?: number;
  /** Core injection score (not present in policy_only mode) */
  injection?: number;
  /** Policy check confidence (present in policy_only and combined modes) */
  policy_confidence?: number;
  /** Usage statistics */
  usage: {
    /** Number of upstream inference requests */
    requests: number;
    /** Number of input characters processed */
    input_chars: number;
  };
  /** Debug information (only available with pro plan) */
  debug?: {
    /** Total processing duration in milliseconds */
    duration_ms: number;
    /** Inference time in milliseconds */
    inference_ms: number;
    /** Processing mode used */
    mode: 'single' | 'chunked';
  };
  /** Policy warnings (when present in policy_only or combined modes) */
  policy_warnings?: PolicyViolation[];
  /** Scan warning (when core injection detected with allow_with_warning) */
  scan_warning?: ScanWarning;
  /** Abuse warnings (when abuse detected with allow_with_warning) */
  abuse_warnings?: AbuseWarning;
  /** Routing metadata (present when routing is enabled) */
  routing?: {
    /** Whether routing is enabled */
    enabled: boolean;
    /** Detected task type */
    task_type: string;
    /** Complexity score (0-1) */
    complexity: number;
    /** Model selected by router */
    selected_model?: string;
    /** Routing decision reasoning */
    reasoning?: string;
    /** Estimated cost */
    estimated_cost?: number;
  };
}
