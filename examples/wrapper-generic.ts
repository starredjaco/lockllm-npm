/**
 * Generic Wrapper Example
 *
 * Shows how to use the generic createClient and createOpenAICompatible
 * functions to work with any of the 17 supported providers
 */

import {
  createClient,
  createOpenAICompatible,
  getProxyURL,
  getAllProxyURLs,
} from '@lockllm/sdk';

async function main() {
  const lockllmApiKey = process.env.LOCKLLM_API_KEY;
  if (!lockllmApiKey) {
    throw new Error('LOCKLLM_API_KEY environment variable is required');
  }

  console.log('LockLLM - Generic Wrapper Example\n');

  // ============================================
  // Method 1: Using createOpenAICompatible
  // ============================================
  console.log('Method 1: createOpenAICompatible (for OpenAI-compatible APIs)\n');

  // Most modern LLM providers use OpenAI-compatible APIs
  // You can use this helper for: Groq, DeepSeek, Mistral, Perplexity,
  // OpenRouter, Together AI, xAI, Fireworks, Anyscale, Hugging Face, etc.

  const groq = createOpenAICompatible('groq', {
    apiKey: lockllmApiKey,
  });

  const groqResponse = await groq.chat.completions.create({
    model: 'llama-3.1-70b-versatile',
    messages: [{ role: 'user', content: 'What is 2+2?' }],
  });

  console.log('Groq response:', groqResponse.choices[0].message.content);
  console.log('✓ Groq works!\n');

  // ============================================
  // Method 2: Using createClient with Custom SDK
  // ============================================
  console.log('Method 2: createClient (for providers with custom SDKs)\n');

  // For providers with their own SDK, pass the constructor
  // Example: Cohere
  try {
    const { CohereClient } = require('cohere-ai');

    const cohere = createClient('cohere', CohereClient, {
      apiKey: lockllmApiKey,
    });

    const cohereResponse = await cohere.chat({
      model: 'command-r-plus',
      message: 'What is the capital of France?',
    });

    console.log('Cohere response:', cohereResponse.text);
    console.log('✓ Cohere works!\n');
  } catch (error) {
    console.log(
      '⚠ Cohere SDK not installed. Install with: npm install cohere-ai\n'
    );
  }

  // ============================================
  // Method 3: Using Official SDKs Directly
  // ============================================
  console.log('Method 3: Official SDK + getProxyURL (no wrapper needed)\n');

  // You don't even need our wrappers! Just use the official SDK
  // and change the baseURL using our getProxyURL utility

  const OpenAI = require('openai').default;

  const deepseek = new OpenAI({
    apiKey: lockllmApiKey,
    baseURL: getProxyURL('deepseek'), // <-- This is the only change!
  });

  const deepseekResponse = await deepseek.chat.completions.create({
    model: 'deepseek-chat',
    messages: [{ role: 'user', content: 'What is the meaning of life?' }],
  });

  console.log('DeepSeek response:', deepseekResponse.choices[0].message.content);
  console.log('✓ DeepSeek works!\n');

  // ============================================
  // Utility Functions
  // ============================================
  console.log('\n=== Utility Functions ===\n');

  // Get proxy URL for a specific provider
  console.log('Proxy URL for Mistral:', getProxyURL('mistral'));
  console.log('Proxy URL for Anthropic:', getProxyURL('anthropic'));
  console.log('Proxy URL for Azure:', getProxyURL('azure'));
  console.log();

  // Get all proxy URLs
  const allUrls = getAllProxyURLs();
  console.log('All available proxy URLs:');
  Object.entries(allUrls).forEach(([provider, url]) => {
    console.log(`  ${provider.padEnd(15)} → ${url}`);
  });

  // ============================================
  // Summary
  // ============================================
  console.log('\n=== Summary ===\n');
  console.log('You have 3 ways to use LockLLM with any of the 17 supported providers:');
  console.log('');
  console.log('1. Use provider-specific wrappers (easiest):');
  console.log('   import { createGroq, createMistral } from "lockllm"');
  console.log('');
  console.log('2. Use generic wrappers (flexible):');
  console.log('   import { createOpenAICompatible, createClient } from "lockllm"');
  console.log('');
  console.log('3. Use official SDKs directly (most control):');
  console.log('   import { getProxyURL } from "lockllm"');
  console.log('   new OpenAI({ apiKey, baseURL: getProxyURL("provider") })');
  console.log('');
}

main().catch(console.error);
