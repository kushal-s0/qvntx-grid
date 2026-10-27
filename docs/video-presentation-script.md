Target delivery: approximately 135 spoken words per minute, finishing at 9:30. Replace each contextual [INSERT_METRIC] with the value for the displayed scenario, and replace the event placeholders only with a chart-verified event. Rehearse after inserting spoken numbers. Screen actions and caption summaries are not read aloud.

Accuracy notes: 11:00 UTC is this pilot's configured desk cutoff; BSC Gate Closure has a separate definition ([Elexon](https://www.elexon.co.uk/bsc/glossary/gate-closure/)). Imbalance charges depend on price and position; the pilot has not demonstrated cash savings ([Elexon pricing guidance](https://bscdocs.elexon.co.uk/bsc-module/guidance-notes/imbalance-pricing-guidance/v-15-0/id-639b4af73bed430c2ad79335)). Cloud deployment and universal sub-50 ms latency are not claimed.

# PART 1: Client Pitch to the UK Energy Utility Day-Ahead Trading Desk (0:00–4:45)

**[TIMESTAMP] 0:00–0:30 | The day-ahead procurement problem**

[SCREEN ACTION] Open the portal. Click ‘Explore the trading desk’. Keep ‘Procurement & forecast’ selected. Point to the wind chart and ‘Recommended thermal’ card.

[ON-SCREEN CAPTION SUMMARY]

> VOLATILE WIND.
> A FIXED PROCUREMENT DECISION.

[VOICEOVER SCRIPT]

Every day, your desk has to buy tomorrow’s supplemental electricity before you know how much wind will actually arrive. Buy too little, and a forecast miss becomes an uncovered position. Buy too much, and you carry unnecessary hedge volume. This pilot connects those decisions: the wind forecast available when you committed, the uncertainty around it, and the thermal procurement required for each delivery period.

**[TIMESTAMP] 0:30–0:45 | The pilot decision policy**

[SCREEN ACTION] Point to ‘Decision cutoff’ and the 11:00 ‘Gate time · UTC’ input. Display the caption clarification without reading the footnote aloud.

[ON-SCREEN CAPTION SUMMARY]

> PILOT POLICY: D−1 AT 11:00 UTC
> Configurable desk cutoff; separate from BSC Gate Closure.

[VOICEOVER SCRIPT]

For this pilot, we use eleven UTC on the previous day as the desk’s decision cutoff. That is configurable, rather than a universal exchange deadline. The essential question is what information was available then.

**[TIMESTAMP] 0:45–1:15 | Live walkthrough: select the delivery day**

[SCREEN ACTION] Set start and end dates to 2026-01-01. Choose the day-ahead gate policy and 11:00 UTC. Hover over a chart point, then the first delivery timestamp in ‘Settlement ledger’ to expose its cutoff.

[ON-SCREEN CAPTION SUMMARY]

> DELIVERY: 1 JANUARY 2026
> Eligible publication ≤ 31 DECEMBER, 11:00 UTC

[VOICEOVER SCRIPT]

Let’s select January first and lock the previous day’s eleven UTC cutoff. The forecast curve now represents the latest eligible publications for each delivery timestamp. Updates published after that cutoff cannot influence the recommendation. I can compare that decision-time view with actual generation, then inspect the underlying settlement row. We are evaluating the forecast the trader could have used, rather than a revision published after the decision.

**[TIMESTAMP] 1:15–1:45 | Live walkthrough: size the position**

[SCREEN ACTION] Set ‘Expected demand’ to 15,000 MW. Select P90. Point to ‘Demand’, ‘Wind forecast’, and ‘Historical risk buffer’. Read the first ledger row’s Thermal and Hedge buffer values.

[ON-SCREEN CAPTION SUMMARY]

> THERMAL MW = MAX(0, DEMAND − WIND + BUFFER)
> Settlement-period recommendation: [INSERT_METRIC] MW

[VOICEOVER SCRIPT]

Now I set expected demand to fifteen thousand megawatts and select P90 protection. For each half-hour, the calculator subtracts forecast wind and adds a buffer calibrated from earlier forecast errors. Negative procurement is clipped to zero. For this settlement period, the recommendation is [INSERT_METRIC] megawatts. This gives the trader an explicit scenario position, with demand and risk appetite visible instead of buried inside a spreadsheet.

**[TIMESTAMP] 1:45–2:15 | Live walkthrough: audit and export**

[SCREEN ACTION] Point to ‘Average of per-period recommendations’ below the thermal total. Hover over an interpolated publication’s ‘i’ marker and buffer cell. Click ‘Export CSV’ and briefly open the downloaded ledger.

