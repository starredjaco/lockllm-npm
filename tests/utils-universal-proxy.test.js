/**
 * Tests for getUniversalProxyURL function - targeting uncovered line 45-46
 */

import { describe, it, expect } from 'vitest';
import { getUniversalProxyURL } from '../src/utils';

describe('getUniversalProxyURL', () => {
  it('should return universal proxy URL', () => {
    const url = getUniversalProxyURL();

    expect(url).toBe('https://api.lockllm.com/v1/proxy/chat/completions');
  });

  it('should return consistent URL on multiple calls', () => {
    const url1 = getUniversalProxyURL();
    const url2 = getUniversalProxyURL();

    expect(url1).toBe(url2);
  });

  it('should not include provider in path', () => {
    const url = getUniversalProxyURL();

    expect(url).not.toContain('/openai');
    expect(url).not.toContain('/anthropic');
    expect(url).toContain('/chat/completions');
  });
});
