import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { config } from "../config.js";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    if (!config.supabase.url || !config.supabase.serviceRoleKey) {
      throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
    }
    client = createClient(config.supabase.url, config.supabase.serviceRoleKey);
  }
  return client;
}

// ── CORTEX queries ──

export interface TradingSignal {
  token: string;
  direction: "long" | "short" | "neutral";
  confidence: number;
  strategy: string;
  recent_trades: number;
  win_rate: number;
  last_trade_at: string;
}

export async function getTradingSignals(token?: string): Promise<TradingSignal[]> {
  const sb = getSupabase();

  // Get recent positions with trade stats
  let query = sb
    .from("cortex_positions")
    .select("token_mint, strategy, entry_price, exit_price, realized_pnl, status, opened_at, closed_at")
    .order("opened_at", { ascending: false })
    .limit(50);

  if (token) {
    query = query.eq("token_mint", token);
  }

  const { data: positions, error } = await query;
  if (error) throw new Error(`CORTEX query failed: ${error.message}`);
  if (!positions || positions.length === 0) return [];

  // Aggregate by token
  const byToken = new Map<string, typeof positions>();
  for (const pos of positions) {
    const key = pos.token_mint;
    if (!byToken.has(key)) byToken.set(key, []);
    byToken.get(key)!.push(pos);
  }

  const signals: TradingSignal[] = [];
  for (const [mint, trades] of byToken) {
    const wins = trades.filter((t) => (t.realized_pnl ?? 0) > 0).length;
    const closed = trades.filter((t) => t.status === "closed").length;
    const lastTrade = trades[0];

    // Determine direction from recent activity
    const recentOpen = trades.filter((t) => t.status === "open");
    const direction = recentOpen.length > 0 ? "long" : "neutral";

    signals.push({
      token: mint,
      direction,
      confidence: closed > 0 ? Math.round((wins / closed) * 100) / 100 : 0,
      strategy: lastTrade.strategy || "unknown",
      recent_trades: trades.length,
      win_rate: closed > 0 ? Math.round((wins / closed) * 100) / 100 : 0,
      last_trade_at: lastTrade.opened_at,
    });
  }

  return signals;
}

export interface MarketRegime {
  regime: "HOT" | "NORMAL" | "COLD";
  graduation_velocity: number;
  active_positions: number;
  recent_trades_24h: number;
  avg_pnl: number;
}

export async function getMarketRegime(): Promise<MarketRegime> {
  const sb = getSupabase();
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [positionsRes, recentRes] = await Promise.all([
    sb.from("cortex_positions").select("status, realized_pnl").eq("status", "open"),
    sb
      .from("cortex_positions")
      .select("realized_pnl, opened_at")
      .gte("opened_at", oneDayAgo),
  ]);

  if (positionsRes.error) throw new Error(`CORTEX query failed: ${positionsRes.error.message}`);
  if (recentRes.error) throw new Error(`CORTEX query failed: ${recentRes.error.message}`);

  const openPositions = positionsRes.data?.length ?? 0;
  const recentTrades = recentRes.data?.length ?? 0;
  const avgPnl =
    recentRes.data && recentRes.data.length > 0
      ? recentRes.data.reduce((sum, t) => sum + (t.realized_pnl ?? 0), 0) / recentRes.data.length
      : 0;

  // Determine regime based on activity
  let regime: "HOT" | "NORMAL" | "COLD";
  if (recentTrades >= 10 && avgPnl > 0) {
    regime = "HOT";
  } else if (recentTrades >= 3) {
    regime = "NORMAL";
  } else {
    regime = "COLD";
  }

  return {
    regime,
    graduation_velocity: recentTrades,
    active_positions: openPositions,
    recent_trades_24h: recentTrades,
    avg_pnl: Math.round(avgPnl * 1000) / 1000,
  };
}

// ── Synthia queries ──

export interface SocialTrend {
  term: string;
  frequency: number;
  sources: string[];
  first_seen: string;
  last_seen: string;
}

export async function getSocialTrends(hours: number = 24): Promise<SocialTrend[]> {
  const sb = getSupabase();
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  // Query content posts and mentions for trend extraction
  const [postsRes, mentionsRes] = await Promise.all([
    sb
      .from("content_posts")
      .select("content, platform, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(100),
    sb
      .from("synthia_mentions")
      .select("content, source, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  // Aggregate terms from content
  const termMap = new Map<string, { count: number; sources: Set<string>; first: string; last: string }>();

  const processText = (text: string, source: string, date: string) => {
    // Extract trending terms (capitalized words, $TICKERS, hashtags)
    const terms = text.match(/(?:\$[A-Z]{2,10}|#\w{3,}|[A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/g) || [];
    for (const term of terms) {
      const normalized = term.toUpperCase();
      const existing = termMap.get(normalized);
      if (existing) {
        existing.count++;
        existing.sources.add(source);
        if (date < existing.first) existing.first = date;
        if (date > existing.last) existing.last = date;
      } else {
        termMap.set(normalized, {
          count: 1,
          sources: new Set([source]),
          first: date,
          last: date,
        });
      }
    }
  };

  for (const post of postsRes.data ?? []) {
    processText(post.content || "", post.platform || "unknown", post.created_at);
  }
  for (const mention of mentionsRes.data ?? []) {
    processText(mention.content || "", mention.source || "unknown", mention.created_at);
  }

  // Sort by frequency, return top 20
  return Array.from(termMap.entries())
    .map(([term, data]) => ({
      term,
      frequency: data.count,
      sources: Array.from(data.sources),
      first_seen: data.first,
      last_seen: data.last,
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 20);
}

export interface CompetitorIntel {
  competitor: string;
  event_type: string;
  summary: string;
  significance: "high" | "medium" | "low";
  detected_at: string;
  source?: string;
}

export async function getCompetitorIntel(competitor?: string): Promise<CompetitorIntel[]> {
  const sb = getSupabase();

  let query = sb
    .from("synthia_competitor_intel")
    .select("competitor_name, intel_type, summary, significance, created_at, source_url")
    .order("created_at", { ascending: false })
    .limit(20);

  if (competitor) {
    query = query.ilike("competitor_name", `%${competitor}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Synthia query failed: ${error.message}`);

  return (data ?? []).map((row) => ({
    competitor: row.competitor_name,
    event_type: row.intel_type,
    summary: row.summary,
    significance: row.significance || "medium",
    detected_at: row.created_at,
    source: row.source_url,
  }));
}
