# qvntx-grid

**Live Vercel URL:** 
**YouTube Demo Video URL:** https://youtu.be/gzYD01aZ0vY  

**Deployed URL:** https://qvntx-grid.vercel.app/

**Recorded walkthrough (local files, excluded from Git):** `deliverables/qvntx-grid-walkthrough.mp4` and `deliverables/walkthrough-captions.srt`. Upload the video separately and add its public URL above.

A read-only GB electricity procurement and forecast risk workspace for January 2026. React, FastAPI, and the public Elexon Insights API. Includes a verified real-data cache; no API key or synthetic data is required.

**AI development disclosure:** OpenAI Codex was used to design and implement the application, inspect the public API schema, download the dataset, and run verification. The Sites skill supplied implementation/preview guidance. No AI model is used at runtime or to generate market observations. Forecasts and actuals come from Elexon.

## Run with Docker

Requires Docker Engine/Desktop with Compose v2. From the repository root:

```sh
docker compose up --build
```

- Dashboard: <http://localhost:8080>
- API/OpenAPI: <http://localhost:8000/docs>
- Health: <http://localhost:8000/api/health>

The supplied cache is copied into the backend image. Startup makes **no external requests**. Nginx serves the frontend and proxies `/api` to the backend, so browser requests use one origin. Both containers run as unprivileged users. Stop with `docker compose down`. Backend port 8000 binds only to loopback; put authentication/TLS at your ingress before sharing this decision workspace.

## Run locally

Requires Python 3.11+ and Node.js 22.12+ (or a supported later LTS).

```sh
python -m venv .venv
```

Activate the environment:

```powershell
# Windows PowerShell
.venv\Scripts\Activate.ps1
```

```sh
# macOS / Linux
source .venv/bin/activate
```

Install and start the API from the repository root:

```sh
python -m pip install -r backend/requirements.txt
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

In another terminal:

```sh
cd frontend
npm ci
npm run dev
```

Open <http://127.0.0.1:5173>. Vite proxies `/api` to port 8000. Local development needs no environment variables. `.env.example` documents optional configuration; Vite reads frontend variables from `frontend/.env.local`. All UI dates, times, and settlement periods use UTC regardless of the browser's timezone.

## Rebuild the dataset

From `backend`, with the Python environment active:

```sh
python -m app.data_service
# Explicitly replace daily chunks and the final cache with a fresh API snapshot:
python -m app.data_service --refresh
```

Endpoints:

- [FUELHH stream](https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH/stream): retain only `fuelType=WIND`.
- [WINDFOR stream](https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR/stream): retain every publication vintage.
- [Official API schema](https://data.elexon.co.uk/swagger/v1/swagger.json) and [developer portal](https://developer.data.elexon.co.uk/).

The current schema uses `publishDateTimeFrom` and `publishDateTimeTo` on **both** stream endpoints, rather than `from/to`. Daily publication windows cover **2025-12-01 00:00 through 2026-02-02 00:00 UTC**. December provides historical calibration and Jan 1's prior-day forecasts. The extra February publication window captures Jan 31's final half-hour actual, published after delivery. Delivery dates are filtered separately in analytics.

Requests use bounded concurrency, 90-second timeouts, five attempts with exponential backoff, validated timezone-aware finite observations, and resumable daily chunks under `backend/data/chunks/` (ignored by Git). Boundary duplicates are removed by `(startTime, publishTime)`. The compact normalized cache retains all vintages so changing the cutoff never requires a download. Metadata records source URLs, fetch timestamp, counts, and a SHA-256 checksum. The complete cache is replaced atomically **only after all 1,488 January actuals are present**. Failed refreshes leave the previous full cache intact. `ELEXON_CACHE_PATH` can override its location.

The API loads the cache once per worker and validates its checksum. Missing or invalid data produces a clear HTTP 503; the server does not silently generate example data or make blocking startup downloads. After refreshing the dataset, restart the API to load it. Cached boots require only local file parsing and index construction.

## Workspaces

The interface uses the supplied cobalt/lavender palette (`#3D52A0`, `#7091E6`, `#8697C4`, `#ADBBDA`, `#EDE8F5`) with self-hosted Manrope typography. The editorial hero combines a CSS/SVG wind scene, layered geometric forms, pointer-responsive depth, and subtle ambient motion. Sections reveal as they enter the viewport. Motion can be paused in the hero and automatically respects `prefers-reduced-motion`. All scene artwork is original code; no reference video or third-party design image is embedded in the product. The font's SIL Open Font License is included in `frontend/public/fonts/OFL.txt`.

The sun/moon control in the top navigation switches between light and dark mode on desktop and mobile. It follows the operating system preference until you make an explicit choice, then saves that choice locally across visits. The initial theme is applied before the application renders; charts, tooltips, the wind scene, inputs, and dialogs adapt together. Theme switching also works within the current session when browser storage is blocked.

