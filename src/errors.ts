/**
 * Custom error classes for LockLLM SDK
 */

import type {
  ScanResult,
  LockLLMErrorData,
  PromptInjectionErrorData,
  PolicyViolationErrorData,
  AbuseDetectedErrorData,
  InsufficientCreditsErrorData,
} from './types/errors';

/**
 * Base error class for all LockLLM errors
 */
export class LockLLMError extends Error {
  public readonly type: string;
  public readonly code?: string;
  public readonly status?: number;
  public readonly requestId?: string;

  constructor(data: LockLLMErrorData) {
    super(data.message);
    this.name = 'LockLLMError';
    this.type = data.type;
    this.code = data.code;
    this.status = data.status;
    this.requestId = data.requestId;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error thrown when authentication fails
 */
export class AuthenticationError extends LockLLMError {
  constructor(message: string, requestId?: string) {
    super({
      message,
      type: 'authentication_error',
      code: 'unauthorized',
      status: 401,
      requestId,
    });
    this.name = 'AuthenticationError';
  }
}

/**
 * Error thrown when rate limit is exceeded
 */
export class RateLimitError extends LockLLMError {
  public readonly retryAfter?: number;

  constructor(message: string, retryAfter?: number, requestId?: string) {
    super({
      message,
      type: 'rate_limit_error',
      code: 'rate_limited',
      status: 429,
      requestId,
    });
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Error thrown when a prompt is blocked due to injection detection
 */
export class PromptInjectionError extends LockLLMError {
  public readonly scanResult: ScanResult;

  constructor(data: PromptInjectionErrorData) {
    super({
      message: data.message,
      type: 'lockllm_security_error',
      code: 'prompt_injection_detected',
      status: 400,
      requestId: data.requestId,
    });
    this.name = 'PromptInjectionError';
    this.scanResult = data.scanResult;
  }
}

/**
 * Error thrown when upstream provider returns an error
 */
export class UpstreamError extends LockLLMError {
  public readonly provider?: string;
  public readonly upstreamStatus?: number;

  constructor(
    message: string,
    provider?: string,
    upstreamStatus?: number,
    requestId?: string
  ) {
    super({
      message,
      type: 'upstream_error',
      code: 'provider_error',
      status: 502,
      requestId,
    });
    this.name = 'UpstreamError';
    this.provider = provider;
    this.upstreamStatus = upstreamStatus;
  }
}

/**
 * Error thrown when configuration is missing or invalid
 */
export class ConfigurationError extends LockLLMError {
  constructor(message: string) {
    super({
      message,
      type: 'configuration_error',
      code: 'invalid_config',
      status: 400,
    });
    this.name = 'ConfigurationError';
  }
}

/**
 * Error thrown when custom policy violations are detected
 */
export class PolicyViolationError extends LockLLMError {
  public readonly violated_policies: Array<{
    policy_name: string;
    violated_categories: Array<{ name: string }>;
    violation_details?: string;
  }>;

  constructor(data: PolicyViolationErrorData) {
    super({
      message: data.message,
      type: 'lockllm_policy_error',
      code: 'policy_violation',
      status: 403,
      requestId: data.requestId,
    });
    this.name = 'PolicyViolationError';
    this.violated_policies = data.violated_policies;
  }
}

/**
 * Error thrown when AI abuse is detected
 */
export class AbuseDetectedError extends LockLLMError {
  public readonly abuse_details: {
    confidence: number;
    abuse_types: string[];
    indicators: {
      bot_score: number;
      repetition_score: number;
      resource_score: number;
      pattern_score: number;
    };
    recommendation?: string;
  };

  constructor(data: AbuseDetectedErrorData) {
    super({
      message: data.message,
      type: 'lockllm_abuse_error',
      code: 'abuse_detected',
      status: 400,
      requestId: data.requestId,
    });
    this.name = 'AbuseDetectedError';
    this.abuse_details = data.abuse_details;
  }
}

/**
 * Error thrown when user has insufficient credits
 */
export class InsufficientCreditsError extends LockLLMError {
  public readonly current_balance: number;
  public readonly estimated_cost: number;

  constructor(data: InsufficientCreditsErrorData) {
    super({
      message: data.message,
      type: 'lockllm_balance_error',
      code: 'insufficient_credits',
      status: 402,
      requestId: data.requestId,
    });
    this.name = 'InsufficientCreditsError';
    this.current_balance = data.current_balance;
    this.estimated_cost = data.estimated_cost;
  }
}

/**
 * Error thrown when network request fails
 */
export class NetworkError extends LockLLMError {
  public readonly cause?: Error;

  constructor(message: string, cause?: Error, requestId?: string) {
    super({
      message,
      type: 'network_error',
      code: 'connection_failed',
      status: 0,
      requestId,
    });
    this.name = 'NetworkError';
    this.cause = cause;
  }
}

/**
 * Parse error response from API and throw appropriate error
 */
export function parseError(response: any, requestId?: string): LockLLMError {
  const error = response?.error;

  if (!error) {
    return new LockLLMError({
      message: 'Unknown error occurred',
      type: 'unknown_error',
      requestId,
    });
  }

  // Prompt injection error
  if (error.code === 'prompt_injection_detected' && error.scan_result) {
    return new PromptInjectionError({
      message: error.message,
      type: error.type,
      code: error.code,
      status: 400,
      requestId: error.request_id || requestId,
      scanResult: error.scan_result,
    });
  }

  // Policy violation error
  if (error.code === 'policy_violation' && error.violated_policies) {
    return new PolicyViolationError({
      message: error.message,
      type: error.type,
      code: error.code,
      status: 403,
      requestId: error.request_id || requestId,
      violated_policies: error.violated_policies,
    });
  }

  // Abuse detected error
  if (error.code === 'abuse_detected' && error.abuse_details) {
    return new AbuseDetectedError({
      message: error.message,
      type: error.type,
      code: error.code,
      status: 400,
      requestId: error.request_id || requestId,
      abuse_details: error.abuse_details,
    });
  }

  // Insufficient credits error
  if (error.code === 'insufficient_credits') {
    return new InsufficientCreditsError({
      message: error.message,
      type: error.type,
      code: error.code,
      status: 402,
      requestId: error.request_id || requestId,
      current_balance: error.current_balance || 0,
      estimated_cost: error.estimated_cost || 0,
    });
  }

  // Authentication error
  if (error.type === 'authentication_error' || error.code === 'unauthorized') {
    return new AuthenticationError(error.message, requestId);
  }

  // Rate limit error
  if (error.type === 'rate_limit_error' || error.code === 'rate_limited') {
    return new RateLimitError(error.message, undefined, requestId);
  }

  // Upstream provider error
  if (error.type === 'upstream_error' || error.code === 'provider_error') {
    return new UpstreamError(error.message, undefined, undefined, requestId);
  }

  // Configuration error
  if (
    error.type === 'configuration_error' ||
    error.type === 'lockllm_config_error' ||
    error.code === 'no_upstream_key'
  ) {
    return new ConfigurationError(error.message);
  }

  // Generic error
  return new LockLLMError({
    message: error.message || 'An error occurred',
    type: error.type || 'unknown_error',
    code: error.code,
    requestId,
  });
}
