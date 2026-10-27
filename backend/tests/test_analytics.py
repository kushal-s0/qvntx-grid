import numpy as np
import pandas as pd
import pytest
from app.analytics import AnalyticsEngine, stats
from app.models import DeskQuery


def observation(t, pub, value):
    return {"startTime": t, "publishTime": pub, "generation": value}


def engine(forecasts, actuals=None):
    actuals = actuals or [observation("2026-01-01T00:00:00Z", "2026-01-01T00:30:00Z", 90)]
    return AnalyticsEngine({"metadata": {}, "actuals": actuals, "forecasts": forecasts})


def test_exact_gate_inclusive_and_future_revision_excluded():
    e = engine([observation("2026-01-01T00:00:00Z", "2025-12-31T10:30:00Z", 100),
                observation("2026-01-01T00:00:00Z", "2025-12-31T11:00:00Z", 120),
                observation("2026-01-01T00:00:00Z", "2025-12-31T11:00:01Z", 900)])
    f, pubs, interpolated = e.forecast_at(pd.Timestamp("2026-01-01T00:00Z"), pd.Timestamp("2025-12-31T11:00Z"))
    assert f == 120
    assert pubs == [pd.Timestamp("2025-12-31T11:00Z")]
    assert not interpolated


def test_half_hour_interpolation_and_both_endpoints_cutoff():
    e = engine([observation("2026-01-01T00:00Z", "2025-12-31T10:30Z", 100),
                observation("2026-01-01T01:00Z", "2025-12-31T10:30Z", 200),
                observation("2026-01-01T01:00Z", "2025-12-31T11:01Z", 800)])
    f, pubs, interpolated = e.forecast_at(pd.Timestamp("2026-01-01T00:30Z"), pd.Timestamp("2025-12-31T11:00Z"))
    assert f == 150 and interpolated
    assert all(p <= pd.Timestamp("2025-12-31T11:00Z") for p in pubs)


@pytest.mark.parametrize("target", ["2025-12-31T23:30Z", "2026-01-01T02:30Z", "2026-01-01T00:30Z"])
def test_no_extrapolation_or_interpolation_across_large_gap(target):
    e = engine([observation("2026-01-01T00:00Z", "2025-12-31T10:30Z", 100), observation("2026-01-01T02:00Z", "2025-12-31T10:30Z", 200)])
    assert e.forecast_at(pd.Timestamp(target), pd.Timestamp("2025-12-31T11:00Z"))[0] is None


def test_interpolation_cannot_use_future_endpoint():
    e = engine([observation("2026-01-01T00:00Z", "2025-12-31T10:30Z", 100), observation("2026-01-01T01:00Z", "2025-12-31T11:01Z", 200)])
    assert e.forecast_at(pd.Timestamp("2026-01-01T00:30Z"), pd.Timestamp("2025-12-31T11:00Z"))[0] is None


def test_midnight_delivery_day_gate_and_lead_are_distinct():
    e = engine([observation("2026-01-01T00:00Z", "2025-12-31T10:30Z", 100)])
    gate = e.policy("gate", 11, 0, 24)
    lead = e.policy("lead", 11, 0, 24)
    assert gate[gate.t == pd.Timestamp("2026-01-01T23:30Z")].iloc[0].cutoff == pd.Timestamp("2025-12-31T11:00Z")
    assert lead[lead.t == pd.Timestamp("2026-01-01T23:30Z")].iloc[0].cutoff == pd.Timestamp("2025-12-31T23:30Z")


def test_statistics_sign_zero_actual_and_positive_tail():
    s = stats([10, -20, 30], [100, 100, 0])
    assert s["mae"] == 20
    assert s["mbe"] == pytest.approx(20/3)
    assert s["rmse"] == pytest.approx(np.sqrt(1400/3))
    assert s["mape"] == 15
    assert s["p90"] == 28 and s["p95"] == 29
    assert s["mapeExcluded"] == 1
    assert stats([-10], [100])["p95"] is None
    assert stats([], [])["mae"] is None


def test_calibration_excludes_future_actual_revision_and_undelivered_period():
    t = "2025-12-30T00:00Z"
    e = engine([observation(t, "2025-12-29T10:30Z", 100)], [observation(t, "2025-12-30T00:30Z", 90), observation(t, "2026-01-02T00:00Z", 1)])
    p = e.policy("gate", 11, 0, 24)
    assert e.calibration(p, pd.Timestamp("2025-12-31T11:00Z")).tolist() == [10]
    assert len(e.calibration(p, pd.Timestamp("2025-12-29T11:00Z"))) == 0


def test_sparse_forecast_and_calibration_yield_null_hedge_retaining_48_periods():
    e = engine([observation("2026-01-01T00:00Z", "2025-12-31T10:30Z", 100)])
    d = e.dashboard(DeskQuery(start="2026-01-01", end="2026-01-01"))
    assert len(d["series"]) == 48
    assert d["series"][0]["error"] == 10
    assert d["series"][0]["buffer"] is None
    assert d["series"][0]["thermal"] is None
    assert d["series"][1]["forecast"] is None
    assert d["summary"]["thermalMean"] is None


def test_horizon_excludes_negative_leads_and_deduplicates_delivery_per_bucket():
    t = "2026-01-01T00:00Z"
    e = engine([observation(t, "2025-12-31T20:00Z", 100), observation(t, "2025-12-31T21:00Z", 110), observation(t, "2026-01-01T01:00Z", 9999)])
    buckets = e.horizon(DeskQuery(start="2026-01-01", end="2026-01-01"))
    assert buckets[0]["samples"] == 1
    assert buckets[0]["mae"] == 20
    assert sum(x["samples"] for x in buckets) == 1


def test_procurement_uses_all_signed_errors_and_clamps_surplus_position():
    times = pd.date_range("2025-12-29", periods=80, freq="30min", tz="UTC")
    forecasts = [observation(str(t), str(t.normalize()-pd.Timedelta(days=1)+pd.Timedelta(hours=10,minutes=30)), 1000+i-40) for i,t in enumerate(times)]
    actuals = [observation(str(t), str(t+pd.Timedelta(minutes=30)), 1000) for t in times]
    forecasts.append(observation("2026-01-01T00:00Z", "2025-12-31T10:30Z", 2000))
    e = engine(forecasts,actuals)
    q = DeskQuery(start="2026-01-01",end="2026-01-01",demand=1000,confidence="P90")
    row = e.dashboard(q)["series"][0]
    assert row["calibrationSamples"] == 80
    assert row["buffer"] == pytest.approx(np.quantile(np.arange(80)-40,.9))
    assert row["thermal"] == 0
    assert e.dashboard(q.model_copy(update={"confidence":"P50"}))["series"][0]["buffer"] == 0
