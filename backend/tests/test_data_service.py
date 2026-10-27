import asyncio
import json
import httpx
import pytest
from datetime import datetime, timezone, timedelta
from app import data_service as ds


def test_normalize_filters_wind_deduplicates_and_requires_timezone():
    row = {"startTime":"2026-01-01T00:00Z","publishTime":"2026-01-01T00:30Z","generation":100,"fuelType":"WIND"}
    assert len(ds.normalize([row,row,{**row,"fuelType":"GAS"}], fuel=True)) == 1
    with pytest.raises(ValueError):
        ds.normalize([{**row,"startTime":"2026-01-01T00:00"}])


def test_download_retries_then_reuses_chunk(tmp_path, monkeypatch):
    monkeypatch.setattr(ds,"CACHE",tmp_path/"cache.json")
    calls=[]
    def handler(request):
        calls.append(request)
        if len(calls)==1:
            return httpx.Response(503)
        return httpx.Response(200,json=[{"startTime":"2026-01-01T00:00Z","publishTime":"2025-12-31T10:30Z","generation":100}])
    async def no_delay(_):
        return None
    monkeypatch.setattr(ds.asyncio,"sleep",no_delay)
    async def run():
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            day=datetime(2025,12,31,tzinfo=timezone.utc)
            args=("WINDFOR",day,day+timedelta(days=1),client,asyncio.Semaphore(1),False)
            first=await ds.download(*args)
            assert await ds.download(*args)==first
    asyncio.run(run())
    assert len(calls)==2
    assert "publishDateTimeFrom" in calls[0].url.params


def test_checksum_detects_tampered_cache(tmp_path,monkeypatch):
    cache=ds.load_cache()
    cache["actuals"][0]["generation"]+=1
    path=tmp_path/"cache.json"
    path.write_text(json.dumps(cache),encoding="utf-8")
    monkeypatch.setattr(ds,"CACHE",path)
    with pytest.raises(ValueError,match="checksum"):
        ds.load_cache()


def test_incomplete_refresh_preserves_previous_complete_cache(tmp_path,monkeypatch):
    path=tmp_path/"cache.json"
    path.write_text('{"previous":"complete"}',encoding="utf-8")
    monkeypatch.setattr(ds,"CACHE",path)
    async def partial_download(*args):
        return [{"startTime":"2026-01-01T00:00:00Z","publishTime":"2025-12-31T10:30:00Z","generation":100}]
    monkeypatch.setattr(ds,"download",partial_download)
    with pytest.raises(ValueError,match="Refusing to replace cache"):
        asyncio.run(ds.ingest(refresh=True))
    assert json.loads(path.read_text()) == {"previous":"complete"}
