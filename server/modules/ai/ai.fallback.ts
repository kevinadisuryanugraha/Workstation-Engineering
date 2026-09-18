/**
 * AI Scanner fallback payload (Story 8.3 — SEC-05 / DS-10).
 *
 * When GEMINI_API_KEY is not configured, /api/ai/scan returns heuristic demo
 * findings. To protect result integrity, the payload is EXPLICITLY labeled
 * `STATIC_DEMO_PREVIEW` so it can never be mistaken for real LLM analysis
 * (`LIVE_ANALYSIS`).
 */

export type AiScanMode = "STATIC_DEMO_PREVIEW" | "LIVE_ANALYSIS";

export interface StaticDemoPreviewPayload {
  mode: AiScanMode;
  scanId: string;
  findings: Array<{
    id: string;
    title: string;
    category: string;
    severity: string;
    confidence: number;
    affectedFile: string;
    evidence: string;
    impact: string;
    suggestedRemediation: string;
    status: string;
  }>;
  recommendations: Array<{
    id: string;
    title: string;
    reason: string;
    expectedImpact: string;
    effortEstimate: string;
    affectedModule: string;
    confidence: number;
  }>;
}

/**
 * Builds the labeled static demo preview payload (pure function — testable).
 */
export function buildStaticDemoPreview(): StaticDemoPreviewPayload {
  return {
    mode: "STATIC_DEMO_PREVIEW",
    scanId: `SCAN-${Date.now().toString(36).toUpperCase()}`,
    findings: [
      {
        id: `FND-${Math.floor(100 + Math.random() * 900)}`,
        title: "Potential N+1 Query in Eloquent Relationship Loading",
        category: "Performance",
        severity: "Medium",
        confidence: 88,
        affectedFile: "app/Http/Controllers/OrderController.php:48",
        evidence: "User::with('orders') query detected inside foreach loop without eager loading batch.",
        impact: "Exponential increase in database queries under load.",
        suggestedRemediation: "Eager load relationships using $orders->load(['items', 'customer']) before iteration.",
        status: "PENDING"
      },
      {
        id: `FND-${Math.floor(100 + Math.random() * 900)}`,
        title: "Unvalidated Server Token in Agent Heartbeat Hook",
        category: "Security",
        severity: "High",
        confidence: 94,
        affectedFile: "app/Services/AgentService.php:112",
        evidence: "Authorization header checked with loose comparison without constant-time hash_equals().",
        impact: "Vulnerability to timing attacks when verifying remote Kontabo agent signatures.",
        suggestedRemediation: "Utilize hash_equals($expectedToken, $providedToken) and enforce HMAC SHA-256 signatures.",
        status: "PENDING"
      },
      {
        id: `FND-${Math.floor(100 + Math.random() * 900)}`,
        title: "Missing Circuit Breaker for External Payment Gateway Webhook",
        category: "Architecture",
        severity: "Low",
        confidence: 82,
        affectedFile: "app/Jobs/ProcessPaymentWebhook.php:34",
        evidence: "Synchronous HTTP call without retry backoff policy or timeout limit.",
        impact: "Worker queue saturation if payment gateway latency spikes.",
        suggestedRemediation: "Wrap in exponential backoff retry job with 5-second connection timeout.",
        status: "PENDING"
      }
    ],
    recommendations: [
      {
        id: `REC-${Math.floor(100 + Math.random() * 900)}`,
        title: "Refactor OrderController batch query and add DB query assertion test",
        reason: "Database I/O represents 65% of API response latency in peak hours.",
        expectedImpact: "Up to 72% reduction in p95 query latency.",
        effortEstimate: "3-4 hours",
        affectedModule: "Orders & Checkout",
        confidence: 90
      }
    ]
  };
}
