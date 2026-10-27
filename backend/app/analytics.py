"""UTC point-in-time joins and auditable, non-parametric wind risk estimates."""
from __future__ import annotations
from bisect import bisect_right
from functools import lru_cache
import numpy as np
import pandas as pd
from .models import DeskQuery


def iso(t) -> str:
    return pd.Timestamp(t).isoformat().replace("+00:00", "Z")


def metric(values) -> float | None:
    v = np.asarray(values, dtype=float)
    v = v[np.isfinite(v)]
    return float(v.mean()) if len(v) else None


def stats(errors, actuals) -> dict:
    e, a = np.asarray(errors, dtype=float), np.asarray(actuals, dtype=float)
    valid = np.isfinite(e) & np.isfinite(a)
    e, a = e[valid], a[valid]
    pos = e[e > 0]
    nonzero = np.abs(a) > 1e-9
    return {"mae": metric(np.abs(e)), "rmse": float(np.sqrt(np.mean(e**2))) if len(e) else None,
            "mape": metric(np.abs(e[nonzero]) / np.abs(a[nonzero]) * 100), "mbe": metric(e),
            "p90": float(np.quantile(pos, .9)) if len(pos) else None,
            "p95": float(np.quantile(pos, .95)) if len(pos) else None,
            "samples": len(e), "positiveSamples": len(pos), "mapeExcluded": int((~nonzero).sum())}


