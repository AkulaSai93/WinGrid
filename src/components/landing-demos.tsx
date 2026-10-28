import { Check, Package, UserPlus } from "lucide-react";

/*
 * Illustrative mini-UIs for the landing feature cards. They render a sensible static state on the
 * server; `LandingMotion` animates them through `data-demo` / `data-*` hooks while on screen.
 */

const pill = (tone: string) => `inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[10px] font-medium whitespace-nowrap ${tone}`;
const cardShadow = "shadow-[0_0_0_1px_rgba(16,24,40,0.05)]";
const ROW = "grid grid-cols-[1.3fr_1fr_0.9fr] items-center gap-2 px-3 text-[12px] sm:grid-cols-[1.4fr_1fr_1fr_1fr] sm:px-4";

export function DemoTable() {
  const rows = [
    ["Rahul Nguyen", "Qualified", "bg-amber-50 text-amber-800", "Google Ads", "Suresh P."],
    ["Ethan Bose", "New", "bg-brand-50 text-brand-700", "Walk-in", "Karan M."],
    ["Pooja Patel", "Contacted", "bg-sky-50 text-sky-700", "Event", "Lakshmi R."],
    ["Diya Das", "Converted", "bg-emerald-50 text-emerald-700", "Website", "Lakshmi R."],
  ];
  // Fixed height: the incoming row pushes the oldest one out of view instead of growing the card.
  return (
    <div data-demo="table" className="h-[196px] overflow-hidden rounded-lg border border-line bg-white">
      <div className={`${ROW} border-b border-line bg-canvas/50 py-2 text-[10px] font-semibold tracking-[0.06em] text-slate-400 uppercase`}>
        <span>Name</span>
        <span>Status</span>
        <span className="hidden sm:block">Source</span>
        <span>Owner</span>
      </div>
      {/* Incoming lead: slides in, then its status flips New → Contacted */}
      <div data-new-row className="overflow-hidden">
        <div data-new-row-inner className={`${ROW} border-b border-line/70 bg-brand-50/70 py-2.5`}>
          <span className="flex items-center gap-1.5 truncate font-semibold">
            <span className="size-1.5 shrink-0 rounded-full bg-brand-500" /> Aarav Shah
          </span>
          <span className="relative h-5">
            <span data-status-a className={`absolute top-0 left-0 ${pill("bg-brand-50 text-brand-700")}`}>
              <span className="size-1 rounded-full bg-current" /> New
            </span>
            <span data-status-b className={`absolute top-0 left-0 opacity-0 ${pill("bg-sky-50 text-sky-700")}`}>
              <span className="size-1 rounded-full bg-current" /> Contacted
            </span>
          </span>
          <span className="hidden truncate text-slate-500 sm:block">Website</span>
          <span className="truncate text-slate-500">You</span>
        </div>
      </div>
      {rows.map(([n, s, t, src, o]) => (
        <div key={n} className={`${ROW} border-b border-line/70 py-2.5`}>
          <span className="truncate font-medium">{n}</span>
          <span>
            <span className={pill(t)}>
              <span className="size-1 rounded-full bg-current" />
              {s}
            </span>
          </span>
          <span className="hidden truncate text-slate-500 sm:block">{src}</span>
          <span className="truncate text-slate-500">{o}</span>
        </div>
      ))}
    </div>
  );
}

