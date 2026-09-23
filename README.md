# Harvey Intel

MCP server for AI agents. Token safety scoring, trading signals, market regime detection, and social intelligence. Two payment options: x402 USDC micropayments or API key subscriptions.

Built by [RugSlayer](https://rugslayer.com).

## Live Endpoint

```
https://agents.rugslayer.com/mcp
```

## Tools

### Free

| Tool | Description |
|------|-------------|
| `list_tools` | List all tools with pricing |
| `health` | Server status and payment config |
| `scan_token_preview` | Quick risk level (LOW/MEDIUM/HIGH/CRITICAL) |

### Paid (USDC on Solana via x402)

| Tool | Price | Description |
|------|-------|-------------|
| `scan_token` | $0.01 | Full DrainBrain ML risk analysis - score, honeypot, rug stage, risk flags, temporal prediction |
| `get_trading_signals` | $0.02 | CORTEX trading signals - direction, confidence, win rate per token |
| `get_market_regime` | $0.02 | Market regime detection - HOT/NORMAL/COLD with velocity metrics |
| `get_social_trends` | $0.02 | Trending terms from social monitoring (tokens, hashtags, names) |
| `get_competitor_intel` | $0.02 | Competitor activity tracking with significance scoring |

## Authentication

Harvey Intel supports two payment methods. Choose whichever fits your workflow:

### Option 1: API Key (recommended for recurring use)

Get a free API key at [rugslayer.com/drainbrain](https://rugslayer.com/drainbrain), then pass it in the `Authorization` header:

```json
{
  "mcpServers": {
    "harvey-intel": {
      "url": "https://agents.rugslayer.com/mcp",
      "headers": {
        "Authorization": "Bearer db_live_your_key_here"
      }
    }
  }
}
```

**Tiers:**
| Tier | Rate Limit | Price |
|------|-----------|-------|
| Free | 100 calls/day | $0 |
| Pro | Unlimited | $199/mo |
| PAYG | Unlimited | $49/mo + usage |

### Option 2: x402 USDC Micropayments (no account needed)

```bash
npx mcpay connect --urls https://agents.rugslayer.com/mcp --svm <SOLANA_SECRET_KEY> --svm-network solana
```

1. Agent calls a paid tool
2. Server responds with `PAYMENT_REQUIRED` + price details
3. MCPay proxy sends USDC payment on Solana
4. Payment verified via [PayAI facilitator](https://facilitator.payai.network)
5. Tool executes and returns data

### Direct MCP (free tools only)

```json
{
  "mcpServers": {
    "harvey-intel": {
      "url": "https://agents.rugslayer.com/mcp"
    }
  }
}
```

### Claude Code

```bash
claude mcp add harvey-intel --transport http https://agents.rugslayer.com/mcp
```

## Registries

- [Official MCP Registry](https://registry.modelcontextprotocol.io) - `io.github.meltingpixelsai/harvey-intel`
- [Smithery](https://smithery.ai/servers/meltingpixelsai/harvey-intel)
- [npm](https://www.npmjs.com/package/@meltingpixels/harvey-intel)

## Data Sources

- **DrainBrain** - ML ensemble trained on 175K+ labeled Solana tokens
- **CORTEX** - Algorithmic trading system (SOL/JUP/RAY)
- **Synthia** - Social intelligence monitoring across X, Telegram, and other platforms

## License

MIT
