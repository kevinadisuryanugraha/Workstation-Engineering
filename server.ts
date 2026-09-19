import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import crypto from "crypto";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

import { getJwtSecret } from "./server/config/auth.ts";
import { requestCorrelationId } from "./server/middlewares/correlationId.ts";
import { authenticateToken, AuthenticatedRequest } from "./server/middlewares/authenticate.ts";
import { requirePermission, requireRole } from "./server/middlewares/rbac.ts";
import { loginRateLimiter } from "./server/middlewares/rateLimit.ts";
import { buildStaticDemoPreview } from "./server/modules/ai/ai.fallback.ts";
import { aiService } from "./server/modules/ai/ai.service.ts";
import { aiIntelRouter } from "./server/modules/ai/ai-intel.routes.ts";
import helmet from "helmet";
import { buildHelmetOptions } from "./server/config/security.ts";
import { authRouter } from "./server/modules/auth/auth.routes.ts";
import { loginHandler } from "./server/modules/auth/auth.controller.ts";
import { projectRouter } from "./server/modules/projects/project.routes.ts";
import { workItemRouter } from "./server/modules/work-items/work-item.routes.ts";
import { ticketRouter } from "./server/modules/tickets/ticket.routes.ts";
import { gitWebhookRouter } from "./server/modules/git/git.routes.ts";
import { gitEntityRouter } from "./server/modules/git/git-entity.routes.ts";
import { deploymentRouter } from "./server/modules/deployments/deployment.routes.ts";
import { auditRouter } from "./server/modules/audit/audit.routes.ts";
import { myWorkRouter } from "./server/modules/my-work/my-work.routes.ts";
import { userRouter } from "./server/modules/users/users.routes.ts";
import { serverMetricsRouter } from "./server/modules/server-metrics/server-metrics.routes.ts";
import { agentIngestRouter } from "./server/modules/server-metrics/server-metrics.routes.ts";
import { reportsRouter } from "./server/modules/reports/reports.routes.ts";
import { sprintRouter, milestoneRouter } from "./server/modules/sprints/sprint.routes.ts";
import { kbRouter } from "./server/modules/kb/kb.routes.ts";
import { searchRouter } from "./server/modules/search/search.routes.ts";
import { incidentRouter } from "./server/modules/incidents/incident.routes.ts";
import { UserRole, Permission, SERVER_ROLE_PERMISSIONS } from "./server/constants/permissions.ts";

export type { UserRole, Permission, AuthenticatedRequest };
export { authenticateToken, requirePermission, requireRole };

dotenv.config();

// Degraded-mode hardening: a failed DB query must never kill the process.
// Services already log & fall back; this is the last-resort safety net.
process.on("unhandledRejection", (reason) => {
  console.error("[Server] Unhandled rejection (server kept alive):", reason);
});

// Deploy-safe: import.meta.url tidak tersedia di bundle CJS (dist/server.cjs) —
// systemd WorkingDirectory menjamin cwd = root project.
const __dirname = process.cwd();

const app = express();
const PORT = Number(process.env.PORT) || 3000; // konfigurabel untuk deploy (VPS: 3020)

// ===== HTTP Hardening (Story 8.1 — SEC-02, SEC-03, SEC-04) =====
app.disable("x-powered-by"); // Hide framework fingerprint (SEC-03)

// CSP disesuaikan kebutuhan nyata aplikasi (fix manual-check 2026-09-18):
// - Dev (Vite): butuh inline script (React preamble/HMR) + ws:// untuk HMR websocket
// - Prod: script-src ketat 'self' (bundle eksternal, tanpa inline)
// - Google Fonts dipakai index.html (fonts.googleapis.com + fonts.gstatic.com)
app.use(helmet(buildHelmetOptions(process.env.NODE_ENV ?? "development"))); // Standard security headers (SEC-03)

app.use(cors());
app.use(express.json({ limit: "500kb" })); // Tightened from 10mb — DoS resistance (SEC-04)
app.use(requestCorrelationId);

// Brute-force protection on login endpoints only (SEC-02)
app.use("/api/v1/auth/login", loginRateLimiter);
app.use("/api/auth/login", loginRateLimiter);

// Mount modular auth routers (v1 and backward-compatible /api/auth)
app.use("/api/v1/auth", authRouter);
app.post("/api/auth/login", loginHandler);

