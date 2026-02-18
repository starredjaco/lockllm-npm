# Changelog

## [1.1.0] - 2026-02-18

### Added

#### Custom Content Policy Enforcement
You can now enforce your own content rules on top of LockLLM's built-in security. Create custom policies in the [dashboard](https://www.lockllm.com/policies), and the SDK will automatically check prompts against them. When a policy is violated, you'll get a `PolicyViolationError` with the exact policy name, violated categories, and details.

```typescript
try {
  await openai.chat.completions.create({ ... });
} catch (error) {
  if (error instanceof PolicyViolationError) {
    console.log(error.violated_policies);
    // [{ policy_name: "No competitor mentions", violated_categories: [...] }]
  }
}
```

#### AI Abuse Detection
Protect your endpoints from automated misuse. When enabled, LockLLM detects bot-generated content, repetitive prompts, and resource exhaustion attacks. If abuse is detected, you'll get an `AbuseDetectedError` with confidence scores and detailed indicator breakdowns.

```typescript
const openai = createOpenAI({
  apiKey: process.env.LOCKLLM_API_KEY,
  proxyOptions: {
    abuseAction: 'block'  // Opt-in: block abusive requests
  }
});
```

#### Credit Balance Awareness
The SDK now returns a dedicated `InsufficientCreditsError` when your balance is too low for a request. The error includes your `current_balance` and the `estimated_cost`, so you can handle billing gracefully in your application.

#### Scan Modes and Actions
Control exactly what gets checked and what happens when threats are found:

- **Scan modes** - Choose `normal` (core security only), `policy_only` (custom policies only), or `combined` (both)
- **Actions per detection type** - Set `block` or `allow_with_warning` independently for core scans, custom policies, and abuse detection
- **Abuse detection** is opt-in - disabled by default, enable it with `abuseAction`

```typescript
const result = await lockllm.scan(
  { input: userPrompt, mode: 'combined', sensitivity: 'high' },
  { scanAction: 'block', policyAction: 'allow_with_warning', abuseAction: 'block' }
);
```

#### Proxy Options on All Wrappers
All wrapper functions (`createOpenAI`, `createAnthropic`, `createGroq`, etc.) now accept a `proxyOptions` parameter so you can configure security behavior at initialization time instead of per-request:

```typescript
const openai = createOpenAI({
  apiKey: process.env.LOCKLLM_API_KEY,
  proxyOptions: {
    scanMode: 'combined',
    scanAction: 'block',
    policyAction: 'block',
    routeAction: 'auto',        // Enable intelligent routing
    cacheResponse: true,         // Enable response caching
    cacheTTL: 3600               // Cache for 1 hour
  }
});
```

#### Intelligent Routing
Let LockLLM automatically select the best model for each request based on task type and complexity. Set `routeAction: 'auto'` to enable, or `routeAction: 'custom'` to use your own routing rules from the dashboard.

#### Response Caching
Reduce costs by caching identical LLM responses. Enabled by default in proxy mode - disable it with `cacheResponse: false` or customize the TTL with `cacheTTL`.

#### Universal Proxy Mode
Access 200+ models without configuring individual provider API keys using `getUniversalProxyURL()`. Uses LockLLM credits instead of BYOK.

```typescript
import { getUniversalProxyURL } from '@lockllm/sdk';
const url = getUniversalProxyURL();
// 'https://api.lockllm.com/v1/proxy/chat/completions'
```

#### Proxy Response Metadata
New utilities to read detailed metadata from proxy responses - scan results, routing decisions, cache status, and credit usage:

```typescript
import { parseProxyMetadata } from '@lockllm/sdk';
const metadata = parseProxyMetadata(response.headers);
// metadata.safe, metadata.routing, metadata.cache_status, metadata.credits_deducted, etc.
```

#### Expanded Scan Response
Scan responses now include richer data when using advanced features:
- `policy_warnings` - Which custom policies were violated and why
- `scan_warning` - Injection details when using `allow_with_warning`
- `abuse_warnings` - Abuse indicators when abuse detection is enabled
- `routing` - Task type, complexity score, and selected model when routing is enabled

### Changed
- The scan API is fully backward compatible - existing code works without changes. Internally, scan configuration is now sent via HTTP headers for better compatibility and caching behavior.

### Notes
- All new features are opt-in. Existing integrations continue to work without any changes.
- Custom policies, abuse detection, and routing are configured in the [LockLLM dashboard](https://www.lockllm.com/dashboard).

---

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
