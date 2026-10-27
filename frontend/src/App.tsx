import { useEffect, useState } from "react";
import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  ExternalLink,
  Flame,
  Gauge,
  Layers3,
  Moon,
  Radio,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  Wind,
  Zap,
} from "lucide-react";
import { fetchDesk, apiUrl, type Desk, type Query } from "./api";
import Hero from "./Hero";
import { useTheme } from "./useTheme";
import {
  number,
  Panel,
  RiskCharts,
  SettlementTable,
  Stat,
  WindChart,
} from "./components";

const initial: Query = {
  start: "2026-01-01",
  end: "2026-01-31",
  mode: "gate",
  cutoff_hour: 11,
  cutoff_minute: 0,
  lead_hours: 24,
  demand: 15000,
  confidence: "P90",
};
function App() {
  const { theme, toggleTheme } = useTheme();
  const [tab, setTab] = useState<"desk" | "risk">("desk"),
    [query, setQuery] = useState<Query>(initial);
  const [data, setData] = useState<Desk | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0),
    [method, setMethod] = useState(false);
  const [draftDemand, setDraftDemand] = useState(15000);
  const update = (patch: Partial<Query>) =>
    setQuery((q) => ({ ...q, ...patch }));
  const openWorkspace = (next: "desk" | "risk") => {
    setTab(next);
    document.getElementById("trading-workspace")?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  };
  useEffect(() => {
    if (!method) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMethod(false);
        return;
      }
      if (event.key !== "Tab") return;
      const elements = [
        ...document.querySelectorAll<HTMLElement>(
          ".modal button,.modal a[href]",
        ),
      ];
      const first = elements[0],
        last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", handleKey);
      previous?.focus();
    };
  }, [method]);
  useEffect(() => {
    const id = setTimeout(
      () => setQuery((q) => ({ ...q, demand: draftDemand })),
      250,
    );
    return () => clearTimeout(id);
  }, [draftDemand]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const timer = setTimeout(() => controller.abort("timeout"), 90000);
    fetchDesk(query, controller.signal)
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        if (!controller.signal.aborted) {
          setError(e.message);
          setLoading(false);
        } else if (controller.signal.reason === "timeout") {
          setError(
            "The analysis request timed out. Retry or check the backend.",
          );
          setLoading(false);
        }
      })
      .finally(() => clearTimeout(timer));
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, retry]);
  const preset = (value: string) => {
    const ranges: Record<string, [string, string]> = {
      month: ["01", "31"],
      w1: ["01", "07"],
      w2: ["08", "14"],
      w3: ["15", "21"],
      w4: ["22", "28"],
      day: [query.start.slice(-2), query.start.slice(-2)],
    };
    const r = ranges[value];
    if (r) update({ start: `2026-01-${r[0]}`, end: `2026-01-${r[1]}` });
  };
  const activePreset =
    query.start === "2026-01-01" && query.end === "2026-01-31"
      ? "month"
      : query.start === query.end
        ? "day"
        : [
            ["01", "07", "w1"],
            ["08", "14", "w2"],
            ["15", "21", "w3"],
            ["22", "28", "w4"],
          ].find(
            ([a, b]) => query.start.endsWith(a) && query.end.endsWith(b),
          )?.[2] || "";
  const fresh = data && !loading && !error;
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 },
    );
    document
      .querySelectorAll(
        ".results .panel, .results .insight-row, .results .stat",
      )
      .forEach((element) => {
        element.classList.add("reveal");
        observer.observe(element);
      });
    return () => observer.disconnect();
  }, [tab, data]);
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" aria-label="qvntx-grid home">
          <div className="brand-mark">
            <Zap size={23} fill="currentColor" />
          </div>
          <span>
            qvntx<span className="brand-light">.grid</span>
          </span>
        </a>
        <div className="workspace-tag">
          <span className="status-dot" /> GB POWER WORKSPACE
        </div>
        <div className="nav-caption">WORKSPACE</div>
        <nav>
          <button
            className={tab === "desk" ? "active" : ""}
            onClick={() => openWorkspace("desk")}
          >
            <Layers3 size={18} /> Procurement desk{" "}
            <span className="nav-key">01</span>
          </button>
          <button
            className={tab === "risk" ? "active" : ""}
            onClick={() => openWorkspace("risk")}
          >
            <BarChart3 size={18} /> Forecast risk lab{" "}
            <span className="nav-key">02</span>
          </button>
        </nav>
        <div className="sidebar-note">
          <Wind size={21} />
          <h3>A clearer view of tomorrow.</h3>
          <p>Wind intelligence for better power procurement decisions.</p>
          <span>
            JANUARY 2026 ARCHIVE <ArrowUpRight size={12} />
          </span>
        </div>
        <div className="sidebar-bottom">
          <div className="data-source">
            <Radio size={15} />
            <span>
              Elexon BMRS<span>Public market data</span>
            </span>
            <i className="status-dot" />
          </div>
          <button onClick={() => setMethod(true)}>
            <CircleHelp size={16} /> Methodology & sources{" "}
            <ExternalLink size={13} />
          </button>
          <div className="build-label">qvntx-grid / v1.0.0</div>
        </div>
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? <Moon size={15} /> : <Sun size={15} />}
          <span>{theme === "light" ? "Dark" : "Light"}</span>
        </button>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div>
            <span className="breadcrumb">Workspace</span>
            <span className="slash">/</span>
            <span>
              {tab === "desk" ? "Procurement desk" : "Forecast risk lab"}
            </span>
          </div>
          <div className="topbar-right">
            <span className="market-tag">
              <span className="flag">GB</span> Great Britain{" "}
              <ChevronDown size={12} />
            </span>
            <span className="timezone">
              <Clock3 size={13} /> UTC
            </span>
            <div className="avatar">QT</div>
          </div>
        </header>
        <main>
          <Hero data={data} onMethod={() => setMethod(true)} />
          <div className="page-heading" id="trading-workspace">
            <div>
              <div className="eyebrow">
                <span className="status-dot" /> DAY-AHEAD ELECTRICITY{" "}
                <span>/</span> JAN 2026
              </div>
              <h2 className="workspace-title">
                {tab === "desk"
                  ? "Procurement desk"
                  : "Forecast accuracy & risk"}
              </h2>
              <p>
                {tab === "desk"
                  ? "Turn wind uncertainty into a more informed day-ahead position."
                  : "Understand forecast error. Quantify the exposure behind every megawatt."}
              </p>
            </div>
            <button
              className="button secondary methodology-button"
              onClick={() => setMethod(true)}
            >
              <CircleHelp size={15} /> Methodology <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="workspace-tabs" role="tablist" aria-label="Workspace">
            <button
              role="tab"
              aria-selected={tab === "desk"}
              className={tab === "desk" ? "selected" : ""}
              onClick={() => setTab("desk")}
            >
              <Layers3 size={16} /> Procurement & forecast <span>01</span>
            </button>
            <button
              role="tab"
              aria-selected={tab === "risk"}
              className={tab === "risk" ? "selected" : ""}
              onClick={() => setTab("risk")}
            >
              <BarChart3 size={16} /> Accuracy & risk lab <span>02</span>
            </button>
            <div className="archive-badge">
              <span className="status-dot" /> Historical analysis
            </div>
          </div>
          <section className="filters" aria-label="Analysis filters">
            <div className="date-filter">
              <label>
                <CalendarDays size={13} /> DELIVERY WINDOW
              </label>
              <div className="date-inputs">
                <input
                  aria-label="Start date"
                  type="date"
                  min="2026-01-01"
                  max={query.end}
                  value={query.start}
                  onChange={(e) => {
                    if (e.target.value && e.target.value <= query.end)
                      update({ start: e.target.value });
                  }}
                />
                <ArrowRight size={14} />
                <input
                  aria-label="End date"
                  type="date"
                  min={query.start}
                  max="2026-01-31"
                  value={query.end}
                  onChange={(e) => {
                    if (e.target.value && e.target.value >= query.start)
                      update({ end: e.target.value });
                  }}
                />
              </div>
            </div>
            <div className="preset-filter">
              <label>QUICK SELECT</label>
              <select
                aria-label="Date preset"
                value={activePreset}
                onChange={(e) => preset(e.target.value)}
              >
                <option value="" disabled>
                  Custom range
                </option>
                <option value="month">Full month</option>
                <option value="w1">Week 1 · 01–07 Jan</option>
                <option value="w2">Week 2 · 08–14 Jan</option>
                <option value="w3">Week 3 · 15–21 Jan</option>
                <option value="w4">Week 4 · 22–28 Jan</option>
                <option value="day">Single day deep-dive</option>
              </select>
            </div>
            <div className="cutoff-filter">
              <label>
                <Clock3 size={13} /> DECISION CUTOFF
              </label>
              <select
                aria-label="Decision policy"
                value={
                  query.mode === "gate" ? "gate" : String(query.lead_hours)
                }
                onChange={(e) =>
                  update(
                    e.target.value === "gate"
                      ? { mode: "gate" }
                      : { mode: "lead", lead_hours: Number(e.target.value) },
                  )
                }
              >
                <option value="gate">
                  Day-ahead gate · D−1 at{" "}
                  {String(query.cutoff_hour).padStart(2, "0")}:
                  {String(query.cutoff_minute).padStart(2, "0")} UTC
                </option>
                {[4, 12, 24, 36, 48].map((h) => (
                  <option key={h} value={h}>
                    {h}h before delivery
                  </option>
                ))}
              </select>
            </div>
            {query.mode === "gate" && (
              <div className="gate-filter">
                <label>GATE TIME · UTC</label>
                <input
                  aria-label="Gate time UTC"
                  type="time"
                  value={`${String(query.cutoff_hour).padStart(2, "0")}:${String(query.cutoff_minute).padStart(2, "0")}`}
                  onChange={(e) => {
                    const [h, m] = e.target.value.split(":").map(Number);
                    if (Number.isFinite(h) && Number.isFinite(m))
                      update({ cutoff_hour: h, cutoff_minute: m });
                  }}
                />
              </div>
            )}
            <button
              className="refresh-button"
              title="Reload analysis from cache"
              aria-label="Reload analysis"
              disabled={loading}
              onClick={() => setRetry((r) => r + 1)}
            >
              <RefreshCw size={17} className={loading ? "spin" : ""} />
            </button>
          </section>
          <div aria-live="polite">
            {loading && (
              <div className="loading-strip">
                <RefreshCw size={13} className="spin" /> Matching publication
                vintages and calibrating historical risk…
              </div>
            )}
            {error && (
              <div className="error-banner">
                <strong>Analysis unavailable</strong>
                <span>{error}</span>
                <button onClick={() => setRetry((r) => r + 1)}>
                  Retry connection
                </button>
              </div>
            )}
          </div>
          {!data && !error && (
            <div className="skeleton-grid" aria-label="Loading analysis">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton" />
              ))}
              <div className="skeleton skeleton-chart" />
            </div>
          )}
          {data && (
            <div
              className={loading || error ? "results stale" : "results"}
              aria-busy={loading}
            >
              {tab === "desk" ? (
                <>
                  <div className="stats-grid four">
                    <Stat
                      label="Forecast wind"
                      value={data.summary.forecastMean}
                      note="Average at decision cutoff"
                      icon={<Wind size={17} />}
                    />
                    <Stat
                      label="Actual wind"
                      value={data.summary.actualMean}
                      note="Average metered generation"
                      icon={<Activity size={17} />}
                    />
                    <Stat
                      label="Forecast MAE"
                      value={data.kpis.mae}
                      note={`${number(data.summary.coveragePct, 1)}% matched settlement coverage`}
                      icon={<Gauge size={17} />}
                    />
                    <Stat
                      label="Recommended thermal"
                      value={data.summary.thermalMean}
                      note={`${data.query.confidence} · average procurement requirement`}
                      accent
                      icon={<Flame size={17} />}
                    />
                  </div>
                  <div className="desk-chart-layout">
                    <WindChart data={data} />
                    <section className="panel simulator">
                      <div className="sim-heading">
                        <span className="sim-icon">
                          <SlidersHorizontal size={18} />
                        </span>
                        <span className="pill">SCENARIO</span>
                      </div>
                      <h2>Build your position</h2>
                      <p>
                        Model demand and choose your protection against wind
                        shortfall.
                      </p>
                      <div className="demand-label">
                        <label htmlFor="demand">Expected demand</label>
                        <span>MW</span>
                      </div>
                      <div className="demand-value">
                        {number(draftDemand)}
                        <span> MW</span>
                      </div>
                      <input
                        id="demand"
                        type="range"
                        min="1000"
                        max="40000"
                        step="250"
                        value={draftDemand}
                        onChange={(e) => setDraftDemand(Number(e.target.value))}
                        style={
                          {
                            "--range-progress": `${((draftDemand - 1000) / 39000) * 100}%`,
                          } as React.CSSProperties
                        }
                      />
                      <div className="range-labels">
                        <span>1,000 MW</span>
                        <span>40,000 MW</span>
                      </div>
                      <label className="confidence-label">
                        Risk buffer confidence <ShieldCheck size={14} />
                      </label>
                      <div className="confidence-options">
                        {(["P50", "P90", "P95"] as const).map((p) => (
                          <button
                            key={p}
                            className={query.confidence === p ? "selected" : ""}
                            onClick={() => update({ confidence: p })}
                          >
                            {p}
                            {query.confidence === p && <Check size={12} />}
                          </button>
                        ))}
                      </div>
                      <div className="sim-calculation">
                        <div>
                          <span>Demand</span>
                          <span>{number(data.query.demand)} MW</span>
                        </div>
                        <div>
                          <span>− Wind forecast</span>
                          <span>{number(data.summary.forecastMean)} MW</span>
                        </div>
                        <div>
                          <span>+ Historical risk buffer</span>
                          <span className="text-amber">
                            {number(data.summary.bufferMean)} MW
                          </span>
                        </div>
                      </div>
                      <div className="thermal-result">
                        <span>
                          <Flame size={13} /> RECOMMENDED THERMAL
                        </span>
                        <strong>
                          {number(data.summary.thermalMean)} <small>MW</small>
                        </strong>
                        <p>Average of per-period recommendations</p>
                      </div>
                      <div className="sim-footnote">
                        <ShieldCheck size={13} />
                        <span>
                          Calibrated using the prior 30 days of errors available
                          at each decision.
                        </span>
                      </div>
                    </section>
                  </div>
                  <div className="insight-row">
                    <div className="insight-icon">
                      <ShieldCheck size={19} />
                    </div>
                    <div>
                      <strong>
                        Every forecast respects your decision time.
                      </strong>
                      <p>
                        Only publications available at the selected cutoff enter
                        the position. Hourly forecasts are interpolated to
                        30-minute periods.
                      </p>
                    </div>
                    <button
                      onClick={() => setMethod(true)}
                      aria-label="View point-in-time methodology"
                    >
                      <ArrowUpRight size={18} />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="stats-grid six">
                    <Stat
                      label="MAE"
                      value={data.kpis.mae}
                      note="Mean absolute error"
                    />
                    <Stat
                      label="RMSE"
                      value={data.kpis.rmse}
                      note="Tail-sensitive error"
                    />
                    <Stat
                      label="MAPE"
                      value={data.kpis.mape}
                      unit="%"
                      note={`${data.kpis.mapeExcluded} zero actuals excluded`}
                    />
                    <Stat
                      label="Mean bias"
                      value={data.kpis.mbe}
                      note="Positive = over-forecast"
                    />
                    <Stat
                      label="P90 shortfall"
                      value={data.kpis.p90}
                      note="Conditional on positive error"
                    />
                    <Stat
                      label="P95 shortfall"
                      value={data.kpis.p95}
                      note={`${number(data.kpis.positiveSamples)} positive errors`}
                      accent
                    />
                  </div>
                  <div className="risk-explainer">
                    <ShieldCheck size={16} />
                    <span>
                      Shortfall KPIs describe the selected window
                      retrospectively. Procurement buffers use only history
                      available at each decision and the quantile of all signed
                      errors, floored at zero.
                    </span>
                  </div>
                  <RiskCharts data={data} />
                </>
              )}
              <SettlementTable
                key={`${data.query.start}-${data.query.end}`}
                data={data}
                query={data.query}
              />
              <details className="data-notes">
                <summary>
                  <CircleHelp size={14} /> Data coverage & model assumptions{" "}
                  <ChevronDown size={14} />
                </summary>
                <ul>
                  {data.warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </details>
              <footer>
                <span>
                  <span className="status-dot" />{" "}
                  {fresh
                    ? "Verified cached data"
                    : "Updating / last successful result"}{" "}
                  · Elexon BMRS
                </span>
                <span>
                  {number(data.metadata.forecastRecords)} forecast vintages ·
                  Cache fetched{" "}
                  {new Date(data.metadata.fetchedAt).toLocaleDateString(
                    "en-GB",
                    { timeZone: "UTC" },
                  )}
                </span>
              </footer>
            </div>
          )}
        </main>
      </div>
      {method && (
        <div className="modal-backdrop" onClick={() => setMethod(false)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="method-title"
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              autoFocus
              onClick={() => setMethod(false)}
            >
              Close ×
            </button>
            <div className="eyebrow">METHOD & PROVENANCE</div>
            <h2 id="method-title">A decision-time view of wind.</h2>
            <p>
              <strong>Point-in-time:</strong> for each delivery period, select
              the latest forecast published at or before D−1’s configured UTC
              gate, or delivery minus the chosen lead hours. Both interpolation
              endpoints must pass the same cutoff; gaps longer than one hour are
              left empty.
            </p>
            <p>
              <strong>Error:</strong> forecast − actual. MAE is the average
              absolute error; RMSE weights large misses more heavily; MAPE
              excludes zero actuals. Positive bias implies deficit risk.
            </p>
            <p>
              <strong>Risk:</strong> analytical P90/P95 are percentiles
              conditional on a positive error. A procurement buffer is the
              chosen percentile of all signed errors in the prior 30 days,
              floored at zero, using actual revisions available by the decision.
              At least 30 observations are required.
            </p>
            <p>
              <strong>Position:</strong> max(0, simulated demand − forecast wind
              + buffer), calculated for each half-hour. This is a retrospective
              scenario; embedded generation, other supply, prices and physical
              constraints require separate modeling.
            </p>
            <p>
              <strong>Sources:</strong>{" "}
              <a
                href="https://developer.data.elexon.co.uk/"
                target="_blank"
                rel="noreferrer"
              >
                Elexon Insights API documentation <ExternalLink size={12} />
              </a>
              . WINDFOR forecasts and FUELHH operationally metered GB wind;
              11:00 UTC is this desk’s supplied policy.
            </p>
            <a
              className="button primary"
              href={apiUrl("export", data?.query || query)}
            >
              <ArrowDownToLine size={15} /> Export auditable decisions
            </a>
          </section>
        </div>
      )}
    </div>
  );
}
export default App;