// Mount domain routes
app.use("/api/v1/projects", projectRouter);
app.use("/api/v1/work-items", workItemRouter);
app.use("/api/v1/tickets", ticketRouter);
app.use("/api/v1/webhooks", gitWebhookRouter);
app.use("/api/v1/git", gitEntityRouter); // Story 18.1 (CC-5): read API git entities — additive, ingest webhook tak tersentuh
app.use("/api/v1/deployments", deploymentRouter);
app.use("/api/v1/audit-logs", auditRouter);
app.use("/api/v1/my-work", myWorkRouter);
app.use("/api/v1/users", authenticateToken, userRouter);
app.use("/api/v1/agent", agentIngestRouter); // agent-token auth, bukan JWT user (Story 9.2)
app.use("/api/v1/server-metrics", authenticateToken, serverMetricsRouter);
app.use("/api/v1/reports", authenticateToken, reportsRouter);
app.use("/api/v1/incidents", authenticateToken, incidentRouter);
app.use("/api/v1/sprints", authenticateToken, sprintRouter);
app.use("/api/v1/milestones", authenticateToken, milestoneRouter);
app.use("/api/v1/kb", authenticateToken, kbRouter);
app.use("/api/v1/search", authenticateToken, searchRouter);
app.use("/api/v1/ai", authenticateToken, aiIntelRouter);

// Public sanitized user directory metadata (profiles without password hashes)
const PUBLIC_USERS = [
  { id: "usr-admin-0", name: "System Security Admin", email: "vibelab.kd@gmail.com", avatar: "SA", role: "Super Admin" as UserRole, team: "Platform Security" },
  { id: "usr-2", name: "Rina Wijaya", email: "rina@workstation.io", avatar: "RW", role: "Tech Lead" as UserRole, team: "Core Engineering" },
  { id: "usr-1", name: "Kevin Santoso", email: "kevin@workstation.io", avatar: "KS", role: "Developer" as UserRole, team: "Web Team" },
  { id: "usr-3", name: "Budi Pratama", email: "budi@workstation.io", avatar: "BP", role: "Project Manager" as UserRole, team: "Product Delivery" },
  { id: "usr-4", name: "Citra Dewi", email: "citra@workstation.io", avatar: "CD", role: "Manager" as UserRole, team: "Operations & Exec" },
  { id: "usr-5", name: "Andi Saputra", email: "andi@workstation.io", avatar: "AS", role: "QA" as UserRole, team: "Quality Assurance" },
  { id: "usr-6", name: "Maya Putri", email: "maya@workstation.io", avatar: "MP", role: "Viewer" as UserRole, team: "Stakeholder Relations" }
];

// Authenticated session introspection
app.get("/api/auth/me", authenticateToken, (req: AuthenticatedRequest, res) => {
  res.json({
    success: true,
    user: {
      id: req.user?.userId,
      name: req.user?.name,
      email: req.user?.email,
      role: req.user?.role
    },
    permissions: req.user?.permissions,
    expiresAt: req.user?.exp ? new Date(req.user.exp * 1000).toISOString() : null,
    status: "AUTHENTICATED_RBAC_ACTIVE"
  });
});

// Logout endpoint (instant token revocation — SEC-01 / Story 8.2)
app.post("/api/auth/logout", authenticateToken, async (req: AuthenticatedRequest, res) => {
  let tokenRevoked = false;
  if (req.user?.userId) {
    const { userService } = await import("./server/modules/users/users.service.ts");
    tokenRevoked = await userService.bumpTokenVersion(req.user.userId, "USER_LOGOUT", req.user.userId);
  }
  res.json({
    success: true,
    message: "Session terminated successfully",
    user: req.user?.email,
    tokenRevoked,
    timestamp: new Date().toISOString()
  });
});

// Organization user directory
app.get("/api/auth/users", authenticateToken, (_req, res) => {
  res.json({ success: true, users: PUBLIC_USERS });
});

// Pre-flight action verification
app.post("/api/auth/verify-action", authenticateToken, (req: AuthenticatedRequest, res) => {
  const { action, permission } = req.body;
  const userPermissions = req.user?.permissions || [];
  const isAllowed = userPermissions.includes(permission);

  res.json({
    allowed: isAllowed,
    user: req.user?.email,
    role: req.user?.role,
    action,
    permission,
    reason: isAllowed
      ? "Authorization granted by active RBAC policy"
      : `Role ${req.user?.role} lacks required permission ${permission}`
  });
});

