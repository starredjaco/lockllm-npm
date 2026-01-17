# Changelog

## [1.0.1] - 2026-01-16

### Changed

#### Flexible SDK Installation
- **Optional Provider SDKs**: Provider SDKs (OpenAI, Anthropic, Cohere, etc.) are no longer required dependencies. Install only what you need:
  - Using OpenAI? Just install `openai` package
  - Using Anthropic? Just install `@anthropic-ai/sdk` package
  - Using Cohere? Just install `cohere-ai` package
  - Mix and match any providers your application uses
- **Smaller Bundle Sizes**: Your application only includes the provider SDKs you actually use, reducing package size and installation time
- **Pay-As-You-Go Dependencies**: No need to install SDKs for providers you don't use

### Benefits
- Faster installation with fewer dependencies
- Smaller `node_modules` folder
- More control over your project dependencies
- No unused packages taking up disk space

### Migration Guide
If you're upgrading from v1.0.0 and using provider wrappers, simply install the provider SDKs you need:

```bash
# For OpenAI (GPT models, DALL-E, etc.)
npm install openai

# For Anthropic (Claude models)
npm install @anthropic-ai/sdk

# For Cohere (Command, Embed models)
npm install cohere-ai

# Install only what you use!
```

The SDK will work out of the box once you install the provider packages you need.

## [1.0.0] - 2026-01-16

### Added

#### Universal Provider Support
- **Generic Wrapper Factory**: Added `createClient()` function to create clients for any of the 17 supported providers using their official SDK
- **OpenAI-Compatible Helper**: Added `createOpenAICompatible()` for easy integration with the OpenAI-compatible providers (Groq, DeepSeek, Mistral, Perplexity, etc.)
- **15 New Provider Wrappers**: Pre-configured factory functions for all remaining providers:
  - `createGroq()` - Groq (fast inference)
  - `createDeepSeek()` - DeepSeek (reasoning models)
  - `createPerplexity()` - Perplexity (online models with search)
  - `createMistral()` - Mistral AI
  - `createOpenRouter()` - OpenRouter (access to 200+ models)
  - `createTogether()` - Together AI
  - `createXAI()` - xAI (Grok)
  - `createFireworks()` - Fireworks AI
  - `createAnyscale()` - Anyscale
  - `createHuggingFace()` - Hugging Face
  - `createGemini()` - Google Gemini
  - `createCohere()` - Cohere
  - `createAzure()` - Azure OpenAI
  - `createBedrock()` - AWS Bedrock
  - `createVertexAI()` - Google Vertex AI

#### Utility Functions
- **`getProxyURL(provider)`**: Get the LockLLM proxy URL for any specific provider
- **`getAllProxyURLs()`**: Get all available proxy URLs for all 17 providers
- **Type Export**: Added `ProviderName` type export for better TypeScript support

#### Examples
- **`examples/wrapper-generic.ts`**: Comprehensive example showing three ways to integrate with any of the 17 supported providers
- **`examples/wrapper-all-providers.ts`**: Complete example demonstrating all 17 providers

#### Documentation
- Updated README with provider comparison table showing wrapper functions and compatibility
- Added three integration methods with examples (provider-specific, generic, official SDKs)
- Expanded "Supported Providers" section with detailed integration patterns
- Added examples for Groq, DeepSeek, Mistral, Perplexity, OpenRouter, and Azure
- Updated API Reference with all new wrapper functions and utilities
- Enhanced examples README with new example descriptions

### Changed
- Build system updated to properly generate both CommonJS (`.js`) and ESM (`.mjs`) outputs
- Fixed `tsconfig.esm.json` to work with TypeScript 5.9.3
- Improved documentation structure and clarity

### Technical Details

#### Integration Methods

**Method 1: Provider-Specific Wrappers (Easiest)**
```typescript
import { createOpenAI, createGroq, createAnthropic } from '@lockllm/sdk';
const client = createGroq({ apiKey: process.env.LOCKLLM_API_KEY });
```

**Method 2: Generic Wrappers (Flexible)**
```typescript
import { createClient, createOpenAICompatible } from '@lockllm/sdk';
// For OpenAI-compatible providers
const client = createOpenAICompatible('deepseek', { apiKey });
// For custom SDKs
const cohere = createClient('cohere', CohereClient, { apiKey });
```

**Method 3: Official SDKs Directly (Most Control)**
```typescript
import OpenAI from 'openai';
import { getProxyURL } from '@lockllm/sdk';
const client = new OpenAI({
  apiKey: process.env.LOCKLLM_API_KEY,
  baseURL: getProxyURL('mistral')
});
```

### Notes
- All 17+ providers are now fully supported with multiple integration options
- Zero breaking changes - existing code continues to work
- Backward compatible with v1.0.0
