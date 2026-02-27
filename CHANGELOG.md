# Changelog

## [1.3.0] - 2026-02-27

### Added

#### Prompt Compression
Reduce token usage and costs by compressing prompts before sending them to AI providers. Three compression methods are available:

- **`toon`** (Free) - Converts JSON data to a compact notation format, achieving 30-60% token savings on structured data. Only activates when the prompt starts with `{` or `[` (pure JSON). Non-JSON input is returned unchanged.
- **`compact`** ($0.0001/use) - Advanced compression that intelligently reduces prompt length while preserving meaning. Works on any text type. Supports configurable compression rate (0.3-0.7, default 0.5).
- **`combined`** ($0.0001/use) - Applies TOON first, then runs Compact on the result for maximum token reduction. For non-JSON input, behaves identically to `compact`. Best when you want maximum compression.

Prompt compression is opt-in and disabled by default. Security scanning always runs on the original text before compression is applied.

**Proxy mode:**
```typescript
// TOON - compress structured JSON prompts (free)
const openai = createOpenAI({
  apiKey: process.env.LOCKLLM_API_KEY,
  proxyOptions: {
    compressionAction: 'toon'
  }
});

// Compact - compress any text with configurable rate
const openai2 = createOpenAI({
  apiKey: process.env.LOCKLLM_API_KEY,
  proxyOptions: {
    compressionAction: 'compact',
    compressionRate: 0.4  // Lower = more aggressive compression (0.3-0.7, default: 0.5)
  }
});

// Combined - TOON then Compact for maximum compression
const openai3 = createOpenAI({
  apiKey: process.env.LOCKLLM_API_KEY,
  proxyOptions: {
    compressionAction: 'combined',
    compressionRate: 0.5
  }
});
```

**Scan API:**
```typescript
const result = await lockllm.scan(
  { input: '{"users": [{"name": "Alice"}, {"name": "Bob"}]}' },
  { compressionAction: 'combined', compressionRate: 0.5 }
);

if (result.compression_result) {
  console.log(result.compression_result.method);            // 'combined'
  console.log(result.compression_result.compressed_input);   // Compressed text
  console.log(result.compression_result.compression_ratio);  // e.g., 0.35
}
```

#### Compression Response Metadata
Proxy responses now include compression metadata in response headers:
- `X-LockLLM-Compression-Method` - Compression method used (`toon`, `compact`, or `combined`)
- `X-LockLLM-Compression-Applied` - Whether compression was applied (`true` or `false`)
- `X-LockLLM-Compression-Ratio` - Ratio of compressed to original length (lower = better)

Parse these with `parseProxyMetadata()`:
```typescript
const metadata = parseProxyMetadata(response.headers);
console.log(metadata.compression);
// { method: 'combined', applied: true, ratio: 0.35 }
```

### Notes
- Prompt compression is opt-in. Existing integrations continue to work without changes.
- All new types (`CompressionAction`, `CompressionResult`) are fully exported for TypeScript users.
- Security scanning always runs on the original (uncompressed) text for maximum protection.
- TOON compression is free. Compact and Combined cost $0.0001 per request.
- Compression results are cached for 30 minutes to avoid redundant processing.

---

## [1.2.0] - 2026-02-21

### Added

#### PII Detection and Redaction
Protect sensitive personal information in prompts before they reach AI providers. When enabled, LockLLM detects emails, phone numbers, SSNs, credit card numbers, and other PII entities. Choose how to handle detected PII with the `piiAction` option:

- **`block`** - Reject requests containing PII entirely. Throws a `PIIDetectedError` with entity types and count.
- **`strip`** - Automatically redact PII from prompts before forwarding to the AI provider. The redacted text is available via `redacted_input` in the scan response.
- **`allow_with_warning`** - Allow requests through but include PII metadata in the response for logging.

PII detection is opt-in and disabled by default.

```typescript
// Block requests containing PII
const openai = createOpenAI({
  apiKey: process.env.LOCKLLM_API_KEY,
  proxyOptions: {
    piiAction: 'strip'  // Automatically redact PII before sending to AI
  }
});

// Handle PII errors when using block mode
try {
  await openai.chat.completions.create({ ... });
} catch (error) {
  if (error instanceof PIIDetectedError) {
    console.log(error.pii_details.entity_types);  // ['email', 'phone_number']
    console.log(error.pii_details.entity_count);   // 3
  }
}
```

#### Scan API PII Support
The scan endpoint now accepts a `piiAction` option alongside existing scan options:

```typescript
const result = await lockllm.scan(
  { input: 'My email is test@example.com' },
  { piiAction: 'block', scanAction: 'block' }
);

if (result.pii_result) {
  console.log(result.pii_result.detected);       // true
  console.log(result.pii_result.entity_types);    // ['email']
  console.log(result.pii_result.entity_count);    // 1
  console.log(result.pii_result.redacted_input);  // 'My email is [EMAIL]' (strip mode only)
}
```

#### Enhanced Proxy Response Metadata
Proxy responses now include additional fields for better observability:

- **PII detection metadata** - `pii_detected` object with detection status, entity types, count, and action taken
- **Blocked status** - `blocked` flag when a request was rejected by security checks
- **Sensitivity and label** - `sensitivity` level used and numeric `label` (0 = safe, 1 = unsafe)
- **Decoded detail fields** - `scan_detail`, `policy_detail`, and `abuse_detail` automatically decoded from base64 response headers
- **Extended routing metadata** - `estimated_original_cost`, `estimated_routed_cost`, `estimated_input_tokens`, `estimated_output_tokens`, and `routing_fee_reason`

#### Sensitivity Header Support
You can now set the detection sensitivity level via `proxyOptions` or `buildLockLLMHeaders`:

```typescript
const openai = createOpenAI({
  apiKey: process.env.LOCKLLM_API_KEY,
  proxyOptions: {
    sensitivity: 'high'  // 'low', 'medium', or 'high'
  }
});
```

### Notes
- PII detection is opt-in. Existing integrations continue to work without changes.
- All new types (`PIIAction`, `PIIResult`, `PIIDetectedError`, `PIIDetectedErrorData`) are fully exported for TypeScript users.

---

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
