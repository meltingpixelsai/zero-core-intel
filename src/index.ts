import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { createMcpPaidHandler } from "mcpay/handler";
import { z } from "zod";
import { config } from "./config.js";
import { listTools, health } from "./tools/discovery.js";
import { scanTokenPreview, scanTokenFull } from "./tools/drainbrain.js";
import { getTradingSignals, getMarketRegime } from "./tools/cortex.js";
import { getSocialTrends, getCompetitorIntel } from "./tools/synthia.js";

// ── MCP Handler with x402 Payments ───────────────────────────

const handler = createMcpPaidHandler(
  (server) => {
    // ── Free Tools ──

    server.tool(
      "list_tools",
      "List all available Harvey Intel tools with pricing and input requirements. Use this for discovery.",
      {},
      async () => ({
        content: [{ type: "text", text: JSON.stringify(listTools(), null, 2) }],
      })
    );

    server.tool(
      "health",
      "Check Harvey Intel server status, uptime, and payment network configuration.",
      {},
      async () => ({
        content: [{ type: "text", text: JSON.stringify(health(), null, 2) }],
      })
    );

    server.tool(
      "scan_token_preview",
      "Quick risk level check for a Solana token. Returns LOW/MEDIUM/HIGH/CRITICAL. Free preview - use scan_token for full analysis.",
      { mint: z.string().describe("Solana token mint address (base58)") },
      async ({ mint }) => {
        try {
          const result = await scanTokenPreview(mint);
          return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        } catch (err) {
          return {
            content: [{ type: "text", text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
            isError: true,
          };
        }
      }
    );

    // ── Paid Tools ──

    server.paidTool(
      "scan_token",
      "Full DrainBrain risk analysis for a Solana token using a 5-model AI ensemble. Returns score 0-100, risk level, rug stage, honeypot detection, risk flags, and temporal prediction.",
      "$0.01",
      { mint: z.string().describe("Solana token mint address (base58)") },
      {},
      async ({ mint }) => {
        try {
          const result = await scanTokenFull(mint);
          return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        } catch (err) {
          return {
            content: [{ type: "text", text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
            isError: true,
          };
        }
      }
    );

    server.paidTool(
      "get_trading_signals",
      "CORTEX trading signals - AI-generated direction, confidence score, and win rate for Solana tokens.",
      "$0.02",
      { token: z.string().optional().describe("Filter by specific token mint address") },
      {},
      async ({ token }) => {
        try {
          const result = await getTradingSignals(token);
          return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        } catch (err) {
          return {
            content: [{ type: "text", text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
            isError: true,
          };
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
          const result = await getMarketRegime();
          return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        } catch (err) {
          return {
            content: [{ type: "text", text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
            isError: true,
          };
        }
      }
    );

    server.paidTool(
      "get_social_trends",
      "Synthia social intelligence - trending terms, frequency, and sources from social media monitoring.",
      "$0.02",
      { hours: z.number().min(1).max(168).optional().describe("Lookback period in hours (default: 24, max: 168)") },
      {},
      async ({ hours }) => {
        try {
          const result = await getSocialTrends(hours ?? 24);
          return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        } catch (err) {
          return {
            content: [{ type: "text", text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
            isError: true,
          };
        }
      }
    );

    server.paidTool(
      "get_competitor_intel",
      "Synthia competitor tracking - feature launches, pricing changes, and strategic moves.",
      "$0.02",
      { competitor: z.string().optional().describe("Filter by competitor name (partial match)") },
      {},
      async ({ competitor }) => {
        try {
          const result = await getCompetitorIntel(competitor);
          return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        } catch (err) {
          return {
            content: [{ type: "text", text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
            isError: true,
          };
        }
      }
    );
  },
  // x402 payment config
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
  // Server info
  {
    serverInfo: { name: "harvey-intel", version: "1.0.0" },
  },
  // Handler config
  {
    maxDuration: 300,
    verboseLogs: process.env.NODE_ENV !== "production",
  }
);

// ── Hono HTTP Server ─────────────────────────────────────────

const app = new Hono();

// Health + pricing endpoints (outside MCP, for monitoring/discovery)
app.get("/health", (c) => c.json(health()));
app.get("/pricing", (c) => c.json(listTools()));

// MCP handler catches all other routes
app.all("*", (c) => handler(c.req.raw));

// ── Start ────────────────────────────────────────────────────

serve({ fetch: app.fetch, port: config.port }, () => {
  console.log(`Harvey Intel MCP server running on port ${config.port}`);
  console.log(`  MCP endpoint: http://localhost:${config.port}/`);
  console.log(`  Health: http://localhost:${config.port}/health`);
  console.log(`  Pricing: http://localhost:${config.port}/pricing`);
  console.log(`  Payment wallet: ${config.payment.wallet}`);
  console.log(`  Facilitator: ${config.payment.facilitator}`);
  console.log(`  Network: ${config.payment.network} (${config.payment.currency})`);
});