[ON-SCREEN CAPTION SUMMARY]

> AVERAGE CARD ≠ INDIVIDUAL TRADE VOLUME
> EXPORT EACH PERIOD’S CUTOFF, VINTAGE AND HEDGE

[VOICEOVER SCRIPT]

The headline thermal card averages the individual recommendations; it is not one quantity to buy for every half-hour. The settlement ledger supplies the actual period-level schedule. Hovering reveals publication provenance and the historical sample count behind the buffer. Export carries those details into the review process. Before applying this to a real portfolio, we must also align demand, existing supply, and the coverage of metered wind.

**[TIMESTAMP] 2:15–2:45 | Accuracy and asymmetric trading risk**

[SCREEN ACTION] Choose ‘Full month’, then ‘Accuracy & risk lab’. Hover over MAE, RMSE and Mean bias. Keep the default 11:00 gate policy unchanged so the metrics share one basis.

[ON-SCREEN CAPTION SUMMARY]

> MAE: [INSERT_METRIC] MW · RMSE: [INSERT_METRIC] MW
> MBE: [INSERT_METRIC] MW · ERROR = FORECAST − ACTUAL

[VOICEOVER SCRIPT]

The risk lab separates average accuracy from trading direction. Our monthly MAE is [INSERT_METRIC] megawatts, RMSE is [INSERT_METRIC], and mean bias is [INSERT_METRIC]. MAE describes the typical absolute miss; RMSE gives more weight to large misses. Bias is forecast minus actual. Positive errors mean we expected wind that did not arrive. Negative errors mean the wind component required less supplemental procurement than the forecast implied.

**[TIMESTAMP] 2:45–3:15 | P90 shortfall and the historical buffer**

[SCREEN ACTION] Hover on positive and negative bars in ‘The shape of forecast risk’, then point to ‘P90 shortfall’. Briefly open ‘Methodology’ to show the risk paragraph and close it.

[ON-SCREEN CAPTION SUMMARY]

> P90 SHORTFALL: [INSERT_METRIC] MW
> Monthly conditional severity ≠ historical procurement buffer

[VOICEOVER SCRIPT]

Over-forecasting can expose a short position to adverse imbalance prices; under-forecasting can create excess hedging cost. Monthly P90 shortfall is [INSERT_METRIC] megawatts, measured only among positive errors. The calculator’s P90 buffer serves a different purpose: it uses all signed historical errors available before each decision, with a zero floor. That supports disciplined protection of the position, without promising future coverage or claiming proven cash savings.

**[TIMESTAMP] 3:15–3:45 | Accuracy across forecast horizons**

[SCREEN ACTION] Hover over the 36–48h, 24–36h and 12–24h groups in ‘Accuracy across forecast horizons’. Point to MAE and RMSE, then briefly scroll to ‘Intraday error signature’.

[ON-SCREEN CAPTION SUMMARY]

> COMPARE OBSERVED ERROR BY LEAD TIME
> A fixed daily cutoff spans several delivery horizons.

[VOICEOVER SCRIPT]

Here we compare forecast accuracy across lead-time buckets, starting further out and moving closer to delivery. Read the observed MAE and RMSE rather than assuming improvement is perfectly monotonic. An eleven UTC daily cutoff spans different lead times across tomorrow’s settlement periods, so it is not a single horizon bucket. The intraday profile then shows whether particular delivery hours repeatedly deserve closer attention from the desk.

**[TIMESTAMP] 3:45–4:15 | January pilot findings**

[SCREEN ACTION] Keep Full month selected while showing coverage and KPI cards. Then select [INSERT_EVENT_DATE] in both date inputs, return to ‘Procurement & forecast’, and hover over the verified forecast miss.

[ON-SCREEN CAPTION SUMMARY]

> JANUARY PILOT: TRACEABLE FORECAST-TO-HEDGE DECISIONS
> Case study: [INSERT_EVENT_DATE] · [INSERT_EVENT_DESCRIPTION]

[VOICEOVER SCRIPT]

Across January, the default policy matches all forty-eight settlement periods per day. The practical outcome is a repeatable path from forecast vintage to procurement recommendation and audit trail. On [INSERT_EVENT_DATE], we observed [INSERT_EVENT_DESCRIPTION]. The chart shows why the timing and direction of that miss matter alongside monthly averages. This is the event I would review with the desk before agreeing operational alert thresholds.

**[TIMESTAMP] 4:15–4:45 | Phase two roadmap and client close**

[SCREEN ACTION] Show a prepared roadmap slide with three columns: ‘Imbalance economics’, ‘Weather ensembles’, ‘Trader alerts’. Keep a small portal screenshot beside it; identify these as proposed integrations.

