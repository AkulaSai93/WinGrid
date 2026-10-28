"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// Categorical order, validated for color-vision deficiency (worst adjacent ΔE 9.1).
// Low-contrast slots (3–5) always ship with visible labels/values in legends.
export const SERIES = ["#3c5490", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#2a9fd6"];

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Monotone cubic (Fritsch–Carlson): smooth like the reference, but never overshoots below zero. */
function monotonePath(pts: [number, number][]) {
  const n = pts.length;
  if (n === 0) return "";
  if (n === 1) return `M${pts[0][0]},${pts[0][1]}`;
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) m.push((pts[i + 1][1] - pts[i][1]) / (pts[i + 1][0] - pts[i][0]));
  const t: number[] = [m[0]];
  for (let i = 1; i < n - 1; i++) t.push(m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2);
  t.push(m[n - 2]);
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      t[i] = 0;
      t[i + 1] = 0;
      continue;
    }
    const a = t[i] / m[i];
    const b = t[i + 1] / m[i];
    const s = a * a + b * b;
    if (s > 9) {
      const tau = 3 / Math.sqrt(s);
      t[i] = tau * a * m[i];
      t[i + 1] = tau * b * m[i];
    }
  }
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const h = (pts[i + 1][0] - pts[i][0]) / 3;
    d += ` C${pts[i][0] + h},${pts[i][1] + t[i] * h} ${pts[i + 1][0] - h},${pts[i + 1][1] - t[i + 1] * h} ${pts[i + 1][0]},${pts[i + 1][1]}`;
  }
  return d;
}

function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
}

export type Series = { name: string; color: string; values: number[]; /** index from which the line is a projection (dashed) */ dashFrom?: number };

