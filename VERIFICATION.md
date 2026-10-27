# Verification record

Verified on **27 October 2026** with Python 3.11.5, Node 22.16.0, and Chrome headless on Windows.

## Real source data

The ingestion command successfully requested the public Elexon FUELHH and WINDFOR stream endpoints using publication-time filters. The final cache contains:

| Check | Result |
| --- | --- |
| Publication window | 1 Dec 2025 through 2 Feb 2026 UTC |
| Wind actual records | 3,025 |
| Forecast records, including all vintages | 36,792 |
| January actual half-hours | 1,488 / 1,488 |
| Default D−1 11:00 forecast/actual matches | 1,488 / 1,488 |
| Default recommendation periods | 1,488 / 1,488 |
| Publication cutoff audit | Every source publication <= its decision cutoff |
| Cache SHA-256 | `f9de0e55e41901278dd21b2226428c7fee68aac1ec16099fbd403733fcd61a2a` |

Running ingestion again used the local checksum-validated cache without network access. The cache is approximately 3.77 MB in compact JSON. All values are real observations; no synthetic fallback was generated.

On this development machine, cache loading plus index construction took approximately 0.30 seconds. A cold full-month 48-hour scenario took 2.98 seconds; changing demand with the same calibrated policy took 0.023 seconds. These are local timings, not production latency guarantees.

## Automated checks

- **33 backend tests passed.** Tests exercise domain boundaries, metrics, historical calibration/revisions, nonnegative procurement, signed quantiles, sparse data, API validation, real monthly coverage, CSV parity, all offered lead horizons, retry/resume behavior, checksum validation, and preservation of the previous cache after incomplete refreshes.
- Python application compilation passed with `python -m compileall -q app`.
- Frontend production build passed: TypeScript checking and Vite 7.3.7 bundling, with chart code split into a separate asset and no oversized-bundle warning.
- Docker Compose and Render YAML, Vercel JSON, and referenced local Dockerfile paths were parsed/validated.
- `npm audit` and `pip-audit` reported **no known vulnerabilities** after the dependency updates. This is a point-in-time database check, not a security certification.
- Live local FastAPI health and desk responses returned HTTP 200. Invalid queries return HTTP 422 and missing dataset state returns HTTP 503.

The Python test runner currently emits one upstream Starlette deprecation warning for its HTTPX test-client adapter; tests pass. The runtime ingestion client still uses the requested `httpx` library.

## Browser verification

Chrome exercised the built frontend against the running FastAPI service at **1500 × 1100** and **390 × 844** viewports:

- Both workspace tabs and all charts rendered.
- Forecast series visibility toggled correctly.
- All four weekly presets, full month, and single-day deep-dive updated the ledger.
- A 12-hour policy and the prior-day gate policy updated the analysis.
- A custom 10:30 UTC gate was confirmed in exported decision-cutoff timestamps.
- Demand changes recalculated thermal recommendations; P95 confidence selection worked.
- Single-day CSV download contained 48 data rows plus the header.
- Ledger timestamp search and pagination worked.
- Methodology dialog opened and dismissed with Escape.
- Neither viewport had horizontal page overflow; the ledger itself remains horizontally scrollable.
- No browser runtime exceptions or console errors occurred.

Local screenshots and the browser smoke report are retained under ignored `.preview/`: `desk-desktop.png`, `risk-desktop.png`, `desk-mobile.png`, `risk-mobile.png`, and `browser-results.json`.

### Visual redesign verification

After inspecting the supplied palette screenshot and frames from both videos on the linked Dribbble reference, the frontend was restyled with the five supplied colors, regular-weight editorial typography, a CSS/SVG dimensional wind scene, scroll reveals, and pointer-responsive depth. The reference media was inspected for visual direction and is not shipped in the application.

The redesigned production build passed TypeScript and Vite checks. Chrome repeated the desktop/mobile interaction checks listed above against the real FastAPI service. Additional assertions verified the cobalt theme token, successful self-hosted font loading, animation pause/resume, and disabled animation/visible content under reduced-motion preferences. Additional workspace screenshots are `desk-workspace-desktop.png` and `desk-workspace-mobile.png`. All existing trading interactions continued to pass; no backend code was changed for the visual redesign.

A final responsive pass checked widths of 320, 640, 768, 1024, and 1920 pixels. The headline fits and no page overflow occurs at each width. The pause control stops ambient scene motion while allowing entrance animations to finish. The self-hosted variable WOFF2 font is approximately 25 KB and loads without a runtime request to Google Fonts.

### Dark mode verification

The production build passes with the light/dark navigation toggle. Chrome verified toggling both ways, saved preference after reload, system-theme changes before an explicit choice, session-only operation with blocked browser storage, theme-aware SVG chart colors, dark dialog and input surfaces, and retention of the selected tab/filters while switching modes. The toggle remains visible without page overflow at 320, 390, and 768 pixels. No browser runtime errors were reported. Dark previews are retained at `.preview/dark-desktop.png`, `.preview/dark-workspace.png`, `.preview/dark-risk.png`, and `.preview/dark-mobile.png`.

## Default snapshot statistics

| Metric | Default D−1 11:00 UTC, full January |
| --- | ---: |
| MAE | 2,107.75 MW |
| RMSE | 2,610.54 MW |
| MAPE | 21.94% |
| Mean bias (forecast − actual) | +1,838.94 MW |
| Conditional P90 positive error | 4,589.00 MW |
| Conditional P95 positive error | 5,542.00 MW |
| Positive-error observations | 1,261 |

At simulated 15,000 MW demand with P90 historical calibration, average recommended thermal procurement is 5,878.60 MW. This averages **per-period clipped** recommendations; it cannot be reconstructed by simply subtracting monthly average wind from monthly average demand and adding the average buffer.

The 48-hour scenario has genuine forecast gaps (1,178 matched January half-hours in this snapshot). Missing forecasts remain null and generate a coverage warning; no later forecasts or extrapolations are substituted.

## Verification limits

Docker is not installed in the execution environment, so images were not built and `docker compose up --build` was not executed. The underlying Python service and frontend build were verified directly. Vercel/Render configuration is supplied but has not been deployed to a hosted account, so the live URL placeholders remain blank. No load test, external penetration test, or live trade execution was performed.
