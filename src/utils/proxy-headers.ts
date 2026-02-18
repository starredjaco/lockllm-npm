/**
 * Proxy headers utility functions
 */

import type { ProxyRequestOptions, ProxyResponseMetadata } from '../types/common';

/**
 * Build LockLLM headers from proxy request options
 *
 * Default behavior (when no headers are provided):
 * - Scan Mode: combined (check both core security and custom policies)
 * - Scan Action: allow_with_warning (detect threats but don't block)
 * - Policy Action: allow_with_warning (detect violations but don't block)
 * - Abuse Action: null (abuse detection disabled, opt-in only)
 * - Route Action: disabled (no intelligent routing)
 */
export function buildLockLLMHeaders(options?: ProxyRequestOptions): Record<string, string> {
  const headers: Record<string, string> = {};

  // Scan mode header (controls which security checks are performed)
  if (options?.scanMode) {
    headers['x-lockllm-scan-mode'] = options.scanMode;
  }

  // Scan action header (controls blocking behavior for core injection)
  if (options?.scanAction) {
    headers['x-lockllm-scan-action'] = options.scanAction;
  }

  // Policy action header (controls blocking behavior for policy violations)
  if (options?.policyAction) {
    headers['x-lockllm-policy-action'] = options.policyAction;
  }

  // Abuse action header (opt-in, null means disabled)
  if (options?.abuseAction !== undefined && options?.abuseAction !== null) {
    headers['x-lockllm-abuse-action'] = options.abuseAction;
  }

  // Route action header (controls intelligent routing)
  if (options?.routeAction) {
    headers['x-lockllm-route-action'] = options.routeAction;
  }

  // Response caching control
  if (options?.cacheResponse === false) {
    headers['x-lockllm-cache-response'] = 'false';
  }

  // Cache TTL in seconds
  if (options?.cacheTTL !== undefined) {
    headers['x-lockllm-cache-ttl'] = String(options.cacheTTL);
  }

  return headers;
}

/**
 * Parse proxy metadata from response headers
 */
export function parseProxyMetadata(headers: Headers | Record<string, string>): ProxyResponseMetadata {
  const getHeader = (name: string): string | null => {
    if (headers instanceof Headers) {
      return headers.get(name);
    }
    return headers[name] || headers[name.toLowerCase()] || null;
  };

  const metadata: ProxyResponseMetadata = {
    request_id: getHeader('x-request-id') || '',
    scanned: getHeader('x-lockllm-scanned') === 'true',
    safe: getHeader('x-lockllm-safe') === 'true',
    scan_mode: (getHeader('x-scan-mode') as any) || 'combined',
    credits_mode: (getHeader('x-lockllm-credits-mode') as any) || 'byok',
    provider: getHeader('x-lockllm-provider') || '',
    model: getHeader('x-lockllm-model') || undefined,
  };

  // Parse scan warning
  const scanWarning = getHeader('x-lockllm-scan-warning');
  if (scanWarning === 'true') {
    const injectionScore = getHeader('x-lockllm-injection-score');
    const confidence = getHeader('x-lockllm-confidence');
    const detail = getHeader('x-lockllm-scan-detail');

    metadata.scan_warning = {
      injection_score: injectionScore ? parseFloat(injectionScore) : 0,
      confidence: confidence ? parseFloat(confidence) : 0,
      detail: detail || '',
    };
  }

  // Parse policy warnings
  const policyWarnings = getHeader('x-lockllm-policy-warnings');
  if (policyWarnings === 'true') {
    const count = getHeader('x-lockllm-warning-count');
    const confidence = getHeader('x-lockllm-policy-confidence');
    const detail = getHeader('x-lockllm-warning-detail');

    metadata.policy_warnings = {
      count: count ? parseInt(count, 10) : 0,
      confidence: confidence ? parseFloat(confidence) : 0,
      detail: detail || '',
    };
  }

  // Parse abuse detection
  const abuseDetected = getHeader('x-lockllm-abuse-detected');
  if (abuseDetected === 'true') {
    const confidence = getHeader('x-lockllm-abuse-confidence');
    const types = getHeader('x-lockllm-abuse-types');
    const detail = getHeader('x-lockllm-abuse-detail');

    metadata.abuse_detected = {
      confidence: confidence ? parseFloat(confidence) : 0,
      types: types || '',
      detail: detail || '',
    };
  }

  // Parse routing metadata
  const routeEnabled = getHeader('x-lockllm-route-enabled');
  if (routeEnabled === 'true') {
    const taskType = getHeader('x-lockllm-task-type');
    const complexity = getHeader('x-lockllm-complexity');
    const selectedModel = getHeader('x-lockllm-selected-model');
    const routingReason = getHeader('x-lockllm-routing-reason');
    const originalProvider = getHeader('x-lockllm-original-provider');
    const originalModel = getHeader('x-lockllm-original-model');
    const estimatedSavings = getHeader('x-lockllm-estimated-savings');

    metadata.routing = {
      enabled: true,
      task_type: taskType || '',
      complexity: complexity ? parseFloat(complexity) : 0,
      selected_model: selectedModel || '',
      routing_reason: routingReason || '',
      original_provider: originalProvider || '',
      original_model: originalModel || '',
      estimated_savings: estimatedSavings ? parseFloat(estimatedSavings) : 0,
    };
  }

  // Parse credit tracking
  const creditsReserved = getHeader('x-lockllm-credits-reserved');
  if (creditsReserved) {
    metadata.credits_reserved = parseFloat(creditsReserved);
  }

  const routingFeeReserved = getHeader('x-lockllm-routing-fee-reserved');
  if (routingFeeReserved) {
    metadata.routing_fee_reserved = parseFloat(routingFeeReserved);
  }

  // Parse cache status
  const cacheStatus = getHeader('x-lockllm-cache-status');
  if (cacheStatus) {
    metadata.cache_status = cacheStatus as 'HIT' | 'MISS';
  }

  const cacheAge = getHeader('x-lockllm-cache-age');
  if (cacheAge) {
    metadata.cache_age = parseInt(cacheAge, 10);
  }

  const tokensSaved = getHeader('x-lockllm-tokens-saved');
  if (tokensSaved) {
    metadata.tokens_saved = parseInt(tokensSaved, 10);
  }

  const costSaved = getHeader('x-lockllm-cost-saved');
  if (costSaved) {
    metadata.cost_saved = parseFloat(costSaved);
  }

  const creditsDeducted = getHeader('x-lockllm-credits-deducted');
  if (creditsDeducted) {
    metadata.credits_deducted = parseFloat(creditsDeducted);
  }

  const balanceAfter = getHeader('x-lockllm-balance-after');
  if (balanceAfter) {
    metadata.balance_after = parseFloat(balanceAfter);
  }

  return metadata;
}

/**
 * Decode base64-encoded detail field
 */
export function decodeDetailField(detail: string): any {
  try {
    const decoded = atob(detail);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}
