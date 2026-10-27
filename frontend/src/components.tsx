import { useState, type ReactNode } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
  ArrowUpRight,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { apiUrl, type Desk, type Query, type Settlement } from "./api";

export const number = (v: number | null | undefined, digits = 0) =>
  v == null
    ? "—"
    : v.toLocaleString("en-GB", {
        maximumFractionDigits: digits,
        minimumFractionDigits: digits,
      });
export const shortDate = (s: string) =>
  new Date(s).toLocaleString("en-GB", {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
export function Panel({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
export function Stat({
  label,
  value,
  unit = "MW",
  note,
  accent = false,
  icon,
}: {
  label: string;
  value: number | null;
  unit?: string;
  note: string;
  accent?: boolean;
  icon?: ReactNode;
}) {
  return (
    <article className={`stat ${accent ? "stat-accent" : ""}`}>
      <div className="stat-label">
        {label}
        {icon || <ArrowUpRight size={15} />}
      </div>
      <div className="stat-value">
        {number(value, unit === "%" ? 1 : 0)} <span>{unit}</span>
      </div>
      <div className="stat-note">{note}</div>
    </article>
  );
}
const axis = {
  fill: "var(--chart-text)",
  fontSize: 10,
  fontFamily: "monospace",
};
const tooltip = {
  background: "var(--panel)",
  border: "1px solid var(--line)",
  borderRadius: 8,
  color: "var(--ink)",
  fontSize: 12,
};
export function WindChart({ data }: { data: Desk }) {
  const [actual, setActual] = useState(true),
    [forecast, setForecast] = useState(true),
    [band, setBand] = useState(true);
  const series = data.series.map((r) => ({
    ...r,
    range:
      r.forecast != null && r.actual != null
        ? [Math.min(r.forecast, r.actual), Math.max(r.forecast, r.actual)]
        : null,
  }));
  return (
    <Panel
      title="Wind generation · forecast vs. outturn"
      subtitle="Half-hourly settlement periods · MW · all times UTC"
      action={
        <span className="pill">
          <span className="status-dot" /> Point-in-time matched
        </span>
      }
    >
      <div className="chart-toggles">
        {[
          [
            forecast,
            setForecast,
            "Forecast at decision",
            "var(--chart-forecast)",
          ],
          [actual, setActual, "Actual generation", "var(--chart-actual)"],
          [band, setBand, "Forecast error", "var(--chart-reference)"],
        ].map(([on, set, label, color]) => (
          <button
            key={String(label)}
            className={!on ? "muted" : ""}
            onClick={() => (set as (x: boolean) => void)(!on)}
            aria-pressed={on as boolean}
          >
            <i style={{ background: String(color) }} />
            {String(label)}
          </button>
        ))}
      </div>
      <div className="chart-large">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={series}
            margin={{ top: 12, right: 12, bottom: 5, left: 5 }}
          >
            <defs>
              <linearGradient id="errorFill" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--chart-band)"
                  stopOpacity={0.22}
                />
                <stop
                  offset="100%"
                  stopColor="var(--chart-band)"
                  stopOpacity={0.06}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke="var(--chart-grid)"
              strokeDasharray="3 5"
              vertical={false}
            />
            <XAxis
              dataKey="startTime"
              tick={axis}
              tickFormatter={(s) => shortDate(s)}
              minTickGap={95}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={axis}
              tickFormatter={(v) => `${number(v / 1000, 1)}k`}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <Tooltip
              contentStyle={tooltip}
              labelFormatter={(s) => `${shortDate(String(s))} UTC`}
              formatter={(v, name) => [
                Array.isArray(v)
                  ? v.map((x) => number(Number(x))).join(" – ")
                  : `${number(Number(v))} MW`,
                name,
              ]}
            />
            {band && (
              <Area
                dataKey="range"
                name="Forecast error band"
                stroke="none"
                fill="url(#errorFill)"
                isAnimationActive={false}
              />
            )}
            {forecast && (
              <Line
                type="linear"
                dataKey="forecast"
                name="Forecast at decision"
                stroke="var(--chart-forecast)"
                strokeWidth={1.8}
                dot={false}
                isAnimationActive={false}
              />
            )}
            {actual && (
              <Line
                type="linear"
                dataKey="actual"
                name="Actual wind"
                stroke="var(--chart-actual)"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-footer">
        <span>Source: Elexon BMRS · FUELHH + WINDFOR</span>
        <span>
          {number(data.summary.matched)} / {number(data.summary.periods)}{" "}
          matched periods
        </span>
      </div>
    </Panel>
  );
}
export function RiskCharts({ data }: { data: Desk }) {
  return (
    <>
      <div className="two-col">
        <Panel
          title="The shape of forecast risk"
          subtitle="Signed error distribution · forecast − actual (MW)"
        >
          <div className="chart-medium">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.histogram}
                margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                <XAxis
                  dataKey="error"
                  type="number"
                  domain={["dataMin", "dataMax"]}
                  tick={axis}
                  tickFormatter={(v) => number(v)}
                  minTickGap={45}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={axis} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={tooltip}
                  formatter={(v) => [v, "Settlement periods"]}
                  labelFormatter={(v) => `Error: ${number(Number(v))} MW`}
                />
                <ReferenceLine x={0} stroke="var(--chart-reference)" />
                <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                  {data.histogram.map((r, i) => (
                    <Cell
                      key={i}
                      fill={
                        r.error > 0
                          ? "var(--chart-forecast)"
                          : "var(--chart-actual)"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="risk-legend">
            <span>
              <i className="dot-green" /> Under-forecast · excess hedge
            </span>
            <span>
              <i className="dot-amber" /> Over-forecast · deficit exposure
            </span>
          </div>
        </Panel>
        <Panel
          title="Accuracy across forecast horizons"
          subtitle="Latest vintage per delivery timestamp in each lead bucket"
        >
          <div className="chart-medium">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.horizon}
                margin={{ top: 20, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                <XAxis
                  dataKey="bucket"
                  tick={axis}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={axis} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={tooltip}
                  formatter={(v, n) => [`${number(Number(v))} MW`, n]}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
                <Bar
                  dataKey="mae"
                  name="MAE"
                  fill="var(--chart-forecast)"
                  radius={[3, 3, 0, 0]}
                />
                <Bar
                  dataKey="rmse"
                  name="RMSE"
                  fill="var(--chart-actual)"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-footer">
            Observed errors can vary non-monotonically. Missing buckets remain
            empty.
          </div>
        </Panel>
      </div>
      <Panel
        title="Intraday error signature"
        subtitle="Average error by UTC settlement period · selected delivery days"
      >
        <div className="chart-short">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data.diurnal}
              margin={{ top: 15, right: 20, left: 0, bottom: 0 }}
            >
              <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
              <XAxis
                dataKey="period"
                tick={axis}
                tickFormatter={(p) =>
                  `${String(Math.floor((p - 1) / 2)).padStart(2, "0")}:${p % 2 === 1 ? "00" : "30"}`
                }
                minTickGap={45}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={axis} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={tooltip}
                labelFormatter={(v) => `Settlement period ${v}`}
                formatter={(v, n) => [`${number(Number(v))} MW`, n]}
              />
              <ReferenceLine
                y={0}
                stroke="var(--chart-reference)"
                strokeDasharray="4 4"
              />
              <Area
                type="monotone"
                dataKey="mbe"
                name="Mean bias"
                stroke="var(--chart-forecast)"
                fill="var(--chart-forecast)"
                fillOpacity={0.07}
              />
              <Line
                dataKey="mae"
                name="MAE"
                stroke="var(--chart-forecast)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </>
  );
}
export function SettlementTable({ data, query }: { data: Desk; query: Query }) {
  const [page, setPage] = useState(0),
    [search, setSearch] = useState("");
  const filtered = data.series.filter((r) => r.startTime.includes(search));
  const safePage = Math.min(
    page,
    Math.max(0, Math.ceil(filtered.length / 12) - 1),
  );
  const rows = filtered.slice(safePage * 12, (safePage + 1) * 12);
  return (
    <Panel
      title="Settlement ledger"
      subtitle="Every decision, its publication vintage, and the resulting exposure"
      action={
        <a className="button secondary" href={apiUrl("export", query)} download>
          <Download size={14} /> Export CSV
        </a>
      }
    >
      <div className="table-tools">
        <label className="search">
          <Search size={14} />
          <input
            aria-label="Filter settlement timestamps"
            placeholder="Filter UTC timestamp, e.g. 2026-01-08"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
        </label>
        <span>{number(filtered.length)} periods · MW unless stated</span>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Delivery start · UTC</th>
              <th>Published · UTC</th>
              <th>Forecast</th>
              <th>Actual</th>
              <th>Error</th>
              <th>Abs. error %</th>
              <th>Hedge buffer</th>
              <th>Thermal</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: Settlement) => (
              <tr key={r.startTime}>
                <td title={`Decision cutoff: ${r.decisionCutoffTime}`}>
                  {shortDate(r.startTime)}
                  <span className="period">
                    SP{String(r.settlementPeriod).padStart(2, "0")}
                  </span>
                </td>
                <td
                  title={`Source publications: ${r.sourcePublishTimes.join(", ")}`}
                >
                  {r.publishTime ? shortDate(r.publishTime) : "Unavailable"}
                  {r.interpolated && (
                    <span
                      className="interp"
                      title="Linear interpolation; hover for both source publications"
                    >
                      i
                    </span>
                  )}
                </td>
                <td>{number(r.forecast)}</td>
                <td>{number(r.actual)}</td>
                <td
                  className={
                    r.error != null && r.error > 0 ? "text-amber" : "text-green"
                  }
                >
                  {r.error != null && r.error > 0 ? "+" : ""}
                  {number(r.error)}
                </td>
                <td>
                  {number(r.absErrorPct, 1)}
                  {r.absErrorPct != null ? "%" : ""}
                </td>
                <td title={`${r.calibrationSamples} prior observations`}>
                  {number(r.buffer)}
                </td>
                <td>{number(r.thermal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && (
          <div className="empty-small">No timestamps match this filter.</div>
        )}
      </div>
      <div className="pagination">
        <span>
          Showing {filtered.length ? safePage * 12 + 1 : 0}–
          {Math.min((safePage + 1) * 12, filtered.length)} of{" "}
          {number(filtered.length)}{" "}
          <span className="hide-mobile">· i = interpolated forecast</span>
        </span>
        <div>
          <button
            aria-label="Previous page"
            disabled={safePage === 0}
            onClick={() => setPage(safePage - 1)}
          >
            <ChevronLeft size={15} />
          </button>
          <span>
            {safePage + 1} / {Math.max(1, Math.ceil(filtered.length / 12))}
          </span>
          <button
            aria-label="Next page"
            disabled={(safePage + 1) * 12 >= filtered.length}
            onClick={() => setPage(safePage + 1)}
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </Panel>
  );
}
