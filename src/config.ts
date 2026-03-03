export const config = {
  port: parseInt(process.env.PORT || "8402", 10),

  // DrainBrain API (RugSlayer web on same VPS)
  drainbrain: {
    apiUrl: process.env.DRAINBRAIN_API_URL || "http://localhost:3000",
    apiKey: process.env.DRAINBRAIN_API_KEY || "",
  },

  // Supabase (shared CORTEX + Synthia project)
  supabase: {
    url: process.env.SUPABASE_URL || "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  },

  // x402 payment config
  payment: {
    wallet: process.env.PAYMENT_WALLET || "2MB8Gk4PebwhP6yaiiMjofHYoQvvQ8iWo3hdkUHQ1Wdq",
    facilitator: process.env.X402_FACILITATOR || "https://facilitator.payai.network",
    network: "solana" as const,
    currency: "USDC",
  },

  // Tool pricing (in USD)
  pricing: {
    scan_token: 0.01,
    get_trading_signals: 0.02,
    get_market_regime: 0.02,
    get_social_trends: 0.02,
    get_competitor_intel: 0.02,
  },
} as const;
