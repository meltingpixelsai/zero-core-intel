import {
  getTradingSignals as querySignals,
  getMarketRegime as queryRegime,
  type TradingSignal,
  type MarketRegime,
} from "../lib/supabase-client.js";

export async function getTradingSignals(
  token?: string
): Promise<{ signals: TradingSignal[]; count: number }> {
  const signals = await querySignals(token);
  return { signals, count: signals.length };
}

export async function getMarketRegime(): Promise<MarketRegime> {
  return queryRegime();
}