**Procurement & forecast desk:** date inputs, full-month/week/single-day presets, configurable prior-day UTC cutoff, 4/12/24/36/48-hour lead scenarios, demand simulation, P50/P90/P95 confidence, forecast/outturn/error-band chart with series toggles, and paginated settlement ledger.

**Accuracy & risk lab:** MAE, RMSE, MAPE, signed bias, conditional P90/P95 shortfall, signed-error histogram, forecast lead-bucket accuracy, and the 48-period diurnal profile. Results retain missing values and display coverage. Horizon accuracy is an observed relationship; the chart does not impose an increasing error curve.

CSV export includes all selected periods, independent of pagination or table search, with delivery timestamp, cutoff, selected publication time, both interpolation source publications, forecast, actual, signed error, absolute percentage error, historical buffer, recommended thermal MW, calibration sample count, interpolation flag, and settlement period. For interpolated rows `publishTime` is the later of the two source publications. Hover over the ledger timestamp/publication/buffer cells for provenance.

## Quantitative methodology

For delivery timestamp `t` on day `D`:

```text
Gate policy: cutoff(t) = D − 1 calendar day + configured UTC time (default 11:00)
Lead policy: cutoff(t) = t − lead_hours
Eligible forecast: publishTime <= cutoff(t)
Selected forecast: eligible record with latest publishTime for that startTime
```

The supplied **11:00 UTC gate is a configurable desk decision policy**, not a claim that all UK exchanges/products have this auction deadline. January is UTC/GMT, so there is no daylight-saving ambiguity and each day has 48 periods.

Exact timestamps take priority. If a half-hour has no eligible exact record, use linear interpolation between the neighboring forecast delivery timestamps, at most one hour apart. **Each endpoint independently selects its latest eligible vintage at the same target cutoff.** Both publication times are retained and must satisfy that cutoff. If adjacent delivery points have different publication vintages, the result is explicitly a curve assembled as of the decision, rather than an assertion that one forecast file contained both points. No extrapolation, forward filling, interpolation across gaps longer than one hour, or later publication is allowed. Missing rows remain null; every requested settlement period stays in the output.

Define `e = forecast − actual` in MW:

- **MAE:** mean(`abs(e)`).
- **RMSE:** sqrt(mean(`e²`)).
- **MAPE:** mean(`abs(e / actual) × 100`); zero actuals are excluded and the excluded count is exposed. Near-zero actuals can make this metric unstable.
- **MBE:** mean(`e`). Positive means over-forecast wind and potential balancing deficit; negative means excess day-ahead procurement.
- **P90/P95 shortfall KPI:** empirical quantiles of **strictly positive** errors in the selected analytical window. The positive sample count is shown; an empty positive tail returns null. This is conditional severity and is not a guaranteed reserve requirement.

**Procurement buffer:** for each cutoff, gather signed errors from the preceding 30 days under the same forecast-selection policy. Include only already-delivered periods and actual publications/revisions available **at or before the cutoff**. Choose the latest eligible actual revision per delivery timestamp. At least 30 matched historical observations are required. The buffer is `max(0, quantile(all eligible signed errors, confidence))`. This unconditional quantile differs intentionally from the conditional positive-tail KPIs. Insufficient history yields null buffer and null recommendation. NumPy's default linear empirical quantile estimator is used. P50 can still have a positive buffer when the historical median error is positive.

```text
recommended_thermal_MW(t) = max(0, demand_MW − forecast_MW(t) + historical_buffer_MW(t))
```

Calculate this per period before taking averages, because zero clipping is nonlinear. The overview's thermal card is the mean of available recommendations, and thermal MWh is the sum of `thermal_MW × 0.5 h`. Missing recommendation periods are excluded and their count is exposed. A historical buffer is an empirical scenario estimate; it does not promise future coverage, independent errors, or a particular balancing cost.

**Horizon chart:** group the original hourly WINDFOR records by actual lead `(startTime − publishTime)`, excluding negative leads, into `[0,6)`, `[6,12)`, `[12,24)`, `[24,36)`, `[36,48)`, `[48,72)` hours. Keep the latest vintage per delivery timestamp within each bucket to avoid overweighting timestamps with frequent revisions. Join to actual outturn at matching timestamps. No interpolated points are used in this chart; counts are returned per bucket. Different buckets can contain different delivery samples, so the chart is descriptive rather than a controlled causal experiment.

**Diurnal chart:** average signed error and absolute error per half-hour settlement period across the selected dates. Retrospective accuracy uses the latest actual outturn in the cached snapshot; historical procurement calibration separately uses point-in-time actual revisions.

