import { type ReactNode, useEffect, useState } from "react";

import { getDashboard } from "@/lib/api";
import type { ScamDashboard } from "@/lib/types";

import "./dashboard.css";

const PERIODS = [14, 30, 90];
const TOP_REGIONS = 10;
const percent = (value: number) => `${(value * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
const number = (value: number) => value.toLocaleString("pt-BR");
const shortDate = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

interface Tip {
  x: number;
  y: number;
  text: ReactNode;
}

/**
 * Partner view (Claro, CiX, Febraban): anonymous scams blocked by Caramelo,
 * aggregated in MongoDB Atlas. Opened with ``?painel``; not part of the user's app.
 */
export function PartnerDashboard() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<ScamDashboard | null>(null);
  const [error, setError] = useState(false);
  const [tip, setTip] = useState<Tip | null>(null);
  const [asTable, setAsTable] = useState(false);

  useEffect(() => {
    setError(false);
    getDashboard(days).then(setData).catch(() => setError(true));
  }, [days]);

  const showTip = (event: React.MouseEvent, text: ReactNode) => setTip({ x: event.clientX, y: event.clientY, text });
  const hideTip = () => setTip(null);

  return (
    <div className="dash">
      <header className="dash__header">
        <div>
          <h1>Mapa de golpes · Caramelo</h1>
          <p>Golpes barrados pelo Caramelo. Dados anônimos: só tipo, estado, sinais e data, sem número, endereço ou pessoa.</p>
        </div>
        <div className="dash__filters" role="group" aria-label="Período">
          {PERIODS.map((period) => (
            <button key={period} className={period === days ? "is-active" : undefined} onClick={() => setDays(period)}>
              {period} dias
            </button>
          ))}
        </div>
      </header>

      {error && <p className="dash__note">Não consegui carregar os dados da API.</p>}
      {data && data.simulated_share > 0 && (
        <p className="dash__note">
          {percent(data.simulated_share)} dos eventos são simulados para demonstração (gerados por
          <code> scripts/simulate_events.py</code>). O restante veio do uso real do protótipo.
        </p>
      )}

      {data && (
        <>
          <section className="dash__tiles">
            <Stat label="Golpes barrados" value={number(data.blocked)} detail={`de ${number(data.total)} verificações`} />
            <Stat label="Taxa de bloqueio" value={percent(data.block_rate)} detail="das verificações eram golpe" />
            <Stat label="Ligações · links" value={`${number(data.by_kind.call ?? 0)} · ${number(data.by_kind.link ?? 0)}`} detail="golpes barrados por tipo" />
            <Stat label="Risco médio" value={`${data.avg_blocked_score}/100`} detail="dos golpes barrados" />
          </section>

          {data.waves.length > 0 && (
            <section className="dash__card" aria-labelledby="waves">
              <h2 id="waves">Ondas de golpe nesta semana</h2>
              <ul className="dash__waves">
                {data.waves.map((wave) => (
                  <li key={wave.region}>
                    <span className="dash__wave-icon" aria-hidden="true">!</span>
                    <span>
                      <strong>{wave.region}</strong>: {number(wave.last7)} golpes barrados nos últimos 7 dias,{" "}
                      {wave.growth.toLocaleString("pt-BR")}× a semana anterior ({number(wave.prev7)}).
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="dash__card" aria-labelledby="trend">
            <h2 id="trend">Golpes barrados por dia</h2>
            <DailyBars data={data.by_day} onHover={showTip} onLeave={hideTip} />
          </section>

          <div className="dash__grid">
            <section className="dash__card" aria-labelledby="regions">
              <div className="dash__card-head">
                <h2 id="regions">Por estado</h2>
                <button className="dash__link" onClick={() => setAsTable((value) => !value)}>
                  {asTable ? "Ver gráfico" : "Ver como tabela"}
                </button>
              </div>
              {asTable ? (
                <table className="dash__table">
                  <thead><tr><th>UF</th><th>Barrados</th><th>Verificações</th><th>Últimos 7 dias</th><th>7 dias anteriores</th></tr></thead>
                  <tbody>
                    {data.by_region.map((row) => (
                      <tr key={row.region}><td>{row.region}</td><td>{row.blocked}</td><td>{row.total}</td><td>{row.last7}</td><td>{row.prev7}</td></tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <RankBars
                  rows={data.by_region.slice(0, TOP_REGIONS).map((row) => ({
                    key: row.region, label: row.region, value: row.blocked,
                    tip: <><strong>{row.region}</strong><br />{row.blocked} barrados de {row.total} verificações<br />{row.last7} nos últimos 7 dias</>,
                  }))}
                  onHover={showTip} onLeave={hideTip}
                />
              )}
            </section>
            <section className="dash__card" aria-labelledby="signals">
              <h2 id="signals">Sinais mais comuns nos golpes</h2>
              <RankBars
                rows={data.top_signals.map((row) => ({
                  key: row.signal, label: row.label, value: row.count,
                  tip: <><strong>{row.label}</strong><br />em {row.count} golpes barrados</>,
                }))}
                onHover={showTip} onLeave={hideTip} wideLabels
              />
            </section>
          </div>
        </>
      )}

      {tip && <div className="dash__tip" style={{ left: tip.x + 14, top: tip.y + 14 }} role="tooltip">{tip.text}</div>}
    </div>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="dash__stat">
      <span className="dash__stat-label">{label}</span>
      <strong className="dash__stat-value">{value}</strong>
      <span className="dash__stat-detail">{detail}</span>
    </div>
  );
}

type HoverHandler = (event: React.MouseEvent, text: ReactNode) => void;

/** Vertical bars, one per day, with a recessive grid and the peak labelled directly. */
function DailyBars({ data, onHover, onLeave }: { data: ScamDashboard["by_day"]; onHover: HoverHandler; onLeave: () => void }) {
  const width = 720;
  const height = 200;
  const pad = { top: 18, bottom: 22, left: 30 };
  const max = Math.max(1, ...data.map((day) => day.blocked));
  const ticks = [0, Math.ceil(max / 2), max];
  const slot = (width - pad.left) / data.length;
  const bar = Math.max(2, slot - 2); // 2px surface gap between adjacent bars
  const y = (value: number) => pad.top + (height - pad.top - pad.bottom) * (1 - value / max);
  const peak = data.reduce((best, day) => (day.blocked > best.blocked ? day : best), data[0]);
  return (
    <svg className="dash__chart" viewBox={`0 0 ${width} ${height}`} role="img"
      aria-label={`Golpes barrados por dia. Pico de ${peak?.blocked ?? 0} em ${peak ? shortDate(peak.date) : ""}.`}>
      {ticks.map((tick) => (
        <g key={tick}>
          <line className="dash__grid-line" x1={pad.left} x2={width} y1={y(tick)} y2={y(tick)} />
          <text className="dash__axis" x={pad.left - 6} y={y(tick) + 4} textAnchor="end">{tick}</text>
        </g>
      ))}
      {data.map((day, index) => {
        const x = pad.left + index * slot + 1;
        const top = y(day.blocked);
        const h = Math.max(0, height - pad.bottom - top);
        return (
          <g key={day.date}>
            {h > 0 && <path className="dash__mark" d={roundedTop(x, top, bar, h, Math.min(4, bar / 2))} />}
            <rect className="dash__hit" x={x - 1} y={pad.top} width={slot} height={height - pad.top - pad.bottom}
              onMouseMove={(event) => onHover(event, <><strong>{shortDate(day.date)}</strong><br />{day.blocked} golpes barrados</>)}
              onMouseLeave={onLeave} />
            {index % 5 === 0 && <text className="dash__axis" x={x + bar / 2} y={height - 6} textAnchor="middle">{shortDate(day.date)}</text>}
            {day === peak && day.blocked > 0 && (
              <text className="dash__value" x={x + bar / 2} y={top - 5} textAnchor="middle">{day.blocked}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

interface RankRow {
  key: string;
  label: string;
  value: number;
  tip: ReactNode;
}

/** Horizontal ranked bars with the value at the end of each bar. */
function RankBars({ rows, onHover, onLeave, wideLabels }: { rows: RankRow[]; onHover: HoverHandler; onLeave: () => void; wideLabels?: boolean }) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  if (!rows.length) return <p className="dash__empty">Sem golpes barrados no período.</p>;
  return (
    <ul className={`dash__rank${wideLabels ? " dash__rank--wide" : ""}`}>
      {rows.map((row) => (
        <li key={row.key} onMouseMove={(event) => onHover(event, row.tip)} onMouseLeave={onLeave}>
          <span className="dash__rank-label">{row.label}</span>
          <span className="dash__rank-track">
            <span className="dash__rank-bar" style={{ width: `${(row.value / max) * 100}%` }} />
          </span>
          <span className="dash__rank-value">{number(row.value)}</span>
        </li>
      ))}
    </ul>
  );
}

/** Bar path with rounded top corners and a square base on the axis. */
function roundedTop(x: number, y: number, w: number, h: number, r: number): string {
  const radius = Math.min(r, h);
  return `M${x},${y + h}V${y + radius}Q${x},${y} ${x + radius},${y}H${x + w - radius}Q${x + w},${y} ${x + w},${y + radius}V${y + h}Z`;
}
