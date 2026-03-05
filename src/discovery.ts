import type { Hono } from "hono";

/** Register all agent discovery routes on the Hono app */
export function registerDiscoveryRoutes(app: Hono): void {
  // llms.txt — LLM-readable service summary
  app.get("/llms.txt", (c) => {
    return c.text(LLMS_TXT, 200, {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    });
  });

  // A2A Agent Card — Google A2A protocol discovery (v0.3)
  const agentCardHandler = (c: any) =>
    c.json(AGENT_CARD, 200, {
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    });
  app.get("/.well-known/agent-card.json", agentCardHandler);
  app.get("/.well-known/agent.json", agentCardHandler);

  // MCP Server Card — enriched MCP metadata
  app.get("/.well-known/mcp.json", (c) => {
    return c.json(MCP_CARD, 200, {
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    });
app.get("/.well-known/mcp/server-card.json", (c) => {    return c.json(MCP_CARD, 200, {      "Cache-Control": "public, max-age=3600",      "Access-Control-Allow-Origin": "*",    });  });
  });
}

// ── Static Content ────────────────────────────────────────────

const LLMS_TXT = `# Harvey Intel - Agent Intelligence MCP Server

> MCP server for AI agents. Token safety scoring, trading signals, market regime detection, social intelligence.
> Two payment options: x402 USDC micropayments (no account) or API key subscriptions.
> Built by RugSlayer.

## Tools (8 total, 3 free + 5 paid)
- [list_tools](https://agents.rugslayer.com/mcp): List all tools with pricing (FREE)
- [health](https://agents.rugslayer.com/mcp): Server status and payment config (FREE)
- [scan_token_preview](https://agents.rugslayer.com/mcp): Quick risk level check (FREE)
- [scan_token](https://agents.rugslayer.com/mcp): Full DrainBrain ML analysis ($0.01)
- [get_trading_signals](https://agents.rugslayer.com/mcp): CORTEX trading signals ($0.02)
- [get_market_regime](https://agents.rugslayer.com/mcp): Market regime detection ($0.02)
- [get_social_trends](https://agents.rugslayer.com/mcp): Social intelligence ($0.02)
- [get_competitor_intel](https://agents.rugslayer.com/mcp): Competitor tracking ($0.02)

## Connection
- [MCP Endpoint](https://agents.rugslayer.com/mcp): Connect directly via MCP
- [npm](https://www.npmjs.com/package/@meltingpixels/harvey-intel): @meltingpixels/harvey-intel
- [Claude Code](https://agents.rugslayer.com/mcp): claude mcp add harvey-intel --transport http https://agents.rugslayer.com/mcp

## Authentication
- [x402 USDC](https://agents.rugslayer.com/mcp): Pay per call on Solana, no account needed
- [API Key](https://rugslayer.com/drainbrain#keys): Bearer db_live_xxx, free tier 100/day

## Pricing
- scan_token: $0.01 USDC per call
- get_trading_signals: $0.02 USDC per call
- get_market_regime: $0.02 USDC per call
- get_social_trends: $0.02 USDC per call
- get_competitor_intel: $0.02 USDC per call

## Optional
- [DrainBrain Docs](https://rugslayer.com/drainbrain): Full API documentation
- [API Keys](https://rugslayer.com/drainbrain#keys): Generate free API keys
- [Privacy Policy](https://rugslayer.com/privacy): Data handling
`;

const AGENT_CARD = {
  name: "Harvey Intel",
  description:
    "MCP server for AI agents providing Solana token safety scoring (DrainBrain ML), trading signals (CORTEX), market regime detection, and social intelligence (Synthia). Pay per call with USDC or use API keys.",
  version: "1.0.0",
  supportedInterfaces: [
    {
      url: "https://agents.rugslayer.com/mcp",
      protocolBinding: "HTTP+JSON",
      protocolVersion: "0.3",
    },
  ],
  provider: {
    organization: "RugSlayer",
    url: "https://rugslayer.com",
  },
  documentationUrl: "https://rugslayer.com/drainbrain",
  iconUrl: "https://rugslayer.com/icon.svg",
  capabilities: {
    streaming: false,
    pushNotifications: false,
    stateTransitionHistory: false,
  },
  securitySchemes: {
    apiKey: {
      httpSecurityScheme: {
        scheme: "bearer",
        bearerFormat: "DrainBrain API Key (db_live_xxx)",
      },
    },
    x402: {
      httpSecurityScheme: {
        scheme: "x402",
        bearerFormat: "USDC micropayment on Solana",
      },
    },
  },
  defaultInputModes: ["application/json"],
  defaultOutputModes: ["application/json"],
  skills: [
    {
      id: "scan-token",
      name: "Token Safety Scan",
      description:
        "Full DrainBrain ML analysis for a Solana token. 5-model ensemble returns score 0-100, risk level, rug stage, honeypot detection, risk flags, temporal prediction.",
      tags: ["solana", "security", "rug-pull", "ml", "defi"],
      examples: [
        "Is this Solana token safe?",
        "Scan token for rug pull risk",
        "Check if token is a honeypot",
      ],
      inputModes: ["application/json"],
      outputModes: ["application/json"],
    },
    {
      id: "trading-signals",
      name: "CORTEX Trading Signals",
      description:
        "AI-generated trading signals with direction, confidence score, and historical win rate for Solana tokens.",
      tags: ["solana", "trading", "signals", "ai"],
      examples: [
        "Get trading signals for SOL",
        "What direction is the market going?",
      ],
      inputModes: ["application/json"],
      outputModes: ["application/json"],
    },
    {
      id: "market-regime",
      name: "Market Regime Detection",
      description:
        "Detect whether the Solana market is HOT, NORMAL, or COLD based on graduation velocity and on-chain activity.",
      tags: ["solana", "market", "regime", "analysis"],
      examples: [
        "Is the market hot or cold right now?",
        "What's the current market regime?",
      ],
      inputModes: ["application/json"],
      outputModes: ["application/json"],
    },
    {
      id: "social-trends",
      name: "Social Intelligence",
      description:
        "Trending terms, frequency, and sources from Synthia's social media monitoring across crypto communities.",
      tags: ["social", "trends", "intelligence", "crypto"],
      examples: [
        "What's trending in crypto Twitter?",
        "Show social trends for the last 24 hours",
      ],
      inputModes: ["application/json"],
      outputModes: ["application/json"],
    },
    {
      id: "competitor-intel",
      name: "Competitor Tracking",
      description:
        "Track feature launches, pricing changes, and strategic moves from competitors in the Solana ecosystem.",
      tags: ["competitor", "intelligence", "tracking"],
      examples: [
        "What are competitors doing?",
        "Any recent competitor moves?",
      ],
      inputModes: ["application/json"],
      outputModes: ["application/json"],
    },
  ],
};

