import { config } from "../config.js";

const startTime = Date.now();

export function listTools(): { tools: Array<{ name: string; description: string; price: string; input: string }> } {
  return {
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
        name: "get_trading_signals",
        description: "CORTEX trading signals - direction, confidence, win rate",
        price: `$${config.pricing.get_trading_signals} USDC`,
        input: "token?: string",
      },
      {
        name: "get_market_regime",
        description: "CORTEX market regime - HOT/NORMAL/COLD with activity metrics",
        price: `$${config.pricing.get_market_regime} USDC`,
        input: "(none)",
      },
      {
        name: "get_social_trends",
        description: "Synthia social intelligence - trending terms and sources",
        price: `$${config.pricing.get_social_trends} USDC`,
        input: "hours?: number",
      },
      {
        name: "get_competitor_intel",
        description: "Synthia competitor tracking - feature launches, pricing changes",
        price: `$${config.pricing.get_competitor_intel} USDC`,
        input: "competitor?: string",
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
