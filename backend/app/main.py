from contextlib import asynccontextmanager
from io import StringIO
import csv
import logging
import os
import time
from typing import Annotated

from fastapi import FastAPI, HTTPException, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .analytics import AnalyticsEngine
from .data_service import load_cache
from .models import DeskQuery, DeskResponse

LOG = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        app.state.engine = AnalyticsEngine(load_cache())
        app.state.data_error = None
    except (OSError, ValueError, KeyError) as exc:
        LOG.exception("Dataset unavailable")
        app.state.engine = None
        app.state.data_error = str(exc)
    yield


app = FastAPI(title="qvntx-grid", version="1.0.0", lifespan=lifespan,
              description="Retrospective GB wind procurement analytics. All timestamps are UTC.")
app.add_middleware(CORSMiddleware, allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:8080").split(","), allow_methods=["GET"], allow_headers=["*"])


@app.middleware("http")
async def headers_and_timing(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Server-Timing"] = f"app;dur={(time.perf_counter()-start)*1000:.1f}"
    return response


@app.exception_handler(Exception)
async def server_error(request: Request, exc: Exception):
    LOG.error("Unhandled request failure", exc_info=exc)
    return JSONResponse(status_code=500, content={"detail": "Analysis failed. Check backend logs."})


def engine() -> AnalyticsEngine:
    value = getattr(app.state, "engine", None)
    if value is None:
        raise HTTPException(503, "Elexon cache unavailable. Run python -m app.data_service in backend and restart.")
    return value


@app.get("/api/health")
def health():
    value = engine()
    return {"status": "ok", "source": value.metadata["source"], "fetchedAt": value.metadata["fetchedAt"]}


@app.get("/api/desk", response_model=DeskResponse)
def desk(query: Annotated[DeskQuery, Query()]):
    return engine().dashboard(query)


@app.get("/api/export")
def export(query: Annotated[DeskQuery, Query()]):
    output = StringIO(newline="")
    rows = engine().dashboard(query)["series"]
    writer = csv.DictWriter(output, fieldnames=list(rows[0]))
    writer.writeheader()
    writer.writerows({**r, "sourcePublishTimes": " | ".join(r["sourcePublishTimes"])} for r in rows)
    return Response(output.getvalue(), media_type="text/csv", headers={"Content-Disposition": f'attachment; filename="qvntx-grid_{query.start}_{query.end}.csv"'})
