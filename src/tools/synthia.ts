import { getSocialTrends as queryTrends, type SocialTrend } from "../lib/supabase-client.js";

export async function getSocialTrends(
  hours: number = 24
): Promise<{ trends: SocialTrend[]; period_hours: number; count: number }> {
  const trends = await queryTrends(hours);
  return { trends, period_hours: hours, count: trends.length };
}
