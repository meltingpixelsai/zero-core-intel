import { config } from "../config.js";

const startTime = Date.now();

export function listTools(): {
  auth_methods: string[];
  tools: Array<{ name: string; description: string; price: string; input: string }>;
} {
  return {
    auth_methods: [
      "x402 USDC micropayments (pay per call, no account needed)",
      "API key (Bearer db_live_xxx) - get keys at rugslayer.com/drainbrain",
    ],
    tools: [
      {
        name: "list_tools",
        description: "List all available tools with pricing",
        price: "FREE",
        input: "(none)",
      },
      {
        name: "health",
        description: "Server status and availability",
        price: "FREE",
        input: "(none)",
      },
      {
        name: "scan_token_preview",
        description: "Quick risk level for a Solana token (LOW/MEDIUM/HIGH/CRITICAL)",
        price: "FREE",
        input: "mint: string",
      },
      {
        name: "scan_token",
        description: "Full DrainBrain risk analysis - score, flags, honeypot, temporal stage",
        price: `$${config.pricing.scan_token} USDC`,
        input: "mint: string",
      },
      {
        name: "get_social_trends",
        description: "Term counts from RugSlayer's own agents' Moltbook posts",
        price: `$${config.pricing.get_social_trends} USDC`,
        input: "hours?: number",
      },
    ],
  };
}

export function health(): {
  status: string;
  uptime_seconds: number;
  version: string;
  payment_network: string;
  payment_currency: string;
} {
  return {
    status: "operational",
    uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
    version: "1.0.0",
    payment_network: config.payment.network,
    payment_currency: config.payment.currency,
  };
}