const MCP_CARD = {
  mcp_version: "2025-11-25",
  name: "harvey-intel",
  display_name: "Harvey Intel - Agent Intelligence MCP Server",
  description:
    "MCP server for AI agents. Token safety scoring via DrainBrain ML, CORTEX trading signals, market regime detection, and Synthia social intelligence. Pay per call with USDC or use API keys.",
  version: "1.0.0",
  vendor: "RugSlayer",
  homepage: "https://rugslayer.com/drainbrain",
  endpoints: {
    streamable_http: "https://agents.rugslayer.com/mcp",
  },
  pricing: {
    model: "freemium",
    free_tools: ["list_tools", "health", "scan_token_preview"],
    paid_tools: {
      scan_token: "$0.01",
      get_trading_signals: "$0.02",
      get_market_regime: "$0.02",
      get_social_trends: "$0.02",
      get_competitor_intel: "$0.02",
    },
    payment_methods: ["x402_usdc_solana", "api_key_bearer"],
    subscription_url: "https://rugslayer.com/pricing",
  },
  rate_limits: {
    free_api_key: "100 calls/day",
    pro_api_key: "10000 calls/min",
    x402: "unlimited (pay per call)",
  },
  tools: [
    {
      name: "list_tools",
      description: "List all available tools with pricing and input requirements.",
      price: "FREE",
      input_schema: { type: "object", properties: {} },
    },
    {
      name: "health",
      description: "Server status, uptime, and payment network configuration.",
      price: "FREE",
      input_schema: { type: "object", properties: {} },
    },
    {
      name: "scan_token_preview",
      description: "Quick risk level (LOW/MEDIUM/HIGH/CRITICAL) for a Solana token. Free preview.",
      price: "FREE",
      input_schema: {
        type: "object",
        required: ["mint"],
        properties: {
          mint: { type: "string", description: "Solana token mint address (base58)" },
        },
      },
    },
    {
      name: "scan_token",
      description:
        "Full DrainBrain ML analysis. 5-model ensemble returns score 0-100, risk level, rug stage (0-5), honeypot detection, risk flags, temporal prediction.",
      price: "$0.01 USDC",
      input_schema: {
        type: "object",
        required: ["mint"],
        properties: {
          mint: { type: "string", description: "Solana token mint address (base58)" },
        },
      },
    },
    {
      name: "get_trading_signals",
      description: "CORTEX trading signals - direction, confidence, win rate for Solana tokens.",
      price: "$0.02 USDC",
      input_schema: {
        type: "object",
        properties: {
          token: { type: "string", description: "Filter by token mint address (optional)" },
        },
      },
    },
    {
      name: "get_market_regime",
      description: "Market regime detection - HOT/NORMAL/COLD with graduation velocity and activity metrics.",
      price: "$0.02 USDC",
      input_schema: { type: "object", properties: {} },
    },
    {
      name: "get_social_trends",
      description: "Trending terms, frequency, and sources from social media monitoring.",
      price: "$0.02 USDC",
      input_schema: {
        type: "object",
        properties: {
          hours: {
            type: "number",
            description: "Lookback period in hours (default: 24, max: 168)",
          },
        },
      },
    },
    {
      name: "get_competitor_intel",
      description: "Competitor tracking - feature launches, pricing changes, strategic moves.",
      price: "$0.02 USDC",
      input_schema: {
        type: "object",
        properties: {
          competitor: { type: "string", description: "Filter by competitor name (partial match)" },
        },
      },
    },
  ],
  install: {
    npm: "npx -y @meltingpixels/harvey-intel",
    claude_code: "claude mcp add harvey-intel --transport http https://agents.rugslayer.com/mcp",
    claude_desktop: {
      command: "npx",
      args: ["-y", "@meltingpixels/harvey-intel"],
      env: { DRAINBRAIN_API_KEY: "your-api-key" },
    },
  },
  categories: ["security", "blockchain", "defi", "trading"],
  tags: ["solana", "rug-pull", "ml", "token-scanner", "trading-signals", "social-intelligence", "x402", "usdc"],
};
