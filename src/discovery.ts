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
  });

  app.get("/.well-known/mcp/server-card.json", (c) => {
    return c.json(MCP_CARD, 200, {
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    });
  });
}
// ── Static Content ────────────────────────────────────────────

const LLMS_TXT = `# Harvey Intel - Agent Intelligence MCP Server

> MCP server for AI agents. DrainBrain token safety scoring, plus term counts from RugSlayer's own agent posts.
> Two payment options: x402 USDC micropayments (no account) or API key subscriptions.
> Built by RugSlayer.

## Tools (5 total, 3 free + 2 paid)
- [list_tools](https://agents.rugslayer.com/mcp): List all tools with pricing (FREE)
- [health](https://agents.rugslayer.com/mcp): Server status and payment config (FREE)
- [scan_token_preview](https://agents.rugslayer.com/mcp): Quick risk level check (FREE)
- [scan_token](https://agents.rugslayer.com/mcp): Full DrainBrain risk analysis ($0.01)
- [get_social_trends](https://agents.rugslayer.com/mcp): Term counts from RugSlayer's own agents' Moltbook posts ($0.02)

## Connection
- [MCP Endpoint](https://agents.rugslayer.com/mcp): Connect directly via MCP
- [npm](https://www.npmjs.com/package/@meltingpixels/harvey-intel): @meltingpixels/harvey-intel
- [Claude Code](https://agents.rugslayer.com/mcp): claude mcp add harvey-intel --transport http https://agents.rugslayer.com/mcp

## Authentication
- [x402 USDC](https://agents.rugslayer.com/mcp): Pay per call on Solana, no account needed
- [API Key](https://rugslayer.com/drainbrain#keys): Bearer db_live_xxx, free tier 100/day

## Pricing
- scan_token: $0.01 USDC per call
- get_social_trends: $0.02 USDC per call

## Optional
- [DrainBrain Docs](https://rugslayer.com/drainbrain): Full API documentation
- [API Keys](https://rugslayer.com/drainbrain#keys): Generate free API keys
- [Privacy Policy](https://rugslayer.com/privacy): Data handling
`;

const AGENT_CARD = {
  name: "Harvey Intel",
  description:
    "MCP server for AI agents providing Solana token safety scoring (DrainBrain), plus term counts from RugSlayer's own Moltbook agent posts. Pay per call with USDC or use API keys.",
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
        "Full DrainBrain analysis for a Solana token: a risk score (0-100) calibrated on the real outcomes of tokens RugSlayer scanned, risk level, rug stage, honeypot detection, risk flags, temporal prediction (beta).",
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
      id: "social-trends",
      name: "Agent Post Terms",
      description:
        "Most frequent capitalized terms, $tickers and hashtags in recent Moltbook posts by RugSlayer's own agents (RugSlayer, RelayZero), with counts, posting accounts and first/last seen. Not a market-wide social feed.",
      tags: ["social", "trends", "moltbook"],
      examples: [
        "Which terms do RugSlayer's agents post about most?",
        "Show term counts for the last 24 hours",
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
    "MCP server for AI agents. Token safety scoring via DrainBrain, plus term counts from RugSlayer's own Moltbook agent posts. Pay per call with USDC or use API keys.",
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
      get_social_trends: "$0.02",
    },
    payment_methods: ["x402_usdc_solana", "api_key_bearer"],
    subscription_url: "https://rugslayer.com/drainbrain",
  },
  rate_limits: {
    free_api_key: "100 calls/day",
    paid_api_key: "monthly allowance (Builder 10,000 / Scale 100,000 scans)",
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
        "Full DrainBrain analysis: a risk score (0-100) calibrated on the real outcomes of tokens RugSlayer scanned, risk level, rug stage (0-5), honeypot detection, risk flags, temporal prediction (beta).",
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
      name: "get_social_trends",
      description: "Most frequent capitalized terms, $tickers and hashtags in recent Moltbook posts by RugSlayer's own agents (RugSlayer, RelayZero), with counts, posting accounts and first/last seen. Not a market-wide social feed.",
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
