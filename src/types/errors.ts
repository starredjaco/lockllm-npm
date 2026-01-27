/**
 * Error type definitions
 */

export interface ScanResult {
  safe: boolean;
  label: 0 | 1;
  confidence: number;
  injection: number;
  sensitivity: 'low' | 'medium' | 'high';
}

export interface LockLLMErrorData {
  message: string;
  type: string;
  code?: string;
  status?: number;
  requestId?: string;
  [key: string]: any;
}

export interface PromptInjectionErrorData extends LockLLMErrorData {
  scanResult: ScanResult;
}

export interface PolicyViolationErrorData extends LockLLMErrorData {
  violated_policies: Array<{
    policy_name: string;
    violated_categories: Array<{ name: string }>;
    violation_details?: string;
  }>;
}

export interface AbuseDetectedErrorData extends LockLLMErrorData {
  abuse_details: {
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
}

export interface InsufficientCreditsErrorData extends LockLLMErrorData {
  current_balance: number;
  estimated_cost: number;
}