class AnalyticsEngine:
    def __init__(self, cache: dict):
        self.metadata = cache["metadata"]
        self.actual = pd.DataFrame(cache["actuals"])
        self.forecasts = pd.DataFrame(cache["forecasts"])
        for frame in (self.actual, self.forecasts):
            for col in ("startTime", "publishTime"):
                frame[col] = pd.to_datetime(frame[col], utc=True, format="ISO8601")
        self.actual = self.actual.sort_values("publishTime")
        self.actual_latest = self.actual.drop_duplicates("startTime", keep="last").set_index("startTime")
        self.vintages = {}
        for t, g in self.forecasts.groupby("startTime"):
            g = g.sort_values("publishTime")
            self.vintages[t] = (list(g.publishTime), list(g.generation))
        self.times = sorted(self.vintages)

    def latest(self, target, cutoff):
        pair = self.vintages.get(target)
        if pair is None:
            return None
        i = bisect_right(pair[0], cutoff) - 1
        return (float(pair[1][i]), pair[0][i]) if i >= 0 else None

    def forecast_at(self, target, cutoff):
        exact = self.latest(target, cutoff)
        if exact:
            return exact[0], [exact[1]], False
        i = bisect_right(self.times, target)
        if i == 0 or i == len(self.times):
            return None, [], False
        left, right = self.times[i-1], self.times[i]
        if not left < target < right or right-left > pd.Timedelta(hours=1):
            return None, [], False
        a, b = self.latest(left, cutoff), self.latest(right, cutoff)
        if not a or not b:
            return None, [], False
        weight = (target-left)/(right-left)
        return a[0] + weight*(b[0]-a[0]), [a[1], b[1]], True

    @lru_cache(maxsize=24)
    def policy(self, mode: str, hour: int, minute: int, lead: float) -> pd.DataFrame:
        rows = []
        for t in pd.date_range("2025-12-01", "2026-02-01", freq="30min", inclusive="left", tz="UTC"):
            cutoff = t.normalize()-pd.Timedelta(days=1)+pd.Timedelta(hours=hour, minutes=minute) if mode == "gate" else t-pd.Timedelta(hours=lead)
            forecast, publications, interpolated = self.forecast_at(t, cutoff)
            actual = float(self.actual_latest.loc[t, "generation"]) if t in self.actual_latest.index else None
            rows.append({"t": t, "cutoff": cutoff, "forecast": forecast, "actual": actual,
                         "publications": publications, "interpolated": interpolated,
                         "error": forecast-actual if forecast is not None and actual is not None else np.nan})
        return pd.DataFrame(rows)

    def calibration(self, policy: pd.DataFrame, cutoff: pd.Timestamp) -> np.ndarray:
        historical = policy[(policy.t < cutoff) & (policy.t >= cutoff-pd.Timedelta(days=30)) & policy.forecast.notna()]
        # Actual revisions are also matched as-of; later corrections cannot enter a past decision.
        available = self.actual[(self.actual.publishTime <= cutoff) & (self.actual.startTime >= cutoff-pd.Timedelta(days=30))]
        available = available.drop_duplicates("startTime", keep="last")
        joined = historical.merge(available[["startTime", "generation"]], left_on="t", right_on="startTime")
        return (joined.forecast-joined.generation).to_numpy()

    @lru_cache(maxsize=10000)
    def calibration_summary(self, mode: str, hour: int, minute: int, lead: float, cutoff: pd.Timestamp):
        errors = self.calibration(self.policy(mode, hour, minute, lead), cutoff)
        buffers = [max(0., float(v)) for v in np.quantile(errors, [.5, .9, .95])] if len(errors) >= 30 else [None]*3
        return buffers, len(errors)

    def dashboard(self, query: DeskQuery) -> dict:
        policy_key = (query.mode, query.cutoff_hour if query.mode == "gate" else 0,
                      query.cutoff_minute if query.mode == "gate" else 0, query.lead_hours if query.mode == "lead" else 0.)
        policy = self.policy(*policy_key)
        selected = policy[(policy.t >= pd.Timestamp(query.start, tz="UTC")) & (policy.t < pd.Timestamp(query.end, tz="UTC")+pd.Timedelta(days=1))]
        calibration = {}
        series = []
        confidence_index = {"P50": 0, "P90": 1, "P95": 2}[query.confidence]
        for row in selected.itertuples():
            if row.cutoff not in calibration:
                buffers, count = self.calibration_summary(*policy_key, row.cutoff)
                calibration[row.cutoff] = (buffers[confidence_index], count)
            buffer, count = calibration[row.cutoff]
            f = float(row.forecast) if pd.notna(row.forecast) else None
            a = float(row.actual) if pd.notna(row.actual) else None
            error = f-a if f is not None and a is not None else None
            series.append({"startTime": iso(row.t), "decisionCutoffTime": iso(row.cutoff),
                           "publishTime": iso(max(row.publications)) if row.publications else None,
                           "sourcePublishTimes": [iso(p) for p in row.publications], "forecast": f, "actual": a,
                           "error": error, "absErrorPct": abs(error/a)*100 if error is not None and a else None,
                           "buffer": buffer, "thermal": max(0., query.demand-f+buffer) if f is not None and buffer is not None else None,
                           "calibrationSamples": count, "interpolated": row.interpolated, "settlementPeriod": row.t.hour*2+row.t.minute//30+1})
        kpis = stats(selected.error, selected.actual)
        errors = selected.error.dropna().to_numpy()
        counts, edges = np.histogram(errors, bins=24) if len(errors) else ([], [])
        histogram = [{"error": float((edges[i]+edges[i+1])/2), "count": int(c)} for i, c in enumerate(counts)]
        horizon = self.horizon(query)
        profile = selected.assign(period=selected.t.dt.hour*2+selected.t.dt.minute//30+1)
        diurnal = [{"period": int(p), "mbe": metric(g.error), "mae": metric(g.error.abs()), "samples": int(g.error.notna().sum())} for p, g in profile.groupby("period")]
        warnings = []
        missing = len(series)-kpis["samples"]
        if missing:
            warnings.append(f"{missing} settlement periods lack a matched forecast or actual. Gaps are retained; no extrapolation is applied.")
        unavailable = sum(r["thermal"] is None for r in series)
        if unavailable:
            warnings.append(f"{unavailable} periods have no procurement recommendation (forecast missing or fewer than 30 historical calibration samples).")
        warnings.append("Retrospective scenario: demand is simulated. The 11:00 UTC cutoff is the desk policy supplied for this application, not a universal exchange auction deadline.")
        warnings.append("FUELHH covers operationally metered GB wind; embedded wind and other supply are not modeled. Use consistent demand and generation coverage.")
        return {"metadata": self.metadata, "query": query.model_dump(mode="json"), "kpis": kpis, "series": series,
                "histogram": histogram, "horizon": horizon, "diurnal": diurnal, "warnings": warnings,
                "summary": {"periods": len(series), "matched": kpis["samples"], "coveragePct": 100*kpis["samples"]/len(series),
                            "forecastMean": metric([r["forecast"] if r["forecast"] is not None else np.nan for r in series]),
                            "actualMean": metric(selected.actual), "thermalMean": metric([r["thermal"] if r["thermal"] is not None else np.nan for r in series]),
                            "bufferMean": metric([r["buffer"] if r["buffer"] is not None else np.nan for r in series]),
                            "thermalMWh": sum(r["thermal"]*.5 for r in series if r["thermal"] is not None), "recommendationPeriods": len(series)-unavailable}}

    @lru_cache(maxsize=32)
    def _horizon(self, start: str, end: str) -> list[dict]:
        f = self.forecasts[(self.forecasts.startTime >= pd.Timestamp(start, tz="UTC")) & (self.forecasts.startTime < pd.Timestamp(end, tz="UTC")+pd.Timedelta(days=1))].copy()
        f["lead"] = (f.startTime-f.publishTime).dt.total_seconds()/3600
        f = f.merge(self.actual_latest[["generation"]], left_on="startTime", right_index=True, suffixes=("_forecast", "_actual"))
        # Equal weight per delivery timestamp in each bucket, keeping its latest vintage in that bucket.
        result = []
        for lo, hi in [(0, 6), (6, 12), (12, 24), (24, 36), (36, 48), (48, 72)]:
            g = f[(f.lead >= lo) & (f.lead < hi)].sort_values("publishTime").drop_duplicates("startTime", keep="last")
            s = stats(g.generation_forecast-g.generation_actual, g.generation_actual)
            result.append({"bucket": f"{lo}–{hi}h", **s})
        return result

    def horizon(self, query: DeskQuery) -> list[dict]:
        return self._horizon(str(query.start), str(query.end))
