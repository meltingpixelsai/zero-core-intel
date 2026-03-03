import { config } from "../config.js";

export interface DrainBrainScanResult {
  score: number;
  riskLevel: string;
  isRug: boolean;
  breakdown?: Record<string, number>;
  honeypot?: {
    isHoneypot: boolean;
    buyTax?: number;
    sellTax?: number;
  };
  temporal?: {
    stage: number;
    stageLabel: string;
    confidence: number;
    pullWithinHours?: number;
  };
  riskFlags?: string[];
  rugStage?: { stage: number; label: string };
}

export interface DrainBrainHealthResult {
  status: string;
  apiVersion?: string;
  modelsAvailable?: number;
}

async function apiRequest<T>(
  path: string,
  method: "GET" | "POST" = "GET",
  body?: Record<string, unknown>
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "harvey-intel/1.0.0",
  };
  if (config.drainbrain.apiKey) {
    headers["Authorization"] = `Bearer ${config.drainbrain.apiKey}`;
  }

  const res = await fetch(`${config.drainbrain.apiUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`DrainBrain API ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

export async function scanToken(mint: string): Promise<DrainBrainScanResult> {
  return apiRequest<DrainBrainScanResult>("/api/drainbrain/v1/scan", "POST", { mint });
}

export async function healthCheck(): Promise<DrainBrainHealthResult> {
  return apiRequest<DrainBrainHealthResult>("/api/drainbrain/v1/health");
}

export function formatRiskLevel(score: number): string {
  if (score >= 80) return "CRITICAL";
  if (score >= 60) return "HIGH";
  if (score >= 40) return "MEDIUM";
  if (score >= 20) return "LOW";
  return "SAFE";
}