**Scope:** FUELHH represents operationally metered **Great Britain** generation, not every UK/embedded wind installation. A forecast/outturn coverage mismatch may contribute to bias. The demand slider is a hypothetical portfolio/national scenario and must be made consistent with generation coverage before trading use. Other renewable supply, existing contracted generation, unit availability/ramping, transaction prices, imbalance tariffs, and portfolio constraints are outside this MVP. There are no trade execution endpoints. Authentication, audit retention, live observability, load testing and organizational model validation belong at the production integration boundary.

## Deployment: Vercel frontend + Render backend

This architecture keeps Python/Pandas on Render and deploys Vite assets to Vercel; it does not attempt to run Python in Sites/Cloudflare Workers.

1. Commit the repository, **including** `backend/data/elexon_jan2026_cache.json` and `frontend/package-lock.json`.
2. In Render, create a Blueprint from `render.yaml`, or create a Docker web service using the repository root as build context and `backend/Dockerfile` as the Dockerfile. Render supplies `PORT`; the image respects it. Health check: `/api/health`.
3. Record the backend origin, for example `https://qvntx-grid-api.onrender.com` (replace with the real assigned hostname).
4. Import the repository root into Vercel and select Node.js 22.x in project settings. `vercel.json` installs/builds the frontend and publishes `frontend/dist`.
5. Set the Vercel **build-time** environment variable `VITE_API_BASE_URL` to the Render backend origin **without** `/api`. Redeploy after changing it.
6. Set Render's `CORS_ORIGINS` to the actual Vercel production origin (comma-separated if including preview/local origins, no trailing slash), and restart/redeploy the backend.
7. Open the dashboard and verify an API response, both tabs, and a CSV export. Record the real URL at the top of this document.

`render.yaml` also offers an optional Render static frontend; set its `VITE_API_BASE_URL` the same way and allow its origin in backend CORS. No hosted resources or billable accounts are automatically created by this repository. An immutable cache is included in every backend deployment, avoiding network dependencies at boot; regeneration is a deliberate off-line operation. Protect preview deployments with your hosting provider's access controls.

## Structure

```text
.
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py          # FastAPI lifespan, validation, health, desk, CSV, CORS
│   │   ├── data_service.py  # Retried/resumable ingestion, normalization, atomic cache
│   │   ├── analytics.py     # As-of selection, interpolation, calibration, all metrics
│   │   └── models.py        # Typed requests, settlement rows, response envelope
│   ├── data/
│   │   └── elexon_jan2026_cache.json # Real normalized December/January snapshot
│   ├── tests/
│   │   ├── test_analytics.py    # Cutoff, interpolation, metrics, calibration
│   │   ├── test_api.py          # Real cache integration, horizon, CSV, invalid queries
│   │   └── test_data_service.py # Retry/cache behavior, filtering, checksum
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── main.tsx        # React entry point
│   │   ├── App.tsx         # Two workspaces, filters, simulator, state/error handling
│   │   ├── Hero.tsx        # Animated wind architecture, pointer depth, motion controls
│   │   ├── useTheme.ts     # System preference, saved theme choice, cross-tab synchronization
│   │   ├── theme.css       # Theme tokens and dark surfaces, chart colors, scene styling
│   │   ├── components.tsx  # Recharts, summary cards, ledger, formatting
│   │   ├── api.ts          # API contracts, cancellable fetch, export URL
│   │   └── index.css       # Tailwind import, blue/lavender theme, motion, responsive layouts
│   ├── public/fonts/      # Self-hosted Manrope WOFF2 and its OFL license
│   ├── public/theme-init.js # Apply saved/system theme before rendering
│   ├── index.html
│   ├── vite.config.ts      # React/Tailwind plugins, local API proxy
│   ├── tsconfig.json
│   ├── package.json
│   ├── package-lock.json
│   ├── nginx.conf          # Production static serving and API proxy
│   └── Dockerfile
├── docker-compose.yml
├── vercel.json             # Vercel static deployment from the repository root
├── render.yaml             # Docker API and optional static frontend
├── VERIFICATION.md         # Recorded checks, source counts, and verification limits
├── .env.example
├── .dockerignore
├── .gitignore
└── README.md
```

## Verify

From `backend` in the active Python environment:

```sh
python -m pytest -q
python -m compileall -q app
```

From `frontend`:

```sh
npm run build
```

Tests cover inclusive gate boundaries, future forecast rejection, both interpolation endpoints, large gaps, UTC delivery-day boundaries, signed error/zero actual conventions, actual revision availability, horizon deduplication, missing data, cache checksum/retries, full real-month coverage, CSV parity, all offered lead horizons, and HTTP 422/503 behavior. API docs are generated at `/docs`.

Observed default gate scenario on the included snapshot: 1,488/1,488 matched periods; MAE **2,107.75 MW**, RMSE **2,610.54 MW**, MBE **+1,838.94 MW**. These figures are reproducible snapshot statistics, not a claim about future forecast accuracy. See `VERIFICATION.md` for checks performed in the development environment and their limits.
