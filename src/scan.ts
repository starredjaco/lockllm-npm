/**
 * Scan API implementation
 */

import { HttpClient } from './utils';
import type { ScanRequest, ScanResponse, ScanOptions } from './types/scan';
import type { RequestOptions } from './types/common';

export class ScanClient {
  private http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  /**
   * Scan a prompt for injection attacks
   *
   * @param request - Scan request parameters
   * @param options - Scan options with action headers
   * @returns Scan result with safety information
   *
   * @example
   * ```typescript
   * // Basic scan with combined mode (default)
   * const result = await client.scan({
   *   input: "Ignore previous instructions and...",
   *   sensitivity: "medium",
   *   mode: "combined"  // Check both core security + custom policies
   * }, {
   *   scanAction: "block",          // Block core injection attacks
   *   policyAction: "allow_with_warning",  // Allow but warn on policy violations
   *   abuseAction: "block"          // Opt-in abuse detection
   * });
   *
   * if (!result.safe) {
   *   console.log("Malicious prompt detected!");
   *   console.log("Injection score:", result.injection);
   *
   *   // Check for policy violations
   *   if (result.policy_warnings) {
   *     console.log("Policy violations:", result.policy_warnings);
   *   }
   *
   *   // Check for abuse warnings
   *   if (result.abuse_warnings) {
   *     console.log("Abuse detected:", result.abuse_warnings);
   *   }
   * }
   * ```
   */
  async scan(
    request: ScanRequest,
    options?: ScanOptions
  ): Promise<ScanResponse> {
    // Build headers from scan options
    const headers: Record<string, string> = {
      ...(options?.headers || {}),
    };

    // Add scan mode header (switched from body to header)
    if (request.mode) {
      headers['x-lockllm-scan-mode'] = request.mode;
    }

    // Add sensitivity header (switched from body to header)
    if (request.sensitivity) {
      headers['x-lockllm-sensitivity'] = request.sensitivity;
    }

    // Add chunk header (switched from body to header)
    if (request.chunk !== undefined) {
      headers['x-lockllm-chunk'] = request.chunk ? 'true' : 'false';
    }

    // Add action headers if provided
    // Scan action: controls core injection detection behavior
    if (options?.scanAction) {
      headers['x-lockllm-scan-action'] = options.scanAction;
    }

    // Policy action: controls custom policy violation behavior
    if (options?.policyAction) {
      headers['x-lockllm-policy-action'] = options.policyAction;
    }

    // Abuse action: opt-in abuse detection (null/undefined means disabled)
    if (options?.abuseAction !== undefined && options?.abuseAction !== null) {
      headers['x-lockllm-abuse-action'] = options.abuseAction;
    }

    // Build request body (now only contains input)
    const body: Record<string, any> = {
      input: request.input,
    };

    const { data } = await this.http.post<ScanResponse>(
      '/v1/scan',
      body,
      {
        headers,
        timeout: options?.timeout,
        signal: options?.signal,
      }
    );

    return data;
  }
}
