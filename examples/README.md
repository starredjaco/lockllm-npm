# LockLLM SDK Examples

This directory contains examples demonstrating how to use the LockLLM SDK.

## Prerequisites

1. Get your LockLLM API key from [https://www.lockllm.com/dashboard](https://www.lockllm.com/dashboard)
2. Add your provider API keys (OpenAI, Anthropic, etc.) to the dashboard
3. Set your LockLLM API key in environment variables:
   ```bash
   export LOCKLLM_API_KEY="your_api_key_here"
   ```

## Running Examples

### Install Dependencies

First, install the SDK and peer dependencies:

```bash
npm install @lockllm/sdk openai @anthropic-ai/sdk

# Optional: Install additional provider SDKs
npm install cohere-ai  # For Cohere
npm install @mistralai/mistralai  # For Mistral AI
```

### Run Examples

```bash
# Basic scan API example
npx tsx examples/scan-basic.ts

# OpenAI wrapper example
npx tsx examples/wrapper-openai.ts

# Anthropic wrapper example
npx tsx examples/wrapper-anthropic.ts

# Generic wrapper example (all providers)
npx tsx examples/wrapper-generic.ts

# All providers example
npx tsx examples/wrapper-all-providers.ts

# Error handling example
npx tsx examples/error-handling.ts
```

## Examples

### 1. Basic Scan API (`scan-basic.ts`)

Shows how to use the Scan API to detect prompt injection attacks with different sensitivity levels.

### 2. OpenAI Wrapper (`wrapper-openai.ts`)

Demonstrates how to use the OpenAI SDK with LockLLM protection as a drop-in replacement.

### 3. Anthropic Wrapper (`wrapper-anthropic.ts`)

Demonstrates how to use the Anthropic SDK with LockLLM protection as a drop-in replacement.

### 4. Generic Wrapper (`wrapper-generic.ts`)

Shows three ways to use LockLLM with any of the 17 supported providers:
- Using `createOpenAICompatible()` for OpenAI-compatible APIs
- Using `createClient()` with provider-specific SDKs
- Using official SDKs directly with `getProxyURL()`

### 5. All Providers (`wrapper-all-providers.ts`)

Comprehensive example showing all 17 supported providers:
- OpenAI, Anthropic, Google Gemini, Cohere
- Groq, DeepSeek, Perplexity, Mistral AI
- OpenRouter, Together AI, xAI (Grok), Fireworks AI
- Anyscale, Hugging Face
- Azure OpenAI, AWS Bedrock, Google Vertex AI

### 6. Error Handling (`error-handling.ts`)

Shows how to handle different types of errors that can occur when using the SDK.

## Need Help?

- Documentation: [https://www.lockllm.com/docs](https://www.lockllm.com/docs)
- Dashboard: [https://www.lockllm.com/dashboard](https://www.lockllm.com/dashboard)
- GitHub: [https://github.com/lockllm/lockllm-npm](https://github.com/lockllm/lockllm-npm)
