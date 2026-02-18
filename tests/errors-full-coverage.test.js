/**
 * Full coverage tests for error classes - targeting uncovered lines
 */

import { describe, it, expect } from 'vitest';
import {
  PolicyViolationError,
  AbuseDetectedError,
  InsufficientCreditsError,
  parseError,
} from '../src/errors';

describe('PolicyViolationError', () => {
  it('should create policy violation error with violated policies', () => {
    const violatedPolicies = [
      {
        policy_name: 'No Profanity',
        violated_categories: [{ name: 'Offensive Language' }],
        violation_details: 'Contains profane words',
      },
    ];

    const error = new PolicyViolationError({
      message: 'Policy violation detected',
      violated_policies: violatedPolicies,
      requestId: 'req_456',
    });

    expect(error.name).toBe('PolicyViolationError');
    expect(error.message).toBe('Policy violation detected');
    expect(error.type).toBe('lockllm_policy_error');
    expect(error.code).toBe('policy_violation');
    expect(error.status).toBe(403);
    expect(error.requestId).toBe('req_456');
    expect(error.violated_policies).toEqual(violatedPolicies);
  });
});

describe('AbuseDetectedError', () => {
  it('should create abuse detected error with abuse details', () => {
    const abuseDetails = {
      confidence: 95,
      abuse_types: ['bot_generated', 'rapid_requests'],
      indicators: {
        bot_score: 85,
        repetition_score: 60,
        resource_score: 40,
        pattern_score: 90,
      },
      recommendation: 'Block this user',
    };

    const error = new AbuseDetectedError({
      message: 'AI abuse detected',
      abuse_details: abuseDetails,
      requestId: 'req_789',
    });

    expect(error.name).toBe('AbuseDetectedError');
    expect(error.message).toBe('AI abuse detected');
    expect(error.type).toBe('lockllm_abuse_error');
    expect(error.code).toBe('abuse_detected');
    expect(error.status).toBe(400);
    expect(error.requestId).toBe('req_789');
    expect(error.abuse_details).toEqual(abuseDetails);
  });
});

describe('InsufficientCreditsError', () => {
  it('should create insufficient credits error with balance info', () => {
    const error = new InsufficientCreditsError({
      message: 'Insufficient credits to complete request',
      current_balance: 0.5,
      estimated_cost: 2.0,
      requestId: 'req_101',
    });

    expect(error.name).toBe('InsufficientCreditsError');
    expect(error.message).toBe('Insufficient credits to complete request');
    expect(error.type).toBe('lockllm_balance_error');
    expect(error.code).toBe('insufficient_credits');
    expect(error.status).toBe(402);
    expect(error.requestId).toBe('req_101');
    expect(error.current_balance).toBe(0.5);
    expect(error.estimated_cost).toBe(2.0);
  });
});

describe('parseError - uncovered cases', () => {
  it('should parse policy violation error from API response', () => {
    const response = {
      error: {
        code: 'policy_violation',
        message: 'Content violates policy',
        type: 'lockllm_policy_error',
        request_id: 'req_policy',
        violated_policies: [
          {
            policy_name: 'Custom Policy',
            violated_categories: [{ name: 'Prohibited Content' }],
          },
        ],
      },
    };

    const error = parseError(response, 'req_fallback');

    expect(error).toBeInstanceOf(PolicyViolationError);
    expect(error.message).toBe('Content violates policy');
    expect(error.requestId).toBe('req_policy');
    expect(error.violated_policies).toEqual(response.error.violated_policies);
  });

  it('should parse abuse detected error from API response', () => {
    const response = {
      error: {
        code: 'abuse_detected',
        message: 'Abusive behavior detected',
        type: 'lockllm_abuse_error',
        request_id: 'req_abuse',
        abuse_details: {
          confidence: 92,
          abuse_types: ['bot_generated'],
          indicators: {
            bot_score: 95,
            repetition_score: 70,
            resource_score: 30,
            pattern_score: 88,
          },
        },
      },
    };

    const error = parseError(response, 'req_fallback');

    expect(error).toBeInstanceOf(AbuseDetectedError);
    expect(error.message).toBe('Abusive behavior detected');
    expect(error.requestId).toBe('req_abuse');
    expect(error.abuse_details).toEqual(response.error.abuse_details);
  });

  it('should parse insufficient credits error from API response', () => {
    const response = {
      error: {
        code: 'insufficient_credits',
        message: 'Not enough credits',
        type: 'lockllm_balance_error',
        request_id: 'req_credits',
        current_balance: 1.5,
        estimated_cost: 5.0,
      },
    };

    const error = parseError(response, 'req_fallback');

    expect(error).toBeInstanceOf(InsufficientCreditsError);
    expect(error.message).toBe('Not enough credits');
    expect(error.requestId).toBe('req_credits');
    expect(error.current_balance).toBe(1.5);
    expect(error.estimated_cost).toBe(5.0);
  });

  it('should handle missing balance fields in insufficient credits error', () => {
    const response = {
      error: {
        code: 'insufficient_credits',
        message: 'Not enough credits',
        type: 'lockllm_balance_error',
      },
    };

    const error = parseError(response);

    expect(error).toBeInstanceOf(InsufficientCreditsError);
    expect(error.current_balance).toBe(0);
    expect(error.estimated_cost).toBe(0);
  });

  it('should use error.request_id when provided for policy violation', () => {
    const response = {
      error: {
        code: 'policy_violation',
        message: 'Policy violated',
        type: 'lockllm_policy_error',
        request_id: 'req_from_error',
        violated_policies: [],
      },
    };

    const error = parseError(response, 'req_fallback');

    expect(error).toBeInstanceOf(PolicyViolationError);
    expect(error.requestId).toBe('req_from_error');
  });

  it('should fallback to requestId parameter when error.request_id missing for policy violation', () => {
    const response = {
      error: {
        code: 'policy_violation',
        message: 'Policy violated',
        type: 'lockllm_policy_error',
        violated_policies: [],
      },
    };

    const error = parseError(response, 'req_fallback_used');

    expect(error).toBeInstanceOf(PolicyViolationError);
    expect(error.requestId).toBe('req_fallback_used');
  });

  it('should use error.request_id when provided for abuse detection', () => {
    const response = {
      error: {
        code: 'abuse_detected',
        message: 'Abuse detected',
        type: 'lockllm_abuse_error',
        request_id: 'req_from_error_abuse',
        abuse_details: {
          confidence: 90,
          abuse_types: ['bot'],
          indicators: {
            bot_score: 90,
            repetition_score: 0,
            resource_score: 0,
            pattern_score: 0,
          },
        },
      },
    };

    const error = parseError(response, 'req_fallback');

    expect(error).toBeInstanceOf(AbuseDetectedError);
    expect(error.requestId).toBe('req_from_error_abuse');
  });

  it('should fallback to requestId parameter when error.request_id missing for abuse detection', () => {
    const response = {
      error: {
        code: 'abuse_detected',
        message: 'Abuse detected',
        type: 'lockllm_abuse_error',
        abuse_details: {
          confidence: 90,
          abuse_types: ['bot'],
          indicators: {
            bot_score: 90,
            repetition_score: 0,
            resource_score: 0,
            pattern_score: 0,
          },
        },
      },
    };

    const error = parseError(response, 'req_fallback_abuse');

    expect(error).toBeInstanceOf(AbuseDetectedError);
    expect(error.requestId).toBe('req_fallback_abuse');
  });
});