// ==========================================
// 4. PROTECTED OPERATIONAL ACTIONS (STRICT RBAC)
// ==========================================

// Rollback Deployment (Requires PERM_DEPLOYMENT_ROLLBACK)
app.post(
  "/api/actions/rollback",
  authenticateToken,
  requirePermission("PERM_DEPLOYMENT_ROLLBACK"),
  (req: AuthenticatedRequest, res) => {
    const { deploymentId, targetVersion, server } = req.body;
    res.json({
      success: true,
      action: "DEPLOYMENT_ROLLBACK_AUTHORIZED",
      deploymentId,
      targetVersion,
      server,
      authorizedBy: req.user?.name,
      userRole: req.user?.role,
      auditTimestamp: new Date().toISOString(),
      cryptographicSignature: crypto
        .createHmac("sha256", getJwtSecret())
        .update(`rollback:${deploymentId}:${Date.now()}`)
        .digest("hex")
    });
  }
);

// Declare Incident (Requires PERM_INCIDENT_DECLARE)
app.post(
  "/api/actions/declare-incident",
  authenticateToken,
  requirePermission("PERM_INCIDENT_DECLARE"),
  (req: AuthenticatedRequest, res) => {
    const { title, severity, impact, environment } = req.body;
    res.json({
      success: true,
      action: "INCIDENT_DECLARED_AUTHORIZED",
      incidentCode: `INC-${Math.floor(10000 + Math.random() * 90000)}`,
      title,
      severity,
      impact,
      environment,
      commander: req.user?.name,
      authorizedRole: req.user?.role,
      timestamp: new Date().toISOString()
    });
  }
);

// ==========================================
// 5. AI ENGINE & DEEP SCAN ENDPOINTS
// ==========================================

let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "WORKSTATION Engine API",
    version: "1.0.0",
    rbacSecurity: "ENFORCED_HMAC_SHA256",
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString()
  });
});

// AI Codebase Scanner endpoint (Protected by PERM_AI_SCAN_TRIGGER)
app.post(
  "/api/ai/scan",
  authenticateToken,
  requirePermission("PERM_AI_SCAN_TRIGGER"),
  async (req: AuthenticatedRequest, res) => {
    const { projectName, codeSnippet, focusArea } = req.body;
    const ai = getAIClient();

    if (!ai) {
      // SEC-05 (Story 8.3): fallback is explicitly and honestly labeled as demo data
      const demo = buildStaticDemoPreview();
      // Epic 16 (FR-019): demo scans are persisted too — with honest labeling
      let scanRef: string | undefined;
      try {
        const snapshot = await aiService.persistScan({
          mode: "STATIC_DEMO_PREVIEW",
          model: "heuristic-demo",
          projectName: projectName || null,
          focusArea: focusArea || null,
          findings: demo.findings,
          recommendations: demo.recommendations,
          scannedBy: req.user?.name ?? "unknown",
        });
        scanRef = snapshot.scanRef;
      } catch (persistErr: any) {
        console.warn("[AI Scan] snapshot persist skipped:", persistErr?.message);
      }
      return res.json({
        success: true,
        ...demo,
        ...(scanRef ? { scanRef } : {}),
        scannedBy: req.user?.name,
        role: req.user?.role
      });
    }

    const MODEL_CHAIN = ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3.8-flash", "gemini-3.8-flash"];
    for (const model of MODEL_CHAIN) {
      try {
        const { parsed } = await runScanWithModel(ai, model, { projectName, codeSnippet, focusArea });
        let liveRef: string | undefined;
        try {
          const snapshot = await aiService.persistScan({
            mode: "LIVE_ANALYSIS",
            model,
            projectName: projectName || null,
            focusArea: focusArea || null,
            findings: parsed.findings ?? [],
            recommendations: parsed.recommendations ?? [],
            scannedBy: req.user?.name ?? "unknown",
          });
          liveRef = snapshot.scanRef;
        } catch (persistErr: any) {
          console.warn("[AI Scan] live snapshot persist skipped:", persistErr?.message);
        }
        return res.json({
          success: true,
          mode: "LIVE_ANALYSIS",
          model,
          ...(liveRef ? { scanRef: liveRef } : {}),
          scannedBy: req.user?.name,
          ...parsed
        });
      } catch (err: any) {
        console.warn(`[AI Scan] model ${model} gagal (${err?.status ?? "?"}), mencoba fallback...`);
        await new Promise((r) => setTimeout(r, 1500)); // jeda sebelum retry (503 high-demand biasanya transien)
      }
    }
    // FR-019 AC: kegagalan AI = pesan bersih, bukan crash
    return res.status(503).json({
      success: false,
      error: { code: "AI_UNAVAILABLE", message: "Layanan AI sedang sibuk/tidak tersedia. Coba lagi nanti." },
      timestamp: new Date().toISOString()
    });

    async function runScanWithModel(aiClient: GoogleGenAI, model: string, ctx: { projectName?: string; codeSnippet?: string; focusArea?: string }) {
      const prompt = `You are the AI Codebase Intelligence engine of WORKSTATION.
Analyze the following project code context:
Project: ${projectName || "Enterprise Module"}
Focus Area: ${focusArea || "Full Architecture, Security, Performance"}
Code / Context:
${codeSnippet || "Standard Laravel/TypeScript enterprise backend stack"}

Respond ONLY with valid JSON in this exact structure:
{
  "scanId": "SCAN-${Date.now().toString(36).toUpperCase()}",
  "findings": [
    {
      "id": "FND-001",
      "title": "Short title",
      "category": "Performance|Security|Architecture|Code Quality|Testing|Documentation",
      "severity": "Critical|High|Medium|Low",
      "confidence": 85,
      "affectedFile": "path/to/file.ext:line",
      "evidence": "Concrete code quote or pattern detected",
      "impact": "Business/system risk",
      "suggestedRemediation": "Concrete fix instruction",
      "status": "PENDING"
    }
  ],
  "recommendations": [
    {
      "id": "REC-001",
      "title": "Recommendation action title",
      "reason": "Why this is recommended",
      "expectedImpact": "High/Medium/Low with specific metric impact",
      "effortEstimate": "4-6 hours",
      "affectedModule": "Module name",
      "confidence": 88
    }
  ]
}`;

      const response = await aiClient.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const parsed = JSON.parse(response.text || "{}");
      return { parsed };
    }
  }
);

