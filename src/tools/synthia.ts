import {
  getSocialTrends as queryTrends,
  getCompetitorIntel as queryIntel,
  type SocialTrend,
  type CompetitorIntel,
} from "../lib/supabase-client.js";

export async function getSocialTrends(
  hours: number = 24
): Promise<{ trends: SocialTrend[]; period_hours: number; count: number }> {
  const trends = await queryTrends(hours);
  return { trends, period_hours: hours, count: trends.length };
}

export async function getCompetitorIntel(
  competitor?: string
): Promise<{ intel: CompetitorIntel[]; count: number }> {
  const intel = await queryIntel(competitor);
  return { intel, count: intel.length };
}