export function AreaChart({ labels, series, height = 240, format = (n) => n.toLocaleString("en-IN"), ariaLabel }: { labels: string[]; series: Series[]; height?: number; format?: (n: number) => string; ariaLabel: string }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const gid = useId().replace(/:/g, "");
  const pad = { top: 12, right: 12, bottom: 28, left: 44 };
  const w = Math.max(width, 200);
  const innerW = w - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const max = niceMax(Math.max(...series.flatMap((s) => s.values), 0));
  const n = labels.length;
  const x = (i: number) => pad.left + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (v: number) => pad.top + innerH - (v / max) * innerH;
  const ticks = [0, 0.5, 1].map((f) => f * max);
  const labelEvery = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(innerW / 64))));

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left - pad.left;
    setHover(Math.max(0, Math.min(n - 1, Math.round((px / innerW) * (n - 1)))));
  };

  const tipLeft = hover === null ? 0 : Math.min(Math.max(x(hover) + 12, 0), w - 168);

  return (
    <div ref={ref} className="relative w-full">
      {series.length > 1 && (
        <ul className="mb-2 flex flex-wrap gap-x-4 gap-y-1 px-1 text-xs text-slate-600">
          {series.map((s) => (
            <li key={s.name} className="flex items-center gap-1.5">
              <span className="h-0.5 w-3.5 rounded-full" style={{ background: s.color }} aria-hidden />
              {s.name}
            </li>
          ))}
        </ul>
      )}
      {width > 0 && (
        <svg
          width={w}
          height={height}
          role="img"
          aria-label={ariaLabel}
          tabIndex={0}
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
          onFocus={() => setHover(n - 1)}
          onBlur={() => setHover(null)}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") setHover((h) => Math.max(0, (h ?? n - 1) - 1));
            if (e.key === "ArrowRight") setHover((h) => Math.min(n - 1, (h ?? 0) + 1));
          }}
          className="block touch-none outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
        >
          <defs>
            {series.map((s, i) => (
              <linearGradient key={i} id={`${gid}-g${i}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.16} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.left} x2={w - pad.right} y1={y(t)} y2={y(t)} stroke="var(--color-line)" strokeDasharray={t === 0 ? undefined : "3 4"} />
              <text x={pad.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-slate-400 text-[10px]">
                {format(t)}
              </text>
            </g>
          ))}
          {labels.map((l, i) =>
            i % labelEvery === 0 || i === n - 1 ? (
              <text key={i} x={x(i)} y={height - 8} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"} className="fill-slate-400 text-[10px]">
                {l}
              </text>
            ) : null,
          )}
          {series.map((s, si) => {
            const pts = s.values.map((v, i) => [x(i), y(v)] as [number, number]);
            const split = s.dashFrom ?? pts.length - 1;
            const solid = pts.slice(0, split + 1);
            const dashed = pts.slice(split);
            const area = `${monotonePath(pts)} L${pts[pts.length - 1][0]},${y(0)} L${pts[0][0]},${y(0)} Z`;
            return (
              <g key={s.name}>
                <path d={area} fill={`url(#${gid}-g${si})`} />
                <path d={monotonePath(solid)} fill="none" stroke={s.color} strokeWidth={2} strokeLinecap="round" />
                {dashed.length > 1 && <path d={monotonePath(dashed)} fill="none" stroke={s.color} strokeWidth={2} strokeDasharray="5 5" strokeLinecap="round" />}
              </g>
            );
          })}
          {hover !== null && (
            <g pointerEvents="none">
              <line x1={x(hover)} x2={x(hover)} y1={pad.top} y2={pad.top + innerH} stroke="#94a3b8" strokeDasharray="3 3" />
              {series.map((s) => (
                <circle key={s.name} cx={x(hover)} cy={y(s.values[hover])} r={5} fill={s.color} stroke="white" strokeWidth={2} />
              ))}
            </g>
          )}
        </svg>
      )}
      {hover !== null && (
        <div className="pointer-events-none absolute top-6 z-10 w-40 rounded-lg border border-line bg-white px-3 py-2 text-xs shadow-lg" style={{ left: tipLeft }}>
          <p className="mb-1 text-muted">{labels[hover]}</p>
          {series.map((s) => (
            <p key={s.name} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="size-2 rounded-full" style={{ background: s.color }} aria-hidden />
                {s.name}
                {s.dashFrom !== undefined && hover > s.dashFrom ? " (forecast)" : ""}
              </span>
              <strong className="font-semibold text-slate-900 tabular-nums">{format(s.values[hover])}</strong>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export function Sparkline({ values, color = SERIES[0], className }: { values: number[]; color?: string; className?: string }) {
  const w = 96;
  const h = 36;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const pts = values.map((v, i) => [values.length <= 1 ? w / 2 : (i / (values.length - 1)) * (w - 8) + 4, h - 5 - ((v - min) / (max - min || 1)) * (h - 10)] as [number, number]);
  const last = pts[pts.length - 1];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden className={cn("shrink-0", className)}>
      <path d={monotonePath(pts)} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
      {last && <circle cx={last[0]} cy={last[1]} r={3.5} fill={color} stroke="white" strokeWidth={2} />}
    </svg>
  );
}

export function Donut({ segments, centerValue, centerLabel, format = (n) => n.toLocaleString("en-IN") }: { segments: { label: string; value: number; color: string; href?: string }[]; centerValue: string; centerLabel: string; format?: (n: number) => string }) {
  const [hover, setHover] = useState<number | null>(null);
  const total = segments.reduce((t, s) => t + s.value, 0) || 1;
  const size = 176;
  const r = 70;
  const stroke = 22;
  const c = 2 * Math.PI * r;
  const gap = segments.filter((s) => s.value > 0).length > 1 ? 3 : 0; // surface gap between fills
  const offsets = segments.map((_, i) => segments.slice(0, i).reduce((t, s) => t + (s.value / total) * c, 0));
  const active = hover !== null ? segments[hover] : null;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${centerLabel}: ${segments.map((s) => `${s.label} ${format(s.value)}`).join(", ")}`}>
          <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef0f4" strokeWidth={stroke} />
            {segments.map((s, i) => {
              const len = (s.value / total) * c;
              const dash = Math.max(0, len - gap);
              return (
                <circle
                  key={s.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={hover === i ? stroke + 4 : stroke}
                  strokeDasharray={`${dash} ${c - dash}`}
                  strokeDashoffset={-offsets[i]}
                  onPointerEnter={() => setHover(i)}
                  onPointerLeave={() => setHover(null)}
                  className="cursor-default transition-[stroke-width]"
                />
              );
            })}
          </g>
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">{active ? format(active.value) : centerValue}</span>
          <span className="max-w-24 truncate text-[11px] text-muted">{active ? active.label : centerLabel}</span>
        </div>
      </div>
      <ul className="grid w-full grid-cols-1 gap-y-1 text-[13px]">
        {segments.map((s, i) => (
          <li key={s.label} onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)} className={cn("flex items-center justify-between gap-2 rounded-md px-1.5 py-0.5", hover === i && "bg-slate-50")}>
            <span className="flex min-w-0 items-center gap-2 text-slate-600">
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: s.color }} aria-hidden />
              <span className="truncate">{s.label}</span>
            </span>
            <span className="font-medium text-slate-900 tabular-nums">
              {format(s.value)} <span className="font-normal text-muted">{Math.round((s.value / total) * 100)}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Segmented toggle in the style of Day / Week / Month controls. */
export function Segmented<T extends string | number>({ value, onChange, items, label }: { value: T; onChange: (v: T) => void; items: { value: T; label: string }[]; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg bg-slate-100/80 p-0.5">
      {items.map((it) => (
        <button
          key={String(it.value)}
          type="button"
          role="radio"
          aria-checked={value === it.value}
          onClick={() => onChange(it.value)}
          className={cn("h-7 rounded-md px-3 text-[12.5px] font-medium transition-colors", value === it.value ? "bg-white text-slate-900 shadow-sm ring-1 ring-line" : "text-slate-500 hover:text-slate-800")}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
