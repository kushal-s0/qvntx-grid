import { ArrowDown, ArrowUpRight, Pause, Play, Wind, Zap } from "lucide-react";
import { useRef, useState, type CSSProperties } from "react";
import type { Desk } from "./api";
import { number } from "./components";

/** A CSS/SVG scene: no video download, canvas loop, or WebGL dependency. */
export default function Hero({
  data,
  onMethod,
}: {
  data: Desk | null;
  onMethod: () => void;
}) {
  const scene = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const move = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || paused) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    scene.current?.style.setProperty(
      "--pointer-x",
      `${((event.clientX - bounds.left) / bounds.width - 0.5) * 12}deg`,
    );
    scene.current?.style.setProperty(
      "--pointer-y",
      `${((event.clientY - bounds.top) / bounds.height - 0.5) * -8}deg`,
    );
  };
  const reset = () => {
    scene.current?.style.setProperty("--pointer-x", "0deg");
    scene.current?.style.setProperty("--pointer-y", "0deg");
  };
  return (
    <section
      className={`hero ${paused ? "motion-paused" : ""}`}
      aria-label="Wind intelligence overview"
    >
      <div className="hero-copy">
        <div className="hero-overline">
          <span className="status-dot" /> ENERGY INTELLIGENCE, IN FOCUS{" "}
          <span className="hero-edition">VOL. 01 / 2026</span>
        </div>
        <h1>
          <span>Power in</span>
          <span className="hero-title-last">
            perspective<span className="title-period">.</span>
          </span>
        </h1>
        <p className="hero-description">
          A clearer view of wind. A more confident position.
          <br className="desktop-break" /> Turn tomorrow’s uncertainty into
          informed energy decisions.
        </p>
        <div className="hero-actions">
          <a href="#trading-workspace" className="button primary">
            Explore the trading desk <ArrowDown size={16} />
          </a>
          <button className="hero-method" onClick={onMethod}>
            Behind the forecast <ArrowUpRight size={16} />
          </button>
        </div>
        <div className="hero-proof">
          <div className="proof-mark">
            <Zap size={17} />
          </div>
          <p>
            Grounded in real market data.
            <span>Elexon BMRS · Great Britain · January 2026</span>
          </p>
        </div>
      </div>
      <div className="hero-art" onPointerMove={move} onPointerLeave={reset}>
        <div className="scene-caption">
          <span>THE WIND → POWER CONNECTION</span>
          <span>GB / UTC</span>
        </div>
        <div className="energy-scene" ref={scene} aria-hidden="true">
          <div className="scene-grid" />
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="architecture">
            {[
              { x: 48, y: 155, h: 85, w: 94 },
              { x: 166, y: 169, h: 132, w: 100 },
              { x: 290, y: 164, h: 202, w: 122 },
              { x: 434, y: 171, h: 102, w: 92 },
              { x: 105, y: 265, h: 54, w: 109 },
              { x: 239, y: 295, h: 90, w: 116 },
              { x: 382, y: 305, h: 67, w: 108 },
            ].map((b, i) => (
              <div
                key={i}
                className={`scene-block block-${i}`}
                style={
                  {
                    "--x": `${b.x}px`,
                    "--y": `${b.y}px`,
                    "--h": `${b.h}px`,
                    "--w": `${b.w}px`,
                    "--delay": `${i * 90}ms`,
                  } as CSSProperties
                }
              >
                <div className="block-top" />
                <div className="block-front" />
                <div className="block-side" />
                {i === 2 && (
                  <div className="wind-turbine">
                    <svg viewBox="0 0 160 230" fill="none">
                      <defs>
                        <linearGradient id="tower" x1="70" x2="94">
                          <stop stopColor="#8697c4" />
                          <stop offset=".48" stopColor="#f7f8ff" />
                          <stop offset="1" stopColor="#adbdda" />
                        </linearGradient>
                      </defs>
                      <path d="M77 80L69 222H92L83 80" fill="url(#tower)" />
                      <ellipse
                        cx="81"
                        cy="222"
                        rx="20"
                        ry="5"
                        fill="#3d52a0"
                        opacity=".1"
                      />
                      <g className="turbine-rotor">
                        <path
                          d="M80 82C75 57 78 14 83 4C89 25 86 55 83 81Z"
                          fill="#f8f9ff"
                          stroke="#8697c4"
                          strokeWidth=".8"
                        />
                        <path
                          d="M80 82C75 57 78 14 83 4C89 25 86 55 83 81Z"
                          fill="#d8def4"
                          stroke="#8697c4"
                          strokeWidth=".8"
                          transform="rotate(120 80 82)"
                        />
                        <path
                          d="M80 82C75 57 78 14 83 4C89 25 86 55 83 81Z"
                          fill="#becbea"
                          stroke="#8697c4"
                          strokeWidth=".8"
                          transform="rotate(240 80 82)"
                        />
                      </g>
                      <circle cx="81" cy="82" r="6" fill="#3d52a0" />
                      <circle cx="80" cy="81" r="2.6" fill="#f2f2fb" />
                    </svg>
                  </div>
                )}
                {i === 1 && (
                  <div className="scene-mini-bars">
                    {[35, 52, 40, 67, 82, 65, 96].map((h, i) => (
                      <i
                        key={i}
                        style={
                          { height: `${h}%`, "--bar-index": i } as CSSProperties
                        }
                      />
                    ))}
                  </div>
                )}
                {i === 4 && <div className="scene-code">+ / −</div>}
              </div>
            ))}
          </div>
          <div className="floating-orb orb-one" />
          <div className="floating-orb orb-two" />
          <div className="floating-spark">
            <Zap size={32} strokeWidth={1.2} />
          </div>
        </div>
        <div className="scene-data-card wind-card">
          <span className="scene-card-icon">
            <Wind size={16} />
          </span>
          <div>
            <span>Wind at decision time</span>
            <strong>
              {data ? number(data.summary.forecastMean) : "—"}
              <small> MW</small>
            </strong>
          </div>
          <span className="scene-card-indicator" />
        </div>
        <div className="scene-data-card vintage-card">
          <span className="vintage-symbol">↗</span>
          <div>
            <strong>Foresight, without hindsight.</strong>
            <span>Point-in-time forecast matching</span>
          </div>
        </div>
        <div className="scene-bottom">
          <span>
            <i /> A DIFFERENT VIEW OF TOMORROW
          </span>
          <button
            aria-label={
              paused
                ? "Play decorative animation"
                : "Pause decorative animation"
            }
            aria-pressed={paused}
            onClick={() => {
              setPaused(!paused);
              reset();
            }}
          >
            {paused ? <Play size={12} /> : <Pause size={12} />} Motion{" "}
            {paused ? "off" : "on"}
          </button>
        </div>
      </div>
      <div className="hero-bottom-line">
        <span>BUILT FOR THE DAY AHEAD.</span>
        <div>
          <i />
          <span>Forecast. Understand. Position.</span>
        </div>
        <a href="#trading-workspace" aria-label="Scroll to trading workspace">
          <ArrowDown size={18} />
        </a>
      </div>
    </section>
  );
}
