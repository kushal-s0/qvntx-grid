"""Resumable public Elexon ingestion. No synthetic fallback or startup network call."""
from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import logging
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path

import httpx
import pandas as pd
from pydantic import BaseModel, ConfigDict, field_validator

LOG = logging.getLogger(__name__)
BASE = "https://data.elexon.co.uk/bmrs/api/v1/datasets"
CACHE = Path(os.getenv("ELEXON_CACHE_PATH", Path(__file__).resolve().parents[1] / "data/elexon_jan2026_cache.json"))
SCHEMA_VERSION = 1


class Observation(BaseModel):
    model_config = ConfigDict(extra="ignore", allow_inf_nan=False)
    startTime: datetime
    publishTime: datetime
    generation: float

    @field_validator("startTime", "publishTime")
    @classmethod
    def utc_required(cls, value: datetime) -> datetime:
        if value.tzinfo is None:
            raise ValueError("Timezone required")
        return value.astimezone(timezone.utc)


def atomic_json(path: Path, value: dict | list) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(".tmp")
    temporary.write_text(json.dumps(value, separators=(",", ":"), allow_nan=False), encoding="utf-8")
    temporary.replace(path)


def normalize(rows: list[dict], fuel: bool = False) -> list[dict]:
    unique: dict[tuple, dict] = {}
    for row in rows:
        if fuel and row.get("fuelType") != "WIND":
            continue
        item = Observation.model_validate(row).model_dump(mode="json")
        unique[(item["startTime"], item["publishTime"])] = item
    return sorted(unique.values(), key=lambda r: (r["startTime"], r["publishTime"]))


async def download(dataset: str, start: datetime, end: datetime, client: httpx.AsyncClient,
                   semaphore: asyncio.Semaphore, refresh: bool) -> list[dict]:
    path = CACHE.parent / "chunks" / f"{dataset}_{start:%Y%m%d}.json"
    if path.exists() and not refresh:
        return json.loads(path.read_text(encoding="utf-8"))
    params = {"publishDateTimeFrom": start.isoformat(), "publishDateTimeTo": end.isoformat()}
    if dataset == "FUELHH":
        params["fuelType"] = "WIND"
    async with semaphore:
        for attempt in range(5):
            try:
                response = await client.get(f"{BASE}/{dataset}/stream", params=params)
                response.raise_for_status()
                payload = response.json()
                rows = payload if isinstance(payload, list) else payload["data"]
                if not rows:
                    raise ValueError(f"Empty {dataset} publication window {start}")
                result = normalize(rows, fuel=dataset == "FUELHH")
                atomic_json(path, result)
                LOG.info("%s %s: %d records", dataset, start.date(), len(result))
                return result
            except (httpx.HTTPError, ValueError, KeyError):
                if attempt == 4:
                    raise
                await asyncio.sleep(min(2 ** attempt, 16))
    raise RuntimeError("Download attempts exhausted")


async def ingest(refresh: bool = False) -> dict:
    if CACHE.exists() and not refresh:
        return load_cache()
    # December history calibrates buffers; Jan 31's 23:30 actual publishes Feb 1.
    begin = datetime(2025, 12, 1, tzinfo=timezone.utc)
    finish = datetime(2026, 2, 2, tzinfo=timezone.utc)
    semaphore = asyncio.Semaphore(3)
    async with httpx.AsyncClient(timeout=httpx.Timeout(90, connect=20), headers={"Accept": "application/json", "User-Agent": "qvntx-grid/1.0"}) as client:
        jobs = [(dataset, begin + timedelta(days=i)) for dataset in ("FUELHH", "WINDFOR") for i in range((finish-begin).days)]
        parts = await asyncio.gather(*(download(ds, day, day+timedelta(days=1), client, semaphore, refresh) for ds, day in jobs))
    actuals = normalize([r for (ds, _), part in zip(jobs, parts) if ds == "FUELHH" for r in part])
    forecasts = normalize([r for (ds, _), part in zip(jobs, parts) if ds == "WINDFOR" for r in part])
    starts = {pd.Timestamp(r["startTime"]) for r in actuals}
    expected = pd.date_range("2026-01-01", "2026-02-01", freq="30min", inclusive="left", tz="UTC")
    missing = sum(t not in starts for t in expected)
    if missing:
        raise ValueError(f"Refusing to replace cache: {missing}/1488 January wind actuals missing")
    content = {"actuals": actuals, "forecasts": forecasts}
    metadata = {"schemaVersion": SCHEMA_VERSION, "fetchedAt": datetime.now(timezone.utc).isoformat(),
                "source": "Elexon BMRS Insights", "sources": [f"{BASE}/{ds}/stream" for ds in ("FUELHH", "WINDFOR")],
                "publicationFrom": begin.isoformat(), "publicationTo": finish.isoformat(),
                "actualRecords": len(actuals), "forecastRecords": len(forecasts), "januaryActualPeriods": 1488,
                "sha256": hashlib.sha256(json.dumps(content, sort_keys=True).encode()).hexdigest()}
    cache = {"metadata": metadata, **content}
    atomic_json(CACHE, cache)
    return cache


def load_cache() -> dict:
    value = json.loads(CACHE.read_text(encoding="utf-8"))
    if value["metadata"]["schemaVersion"] != SCHEMA_VERSION or not value["actuals"] or not value["forecasts"]:
        raise ValueError("Invalid cache; run python -m app.data_service --refresh")
    digest = hashlib.sha256(json.dumps({k: value[k] for k in ("actuals", "forecasts")}, sort_keys=True).encode()).hexdigest()
    if digest != value["metadata"]["sha256"]:
        raise ValueError("Cache checksum mismatch")
    return value


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--refresh", action="store_true", help="Re-fetch every daily chunk; old complete cache remains intact on failure")
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")
    result = asyncio.run(ingest(args.refresh))
    print(json.dumps(result["metadata"], indent=2))