export function DemoTasks() {
  const items: [string, string, string][] = [
    ["Call Tara Mehta", "Overdue", "text-rose-600"],
    ["Email brochure to Dev", "Today 11:00", "text-brand-700"],
    ["Campus visit: Neil", "Today 16:00", "text-brand-700"],
  ];
  return (
    <ul data-demo="tasks" className="space-y-2">
      {items.map(([t, d, c]) => (
        <li key={t} data-task className={`flex items-center gap-2.5 rounded-lg bg-white px-3 py-2.5 text-[12px] ${cardShadow}`}>
          <span className="relative flex size-4 shrink-0 items-center justify-center rounded border border-slate-300 bg-white">
            <span data-task-fill className="absolute inset-0 scale-0 rounded-lg bg-brand-600" />
            <Check data-task-check className="relative size-3 text-white opacity-0" strokeWidth={3} />
          </span>
          <span className="relative min-w-0 flex-1">
            <span data-task-label className="block truncate font-medium">
              {t}
            </span>
            <span data-task-strike className="absolute top-1/2 left-0 h-px w-full origin-left scale-x-0 bg-slate-400" />
          </span>
          <span data-task-due className={`shrink-0 text-[11px] font-medium ${c}`}>
            {d}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function DemoBoard() {
  return (
    <div data-demo="board" className="relative grid grid-cols-2 gap-2">
      <div className={`rounded-lg bg-white/70 p-2 ${cardShadow}`}>
        <p className="mb-1.5 flex items-center gap-1.5 px-1 text-[10px] font-semibold text-slate-600">
          <span className="size-1.5 rounded-full bg-brand-500" /> Proposal
        </p>
        <MiniDeal name="Orbit Retail" value="₹6,25,000" />
        <div data-drag-card className="relative z-10">
          <MiniDeal name="Cedar Finance" value="₹13,50,000" />
        </div>
      </div>
      <div data-won-col className={`rounded-lg bg-white/70 p-2 transition-colors ${cardShadow}`}>
        <p className="mb-1.5 flex items-center justify-between px-1 text-[10px] font-semibold text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-500" /> Won
          </span>
          <span data-won-badge className="flex items-center gap-0.5 rounded-sm bg-emerald-50 px-1.5 text-[9px] text-emerald-700 opacity-0">
            <Check className="size-2.5" /> Closed
          </span>
        </p>
        <MiniDeal name="Kite Logistics" value="₹13,30,000" />
      </div>
    </div>
  );
}

function MiniDeal({ name, value }: { name: string; value: string }) {
  return (
    <div data-deal className={`mb-1.5 rounded-lg bg-white px-2 py-1.5 text-[11px] font-medium ${cardShadow}`}>
      {name}
      <span className="block text-[10px] font-normal text-slate-400">{value}</span>
    </div>
  );
}

export const CHART_PATH = "M0,62 C25,58 35,40 60,44 C85,48 95,30 120,34 C145,38 160,18 185,20 C200,21 210,12 220,10";

export function DemoChart() {
  return (
    <div data-demo="chart" className="relative">
      <svg viewBox="0 0 220 90" className="w-full overflow-visible">
        <defs>
          <linearGradient id="lp-g" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#3c5490" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#3c5490" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[22, 50, 78].map((y) => (
          <line key={y} x1="0" x2="220" y1={y} y2={y} stroke="#e4e7ee" strokeDasharray="3 4" />
        ))}
        <path data-chart-area d={`${CHART_PATH} L220,90 L0,90 Z`} fill="url(#lp-g)" />
        <path data-chart-line d={CHART_PATH} fill="none" stroke="#3c5490" strokeWidth="2" strokeLinecap="round" />
        <path data-chart-line2 d="M0,78 C30,76 50,70 80,72 C110,74 130,64 160,62 C185,60 200,56 220,52" fill="none" stroke="#1baf7a" strokeWidth="2" strokeLinecap="round" />
        <line data-chart-cursor x1="185" x2="185" y1="4" y2="90" stroke="#94a3b8" strokeDasharray="2 3" />
        <circle data-chart-dot cx="185" cy="20" r="4.5" fill="#3c5490" stroke="white" strokeWidth="2" />
      </svg>
      <div data-chart-tip className="absolute top-0 left-0 rounded-lg bg-slate-900 px-2 py-1 text-[10px] whitespace-nowrap text-white shadow-lg" style={{ transform: "translate(150px, -6px)" }}>
        <span data-chart-value className="font-semibold tabular-nums">
          34
        </span>{" "}
        new leads
      </div>
    </div>
  );
}

export function DemoProducts() {
  const tones = ["bg-amber-100 text-amber-800", "bg-slate-200 text-slate-700", "bg-emerald-100 text-emerald-700", "bg-sky-100 text-sky-700"];
  const items: [string, string[]][] = [
    ["Catalyst", ["AD", "FS", "SP"]],
    ["IAIB", ["KM", "JT", "LR", "GD"]],
  ];
  return (
    <div data-demo="products" className="relative">
      <ul className="space-y-2">
        {items.map(([n, people], row) => (
          <li key={n} className={`flex items-center gap-2.5 rounded-lg bg-white px-3 py-2.5 ${cardShadow}`}>
            <span className={`flex size-7 items-center justify-center rounded-lg bg-white text-brand-600 ${cardShadow}`}>
              <Package className="size-3.5" />
            </span>
            <span className="flex-1 text-[13px] font-semibold">{n}</span>
            <span className="flex gap-0.5">
              {people.map((p, i) => (
                <span key={p} data-avatar={row === 1 ? "" : undefined} className={`flex size-5 items-center justify-center rounded-full text-[8px] font-semibold ${tones[i % 4]}`}>
                  {p}
                </span>
              ))}
            </span>
          </li>
        ))}
      </ul>
      <div data-product-toast className="pointer-events-none absolute -bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-sm bg-slate-900 px-2.5 py-1 text-[10px] font-medium whitespace-nowrap text-white opacity-0 shadow-lg">
        <UserPlus className="size-3" /> Lakshmi Rao added to IAIB
      </div>
    </div>
  );
}

export function DemoRoles() {
  const roles = [
    ["Super Admin", "All organizations"],
    ["Org Admin", "Whole organization"],
    ["Manager", "Team records"],
    ["Executive", "Own records"],
  ];
  return (
    <div data-demo="roles" className="grid grid-cols-2 gap-2">
      {roles.map(([r, s]) => (
        <span key={r} data-role className={`relative overflow-hidden rounded-lg bg-white px-3 py-2.5 text-left ${cardShadow}`}>
          <span data-role-glow className="absolute inset-0 rounded-lg bg-brand-50 opacity-0 ring-1 ring-brand-300 ring-inset" />
          <span className="relative block text-[13px] font-semibold">{r}</span>
          <span className="relative block text-[11px] text-slate-500">{s}</span>
        </span>
      ))}
    </div>
  );
}

export function DemoAudit() {
  const entries = [
    ["lead.assign", "Karan Malhotra → Anita Desai", "just now"],
    ["opp.stage", "Proposal → Won · Kite Logistics", "2m"],
    ["product.update", "IAIB: added Lakshmi Rao", "6m"],
    ["lead.import", "Imported 48 leads from CSV", "12m"],
  ];
  return (
    <div data-demo="audit" className="h-[132px] overflow-hidden">
      <ul data-audit-list className="space-y-2 text-[13px]">
        {entries.map(([a, d, t]) => (
          <li key={a} className={`flex h-[38px] items-center gap-2 rounded-lg bg-white px-3 ${cardShadow}`}>
            <span className="rounded-sm bg-brand-50 px-2 py-0.5 font-mono text-[11px] text-brand-700">{a}</span>
            <span className="min-w-0 flex-1 truncate text-slate-600">{d}</span>
            <span className="hidden shrink-0 text-[10px] text-slate-400 sm:inline">{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
