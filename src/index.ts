import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { createMcpHandler, createMcpPaidHandler } from "mcpay/handler";
import { z } from "zod";
import { config } from "./config.js";
import { listTools, health } from "./tools/discovery.js";
import { scanTokenPreview, scanTokenFull } from "./tools/drainbrain.js";
import { getTradingSignals, getMarketRegime } from "./tools/cortex.js";
import { getSocialTrends, getCompetitorIntel } from "./tools/synthia.js";
import {
  validateApiKey,
  checkDailyLimit,
  trackUsage,
  ApiKeyError,
} from "./lib/api-key-auth.js";
import { registerDiscoveryRoutes } from "./discovery.js";
import { landingHtml, devHtml } from "./landing.js";

// ── Shared tool callback helpers ─────────────────────────────

function toolResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function toolError(err: unknown) {
  return {
    content: [{ type: "text" as const, text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
    isError: true as const,
  };
}

// ── Tool registration (shared across both handlers) ──────────
// Server param typed as `any` because mcpay bundles its own @modelcontextprotocol/sdk
// version, making its McpServer type incompatible with the top-level one at compile time.
// Both have identical .tool() signatures at runtime.

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Register the 3 free tools (list_tools, health, scan_token_preview) */
function registerFreeTools(server: any): void {
  server.tool(
    "list_tools",
    "List all available Harvey Intel tools with pricing and input requirements. Use this for discovery.",
    {},
    async () => toolResult(listTools())
  );

  server.tool(
    "health",
    "Check Harvey Intel server status, uptime, and payment network configuration.",
    {},
    async () => toolResult(health())
  );

  server.tool(
    "scan_token_preview",
    "Quick risk level check for a Solana token. Returns LOW/MEDIUM/HIGH/CRITICAL. Free preview - use scan_token for full analysis.",
    { mint: z.string().describe("Solana token mint address (base58)") },
    async ({ mint }: { mint: string }) => {
      try {
        return toolResult(await scanTokenPreview(mint));
      } catch (err) {
        return toolError(err);
      }
    }
  );
}

/** Register the 5 premium tools as regular (non-paid) tools */
function registerPremiumTools(server: any): void {
  server.tool(
    "scan_token",
    "Full DrainBrain risk analysis for a Solana token using DrainBrain's ML ensemble. Returns score 0-100, risk level, rug stage, honeypot detection, risk flags, and temporal prediction.",
    { mint: z.string().describe("Solana token mint address (base58)") },
    async ({ mint }: { mint: string }) => {
      try {
        return toolResult(await scanTokenFull(mint));
      } catch (err) {
        return toolError(err);
      }
    }
  );

  server.tool(
    "get_trading_signals",
    "CORTEX trading signals - AI-generated direction, confidence score, and win rate for Solana tokens.",
    { token: z.string().optional().describe("Filter by specific token mint address") },
    async ({ token }: { token?: string }) => {
      try {
        return toolResult(await getTradingSignals(token));
      } catch (err) {
        return toolError(err);
      }
    }
  );

  server.tool(
    "get_market_regime",
    "CORTEX market regime detection - HOT/NORMAL/COLD with graduation velocity and activity metrics.",
    {},
    async () => {
      try {
        return toolResult(await getMarketRegime());
      } catch (err) {
        return toolError(err);
      }
    }
  );

  server.tool(
    "get_social_trends",
    "Synthia social intelligence - trending terms, frequency, and sources from social media monitoring.",
    { hours: z.number().min(1).max(168).optional().describe("Lookback period in hours (default: 24, max: 168)") },
    async ({ hours }: { hours?: number }) => {
      try {
        return toolResult(await getSocialTrends(hours ?? 24));
      } catch (err) {
        return toolError(err);
      }
    }
  );

  server.tool(
    "get_competitor_intel",
    "Synthia competitor tracking - feature launches, pricing changes, and strategic moves.",
    { competitor: z.string().optional().describe("Filter by competitor name (partial match)") },
    async ({ competitor }: { competitor?: string }) => {
      try {
        return toolResult(await getCompetitorIntel(competitor));
      } catch (err) {
        return toolError(err);
      }
    }
  );
}

// ── x402 Paid Handler (existing behavior) ────────────────────

const paidHandler = createMcpPaidHandler(
  (server) => {
    registerFreeTools(server);

    // Paid tools with x402 pricing
    server.paidTool(
      "scan_token",
      "Full DrainBrain risk analysis for a Solana token using DrainBrain's ML ensemble. Returns score 0-100, risk level, rug stage, honeypot detection, risk flags, and temporal prediction.",
      "$0.01",
      { mint: z.string().describe("Solana token mint address (base58)") },
      {},
      async ({ mint }: { mint: string }) => {
        try {
          return toolResult(await scanTokenFull(mint));
        } catch (err) {
          return toolError(err);
        }
      }
    );

    server.paidTool(
      "get_trading_signals",
      "CORTEX trading signals - AI-generated direction, confidence score, and win rate for Solana tokens.",
      "$0.02",
      { token: z.string().optional().describe("Filter by specific token mint address") },
      {},
      async ({ token }: { token?: string }) => {
        try {
          return toolResult(await getTradingSignals(token));
        } catch (err) {
          return toolError(err);
        }
      }
    );

    server.paidTool(
      "get_market_regime",
      "CORTEX market regime detection - HOT/NORMAL/COLD with graduation velocity and activity metrics.",
      "$0.02",
      {},
      {},
      async () => {
        try {
          return toolResult(await getMarketRegime());
        } catch (err) {
          return toolError(err);
        }
      }
    );

    server.paidTool(
      "get_social_trends",
      "Synthia social intelligence - trending terms, frequency, and sources from social media monitoring.",
      "$0.02",
      { hours: z.number().min(1).max(168).optional().describe("Lookback period in hours (default: 24, max: 168)") },
      {},
      async ({ hours }: { hours?: number }) => {
        try {
          return toolResult(await getSocialTrends(hours ?? 24));
        } catch (err) {
          return toolError(err);
        }
      }
    );

    server.paidTool(
      "get_competitor_intel",
      "Synthia competitor tracking - feature launches, pricing changes, and strategic moves.",
      "$0.02",
      { competitor: z.string().optional().describe("Filter by competitor name (partial match)") },
      {},
      async ({ competitor }: { competitor?: string }) => {
        try {
          return toolResult(await getCompetitorIntel(competitor));
        } catch (err) {
          return toolError(err);
        }
      }
    );
  },
  {
    facilitator: {
      url: config.payment.facilitator as `${string}://${string}`,
    },
    recipient: {
      svm: {
        address: config.payment.wallet,
        isTestnet: false,
      },
    },
  },
  {
    serverInfo: { name: "harvey-intel", version: "1.0.0" },
  },
  {
    maxDuration: 300,
    verboseLogs: process.env.NODE_ENV !== "production",
  }
);

// ── API Key Handler (all tools free, auth via db_live_ key) ──

const apiKeyHandler = createMcpHandler(
  (server) => {
    registerFreeTools(server);
    registerPremiumTools(server);
  },
  {
    serverInfo: { name: "harvey-intel", version: "1.0.0" },
  },
  {
    maxDuration: 300,
  }
);

// ── Hono HTTP Server ─────────────────────────────────────────

const app = new Hono();

// Health + pricing endpoints (outside MCP, for monitoring/discovery)
app.get("/health", (c) => c.json(health()));
app.get("/pricing", (c) => c.json(listTools()));

// Agent discovery routes (llms.txt, .well-known/agent-card.json, .well-known/mcp.json)
registerDiscoveryRoutes(app);

// Landing pages for human visitors
app.get("/", (c) => c.html(landingHtml()));
app.get("/dev", (c) => c.html(devHtml()));

// MCP handler with dual auth routing
app.all("*", async (c) => {
  try {
    const auth = await validateApiKey(c.req.raw);

    if (auth) {
      // API key present and valid - check daily limit
      if (!checkDailyLimit(auth)) {
        return c.json(
          { error: "Daily limit exceeded. Free tier: 100 calls/day. Upgrade at rugslayer.com/drainbrain" },
          429
        );
      }

      // Track usage (fire-and-forget)
      trackUsage(auth.keyId, auth.callsToday);

      // Route to standard MCP handler (no payment gate)
      return apiKeyHandler(c.req.raw);
    }

    // No API key - fall through to x402 payment handler
    return paidHandler(c.req.raw);
  } catch (err) {
    if (err instanceof ApiKeyError) {
      return c.json({ error: err.message }, err.status as 401);
    }
    // Unknown error - fall through to x402
    return paidHandler(c.req.raw);
  }
});

// ── Start ────────────────────────────────────────────────────

serve({ fetch: app.fetch, port: config.port }, () => {
  console.log(`Harvey Intel MCP server running on port ${config.port}`);
  console.log(`  MCP endpoint: http://localhost:${config.port}/`);
  console.log(`  Health: http://localhost:${config.port}/health`);
  console.log(`  Pricing: http://localhost:${config.port}/pricing`);
  console.log(`  Auth: x402 USDC + API key (db_live_)`);
  console.log(`  Payment wallet: ${config.payment.wallet}`);
  console.log(`  Facilitator: ${config.payment.facilitator}`);
  console.log(`  Network: ${config.payment.network} (${config.payment.currency})`);
});
