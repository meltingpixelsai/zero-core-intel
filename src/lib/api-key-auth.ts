import { createHash } from "crypto";
import { getSupabase } from "./supabase-client.js";

export interface ApiKeyAuth {
  keyId: string;
  tier: "free" | "pro" | "payg";
  callsToday: number;
}

const FREE_TIER_DAILY_LIMIT = 100;

function hashApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

/**
 * Validate an API key from the Authorization header.
 * Returns auth info if valid, null if no key present, throws on invalid key.
 */
export async function validateApiKey(
  request: Request
): Promise<ApiKeyAuth | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return null;

  const match = authHeader.match(/^Bearer\s+(db_live_\w+)$/i);
  if (!match) return null; // Not a db_live_ key — fall through to x402

  const rawKey = match[1];
  const keyHash = hashApiKey(rawKey);

  const sb = getSupabase();
  const { data, error } = await sb
    .from("drainbrain_api_keys")
    .select("id, tier, active, calls_today")
    .eq("api_key_hash", keyHash)
    .single();

  if (error || !data) {
    throw new ApiKeyError("Invalid API key", 401);
  }

  if (!data.active) {
    throw new ApiKeyError("API key has been revoked", 401);
  }

  return {
    keyId: data.id,
    tier: data.tier || "free",
    callsToday: data.calls_today || 0,
  };
}

/**
 * Check if the key is within its daily call limit.
 */
export function checkDailyLimit(auth: ApiKeyAuth): boolean {
  if (auth.tier === "pro" || auth.tier === "payg") return true;
  return auth.callsToday < FREE_TIER_DAILY_LIMIT;
}

/**
 * Fire-and-forget usage tracking. Increments calls_today, calls_total, last_used_at.
 */
export function trackUsage(keyId: string, callsToday: number): void {
  const sb = getSupabase();
  const now = new Date().toISOString();

  // Update key counters (fire-and-forget)
  sb.from("drainbrain_api_keys")
    .update({
      calls_today: callsToday + 1,
      last_used_at: now,
    })
    .eq("id", keyId)
    .then(() => {});

  // Increment calls_total via RPC (atomic)
  sb.rpc("increment_drainbrain_calls_total", { key_id: keyId }).then(() => {});
}

/**
 * Custom error for API key auth failures (carries HTTP status code).
 */
export class ApiKeyError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiKeyError";
    this.status = status;
  }
}
