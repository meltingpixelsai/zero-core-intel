import { scanToken as apiScan, formatRiskLevel } from "../lib/drainbrain-client.js";

export async function scanTokenPreview(mint: string): Promise<{
  mint: string;
  risk_level: string;
  message: string;
}> {
  const result = await apiScan(mint);
  const level = formatRiskLevel(result.score);
  return {
    mint,
    risk_level: level,
    message: `Risk level: ${level}. Use scan_token ($0.01) for full score, flags, honeypot analysis, and temporal prediction.`,
  };
}

export async function scanTokenFull(mint: string): Promise<{
  mint: string;
  score: number;
  risk_level: string;
  is_rug: boolean;
  rug_stage?: { stage: number; label: string };
  honeypot?: { is_honeypot: boolean; buy_tax?: number; sell_tax?: number };
  risk_flags: string[];
  breakdown?: Record<string, number>;
  temporal?: {
    stage: number;
    stage_label: string;
    confidence: number;
    pull_within_hours?: number;
  };
}> {
  const result = await apiScan(mint);
  return {
    mint,
    score: result.score,
    risk_level: formatRiskLevel(result.score),
    is_rug: result.isRug,
    rug_stage: result.rugStage,
    honeypot: result.honeypot
      ? {
          is_honeypot: result.honeypot.isHoneypot,
          buy_tax: result.honeypot.buyTax,
          sell_tax: result.honeypot.sellTax,
        }
      : undefined,
    risk_flags: result.riskFlags ?? [],
    breakdown: result.breakdown,
    temporal: result.temporal
      ? {
          stage: result.temporal.stage,
          stage_label: result.temporal.stageLabel,
          confidence: result.temporal.confidence,
          pull_within_hours: result.temporal.pullWithinHours,
        }
      : undefined,
  };
}
