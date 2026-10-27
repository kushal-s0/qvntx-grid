export interface Query {
  start: string;
  end: string;
  mode: "gate" | "lead";
  cutoff_hour: number;
  cutoff_minute: number;
  lead_hours: number;
  demand: number;
  confidence: "P50" | "P90" | "P95";
}
export interface Settlement {
  startTime: string;
  decisionCutoffTime: string;
  publishTime: string | null;
  sourcePublishTimes: string[];
  forecast: number | null;
  actual: number | null;
  error: number | null;
  absErrorPct: number | null;
  buffer: number | null;
  thermal: number | null;
  calibrationSamples: number;
  interpolated: boolean;
  settlementPeriod: number;
}
export interface Metrics {
  mae: number | null;
  rmse: number | null;
  mape: number | null;
  mbe: number | null;
  p90: number | null;
  p95: number | null;
  samples: number;
  positiveSamples: number;
  mapeExcluded: number;
}
export interface Desk {
  metadata: {
    fetchedAt: string;
    source: string;
    actualRecords: number;
    forecastRecords: number;
  };
  query: Query;
  kpis: Metrics;
  summary: {
    periods: number;
    matched: number;
    coveragePct: number;
    forecastMean: number | null;
    actualMean: number | null;
    thermalMean: number | null;
    bufferMean: number | null;
    thermalMWh: number;
    recommendationPeriods: number;
  };
  series: Settlement[];
  histogram: { error: number; count: number }[];
  horizon: (Metrics & { bucket: string })[];
  diurnal: {
    period: number;
    mae: number | null;
    mbe: number | null;
    samples: number;
  }[];
  warnings: string[];
}
const base = (
  (import.meta as unknown as { env: Record<string, string> }).env
    .VITE_API_BASE_URL || ""
).replace(/\/$/, "");
export function apiUrl(path: string, query: Query) {
  return `${base}/api/${path}?${new URLSearchParams(Object.entries(query).map(([k, v]) => [k, String(v)]))}`;
}
export async function fetchDesk(
  query: Query,
  signal: AbortSignal,
): Promise<Desk> {
  const response = await fetch(apiUrl("desk", query), { signal });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      typeof body.detail === "string"
        ? body.detail
        : `Request failed (${response.status}). Check your date range and backend connection.`,
    );
  }
  return response.json();
}