[ON-SCREEN CAPTION SUMMARY]

> PHASE 2: PRICES · ENSEMBLES · ALERTS
> Prove economic value before scaling execution.

[VOICEOVER SCRIPT]

Phase two brings three additions: imbalance prices to translate volume risk into economic exposure; weather ensembles to strengthen uncertainty estimates; and automated alerts when a position breaches agreed thresholds. We would validate performance through a controlled shadow-trading period before connecting execution. My recommendation is to progress with desk-approved risk limits and a jointly agreed scorecard covering forecast quality, excess hedging, and actual imbalance cost.

# PART 2: Internal Technical Lead Review & Architecture Handover (4:45–9:30)

**[TIMESTAMP] 4:45–5:15 | Architecture handover**

[SCREEN ACTION] Switch to the IDE. Show the repository tree and a simple React → FastAPI → cached snapshot diagram. Open frontend/package.json, backend/requirements.txt, vercel.json and render.yaml side by side.

[ON-SCREEN CAPTION SUMMARY]

> REACT / VITE / TAILWIND / RECHARTS → FASTAPI
> Vercel frontend + Render API configuration prepared

[VOICEOVER SCRIPT]

Switching now to the technical handover: the frontend is React with Vite, Tailwind, and Recharts. FastAPI owns validation, forecast selection, analytics, and CSV export. The browser sends scenario parameters rather than calculating competing versions of risk. Docker separates the two services. Configuration targets a Vercel frontend and Render API; this demonstration runs locally, so I am not presenting an unverified cloud deployment as completed.

**[TIMESTAMP] 5:15–5:45 | Data ingestion and immutable snapshot**

[SCREEN ACTION] Open backend/app/data_service.py at download(), normalize() and ingest(). Show backend/data/elexon_jan2026_cache.json metadata without expanding the full dataset.

[ON-SCREEN CAPTION SUMMARY]

> PUBLIC ELEXON STREAMS → VALIDATED SNAPSHOT
> Retries · resumable daily chunks · atomic replacement

[VOICEOVER SCRIPT]

The loader calls the public FUELHH and WINDFOR streams without an API key. It keeps wind actuals and every forecast vintage, normalizes UTC timestamps, and removes boundary duplicates. Daily downloads use bounded concurrency, timeouts, retries, and resumable chunks. A checksum identifies the snapshot. Replacement is atomic and requires complete January actual coverage, so a failed refresh cannot overwrite the previous complete dataset with partial results.

**[TIMESTAMP] 5:45–6:15 | Point-in-time matching and look-ahead prevention**

[SCREEN ACTION] Open backend/app/analytics.py at latest(), forecast_at() and policy(). Highlight bisect_right and the cutoff calculation. Show publishTime ≤ decisionCutoffTime in a large overlay.

[ON-SCREEN CAPTION SUMMARY]

> LATEST ELIGIBLE VINTAGE, NEVER A LATER REVISION
> publishTime ≤ decisionCutoffTime

[VOICEOVER SCRIPT]

The critical invariant is publication time at or before the decision cutoff. For each delivery timestamp, the engine searches its ordered forecast vintages and selects the latest eligible record. The semantics are a backward as-of join, implemented here with timestamp indexes and binary search. Eligibility includes an exactly matching cutoff. Historical buffer calibration separately applies the same availability rule to actual publications, preventing later corrections from entering earlier decisions.

**[TIMESTAMP] 6:15–6:45 | Boundary dates and resolution alignment**

[SCREEN ACTION] In data_service.py, highlight begin and finish. Return to forecast_at() in analytics.py and highlight exact matching, the one-hour maximum gap, both latest() calls and the interpolation weight.

[ON-SCREEN CAPTION SUMMARY]

> DECEMBER PUBLICATIONS SUPPORT JANUARY 1
> Interpolate only between two eligible endpoints.

[VOICEOVER SCRIPT]

The download begins in December, preserving January first’s prior-day forecasts and enough history for calibration. It extends into February to capture January’s final actual publication. Exact delivery timestamps take priority. Missing half-hours can be linearly interpolated between neighboring hourly forecasts, but both endpoints must satisfy the target cutoff. Gaps longer than one hour remain missing, and we never extrapolate a forecast beyond its available delivery range.

**[TIMESTAMP] 6:45–7:15 | Caching and measured performance**

[SCREEN ACTION] Show load_cache() and the lru_cache decorators on policy(), calibration_summary() and _horizon(). Open VERIFICATION.md at its recorded timing paragraph.

[ON-SCREEN CAPTION SUMMARY]

> NO LIVE API CALL ON STARTUP
> Warm update ≈23 ms; cold 48h scenario ≈3 s locally

