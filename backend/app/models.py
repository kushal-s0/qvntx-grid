from datetime import date
from typing import Literal
from pydantic import BaseModel, Field, model_validator


class DeskQuery(BaseModel):
    start: date = date(2026, 1, 1)
    end: date = date(2026, 1, 31)
    mode: Literal["gate", "lead"] = "gate"
    cutoff_hour: int = Field(11, ge=0, le=23)
    cutoff_minute: int = Field(0, ge=0, le=59)
    lead_hours: float = Field(24, ge=0, le=72)
    demand: float = Field(15000, ge=0, le=100000)
    confidence: Literal["P50", "P90", "P95"] = "P90"

    @model_validator(mode="after")
    def january_only(self):
        if not date(2026, 1, 1) <= self.start <= self.end <= date(2026, 1, 31):
            raise ValueError("Choose an ordered range within January 2026")
        return self


class Settlement(BaseModel):
    startTime: str
    decisionCutoffTime: str
    publishTime: str | None
    sourcePublishTimes: list[str]
    forecast: float | None
    actual: float | None
    error: float | None
    absErrorPct: float | None
    buffer: float | None
    thermal: float | None
    calibrationSamples: int
    interpolated: bool
    settlementPeriod: int


class DeskResponse(BaseModel):
    metadata: dict
    query: dict
    summary: dict
    kpis: dict
    series: list[Settlement]
    histogram: list[dict]
    horizon: list[dict]
    diurnal: list[dict]
    warnings: list[str]
