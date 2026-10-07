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

  // RugSlayer's own published posts (content_posts: Moltbook posts by the
  // RugSlayer and RelayZero agents as of 2026-10-07). Until 2026-10-07 this
  // selected columns content_posts doesn't have (content, platform), merged
  // synthia_mentions (empty since 2026-03-03) and ignored the query error, so
  // the tool returned an empty list. A failed query now throws.
  const { data: posts, error } = await sb
    .from("content_posts")
    .select("tweet_text, account, created_at")
    .eq("status", "posted")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(`content_posts query failed: ${error.message}`);

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

  for (const post of posts ?? []) {
    processText(post.tweet_text || "", post.account || "unknown", post.created_at);
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