[VOICEOVER SCRIPT]

Caching serves two purposes: reproducible analysis and independence from upstream availability. The service loads the local snapshot without a startup API call, then memoizes forecast policies and calibration summaries. A recorded warm demand update took about twenty-three milliseconds locally; a cold full-month forty-eight-hour scenario took about three seconds. Those are measured examples, not a promise that every API request or network round trip finishes below fifty milliseconds.

**[TIMESTAMP] 7:15–7:45 | API contracts and validation**

[SCREEN ACTION] Open backend/app/main.py: lifespan(), /api/health, /api/desk, /api/export. Beside it, open backend/app/models.py at DeskQuery and Settlement; show /docs briefly if available.

[ON-SCREEN CAPTION SUMMARY]

> TYPED INPUTS · AUDITABLE OUTPUTS
> Invalid query → 422 · unavailable dataset → 503

[VOICEOVER SCRIPT]

Start code review in main.py. Lifespan loads the engine once, while the endpoints expose health, analysis, and export. Models.py defines typed query constraints and settlement responses with Pydantic. Dates must remain inside January, and invalid horizons or demand values are rejected. Missing cache state returns a clear service-unavailable response. CSV export reuses the same analytical result, avoiding a second implementation that could disagree with the dashboard.

**[TIMESTAMP] 7:45–8:15 | Analytics responsibilities and vectorization**

[SCREEN ACTION] Open analytics.py at stats(), calibration(), dashboard() and _horizon(). Highlight np.quantile, actual publication filtering and the per-bucket drop_duplicates call.

[ON-SCREEN CAPTION SUMMARY]

> SIGNED ERRORS + EMPIRICAL QUANTILES
> As-of actual revisions · minimum calibration sample

[VOICEOVER SCRIPT]

Analytics.py contains the quantitative definitions. NumPy handles error statistics and empirical quantiles; Pandas handles filtering, joins, and grouped profiles. Calibration uses the previous thirty days, requires at least thirty observations, and selects actual revisions available at the cutoff. Horizon analysis keeps one vintage per delivery timestamp within each bucket. Indexed selection and bounded memoization complement vectorized calculations, while explicit loops preserve settlement-level provenance and missing-data decisions.

**[TIMESTAMP] 8:15–8:30 | Frontend review**

[SCREEN ACTION] Open frontend/src/App.tsx, frontend/src/api.ts and frontend/src/components.tsx. Expand Hero.tsx, useTheme.ts and theme.css in the tree; the current repo uses components.tsx, not a components/ directory.

[ON-SCREEN CAPTION SUMMARY]

> APP STATE → TYPED API → REUSABLE CHARTS
> Current component module: frontend/src/components.tsx

[VOICEOVER SCRIPT]

On the frontend, App.tsx coordinates filters and scenarios. Api.ts provides typed requests and cancellation. Components.tsx holds charts and the ledger. Hero, theme state, and styling remain separate, keeping presentation concerns outside the analytics engine.

**[TIMESTAMP] 8:30–9:00 | DevOps and verification**

[SCREEN ACTION] Show docker-compose.yml and both Dockerfiles. Type docker compose up --build in a terminal; execute only with Docker installed. Show backend/tests and VERIFICATION.md with the recorded 33-test result.

[ON-SCREEN CAPTION SUMMARY]

> docker compose up --build
> 33 backend tests passed · frontend production build passed

[VOICEOVER SCRIPT]

With Docker installed, the command shown here builds both images and starts the complete stack from the repository root. The frontend proxies API requests, and backend health gates startup. Thirty-three backend tests passed, covering cutoff boundaries, interpolation, revisions, cache failures, and CSV parity. The frontend production build and browser checks also passed. Docker was unavailable during verification, so container execution remains a validation step before deployment.

**[TIMESTAMP] 9:00–9:30 | AI-assisted workflow and handover close**

[SCREEN ACTION] Open README.md at the AI development disclosure and production-scope notes. End on a three-item checklist: ‘Validate economics’, ‘Harden operations’, ‘Shadow trade’.

[ON-SCREEN CAPTION SUMMARY]

> AI-ASSISTED BUILD. EXPLICIT DOMAIN TESTS.
> Next: economic validation, operational controls, shadow trading.

[VOICEOVER SCRIPT]

OpenAI Codex accelerated scaffolding, interface development, and implementation work, with that assistance disclosed in the README. Domain assumptions are explicit in the methodology and backed by targeted tests; the receiving engineering and trading teams should review and approve them. Before production, complete hosted verification, access controls, operational monitoring, and price-based validation. The handover delivers a reproducible decision-support foundation and a clear path into supervised trading operations.