// Dual Language Translation (Protected by PERM_AI_TRANSLATE)
app.post(
  "/api/ai/translate",
  authenticateToken,
  requirePermission("PERM_AI_TRANSLATE"),
  async (req: AuthenticatedRequest, res) => {
    const { technicalText, context } = req.body;
    const ai = getAIClient();

    if (!ai) {
      return res.json({
        success: true,
        translatedBy: req.user?.name,
        managementSummary: `Pembaruan sistem berhasil diselesaikan pada modul ${context || "Engineering"}. Struktur kode dan alur data dioptimasi untuk mencegah bottleneck, meningkatkan stabilitas layanan, dan memudahkan penambahan fitur berikutnya tanpa downtime.`,
        technicalExplanation: technicalText || "Refactored query execution plan and decoupled authorization middleware."
      });
    }

    try {
      const prompt = `You are WORKSTATION's Dual-Language Translation Engine.
Convert this technical engineering activity into a clear, high-impact Management Explanation in Indonesian (clear, executive-friendly, free of jargon like regex/pointer, focused on business reliability & deliverable progress):
Technical context: ${technicalText}
Context: ${context || "Core system update"}

Output strictly JSON:
{
  "managementSummary": "Indonesian executive explanation",
  "technicalExplanation": "Concise technical architecture explanation"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const parsed = JSON.parse(response.text || "{}");
      res.json({ success: true, translatedBy: req.user?.name, ...parsed });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ==========================================
// 6. SERVER BOOT & VITE INTEGRATION
// ==========================================

async function startServer() {
  // Fail-fast security validation: verify JWT_SECRET is configured properly
  getJwtSecret();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    // HOTFIX 2026-09-19: sw.js & index.html TIDAK boleh di-cache (Cloudflare/
    // browser) — mencegah pengguna terjebak bundle/service worker lama.
    app.use((req, res, next) => {
      if (req.path === "/sw.js" || req.path === "/" || req.path === "/index.html") {
        res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      }
      next();
    });
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`WORKSTATION server running on http://localhost:${PORT}`);
    console.log(`RBAC Middleware: ACTIVE with HMAC-SHA256 Cryptographic Verification`);
  });
}

startServer();
