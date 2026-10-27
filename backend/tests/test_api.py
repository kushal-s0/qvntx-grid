import csv
import io
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.data_service import load_cache
from app.analytics import AnalyticsEngine


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as value:
        yield value


def test_full_real_month_and_csv(client):
    assert client.get("/api/health").status_code == 200
    response = client.get("/api/desk")
    assert response.status_code == 200
    d = response.json()
    assert len(d["series"]) == 1488
    assert d["summary"]["coveragePct"] == 100
    assert all(p <= r["decisionCutoffTime"] for r in d["series"] for p in r["sourcePublishTimes"])
    assert all(r["thermal"] >= 0 for r in d["series"])
    export = client.get("/api/export")
    assert export.status_code == 200
    rows = list(csv.DictReader(io.StringIO(export.text)))
    assert len(rows) == 1488
    assert float(rows[0]["thermal"]) == pytest.approx(d["series"][0]["thermal"])
    assert "sourcePublishTimes" in rows[0]


@pytest.mark.parametrize("params", [{"start":"2025-12-31"},{"start":"2026-01-20","end":"2026-01-10"},{"end":"2026-02-01"},{"lead_hours":-1},{"demand":-1},{"confidence":"P99"},{"cutoff_hour":24},{"start":"garbage"},{"demand":"nan"}])
def test_query_validation_is_422(client, params):
    assert client.get("/api/desk", params=params).status_code == 422


@pytest.mark.parametrize("hours", [4,12,24,36,48])
def test_real_lead_horizons_preserve_provenance(client, hours):
    response = client.get("/api/desk", params={"mode":"lead","lead_hours":hours,"start":"2026-01-01","end":"2026-01-01"})
    assert response.status_code == 200
    rows = response.json()["series"]
    assert len(rows) == 48
    assert all(p <= r["decisionCutoffTime"] for r in rows for p in r["sourcePublishTimes"])


def test_missing_cache_is_503(client):
    original = app.state.engine
    try:
        app.state.engine = None
        assert client.get("/api/health").status_code == 503
        assert client.get("/api/desk").status_code == 503
    finally:
        app.state.engine = original


def test_future_january_data_does_not_change_january_first_buffer():
    cache = load_cache()
    from app.models import DeskQuery
    q = DeskQuery(start="2026-01-01",end="2026-01-01")
    original = AnalyticsEngine(cache).dashboard(q)["series"][0]
    cache["actuals"] = [{**r,"generation":0} if r["publishTime"] >= "2026-01-01" else r for r in cache["actuals"]]
    revised = AnalyticsEngine(cache).dashboard(q)["series"][0]
    assert original["buffer"] == revised["buffer"]
    assert original["thermal"] == revised["thermal"]
