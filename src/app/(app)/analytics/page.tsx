"use client";

import { ArrowDownRight, ArrowRightLeft, ArrowUpRight, Minus, Trophy, XCircle } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AreaChart, Donut, Segmented, SERIES, Sparkline } from "@/components/charts";
import { BarRow } from "@/components/crm";
import { Avatar, Card, EmptyState, Select } from "@/components/ui";
import { can } from "@/lib/permissions";
import { useScoped, useUserName } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import { useNow } from "@/lib/use-now";
import { cn, formatMoneyCompact, pct, relativeTime } from "@/lib/utils";

const DAY = 86_400_000;
type Range = 30 | 90 | 180 | 365;
const RANGES: { value: Range; label: string }[] = [
  { value: 30, label: "30D" },
  { value: 90, label: "90D" },
  { value: 180, label: "6M" },
  { value: 365, label: "1Y" },
];

const inRange = (iso: string, from: number, to: number) => {
  const t = new Date(iso).getTime();
  return t >= from && t < to;
};

export default function AnalyticsPage() {
  const { user, db, orgId } = useStore();
  const scoped = useScoped();
  const name = useUserName();
  const now = useNow();
  const [range, setRange] = useState<Range>(90);
  const [grain, setGrain] = useState<"week" | "month">("week");
  const [teamId, setTeamId] = useState("");
  const teams = db.teams.filter((t) => t.orgId === orgId);
  const canTeam = can(user, "analytics.team");

  // Team filter narrows every metric to records owned by that team's members.
  const f = useMemo(() => {
    const members = teamId ? new Set(db.users.filter((u) => u.teamId === teamId).map((u) => u.id)) : null;
    const ok = (owner: string | null) => !members || (owner !== null && members.has(owner));
    return {
      leads: scoped.leads.filter((l) => ok(l.ownerId)),
      opps: scoped.opportunities.filter((o) => ok(o.ownerId)),
      tasks: scoped.tasks.filter((t) => ok(t.ownerId)),
      acts: scoped.activities.filter((a) => ok(a.userId)),
    };
  }, [scoped, teamId, db.users]);

  const kind = (stageId: string) => scoped.stageById.get(stageId)?.kind;
  const from = now - range * DAY;
  const prevFrom = from - range * DAY;

  const period = (a: number, b: number) => {
    const leads = f.leads.filter((l) => inRange(l.createdAt, a, b));
    const converted = f.opps.filter((o) => o.leadId && inRange(o.createdAt, a, b)).length;
    const closed = f.opps.filter((o) => kind(o.stageId) !== "open" && inRange(o.updatedAt, a, b));
    const won = closed.filter((o) => kind(o.stageId) === "won");
    const due = f.tasks.filter((t) => inRange(t.dueAt, a, Math.min(b, now)));
    return { leads: leads.length, converted, convRate: pct(converted, leads.length), wonValue: won.reduce((t, o) => t + o.value, 0), won: won.length, closed: closed.length, taskRate: pct(due.filter((t) => t.completedAt).length, due.length), due: due.length };
  };
  const cur = period(from, now + 1);
  const prev = period(prevFrom, from);

  // Weekly sparklines (last 8 weeks) for the KPI tiles.
  const spark = Array.from({ length: 8 }, (_, i) => period(now - (8 - i) * 7 * DAY, now - (7 - i) * 7 * DAY + (i === 7 ? 1 : 0)));

  // Trend buckets
  const buckets = useMemo(() => {
    const out: { label: string; a: number; b: number }[] = [];
    if (grain === "week") {
      const count = Math.min(26, Math.max(4, Math.ceil(range / 7)));
      for (let i = count - 1; i >= 0; i--) {
        const b = now - i * 7 * DAY;
        out.push({ label: new Date(b - 6 * DAY).toLocaleDateString("en-IN", { day: "numeric", month: "short" }), a: b - 7 * DAY, b: b + 1 });
      }
    } else {
      const count = Math.min(12, Math.max(3, Math.ceil(range / 30)));
      const d = new Date(now);
      for (let i = count - 1; i >= 0; i--) {
        const start = new Date(d.getFullYear(), d.getMonth() - i, 1).getTime();
        const end = new Date(d.getFullYear(), d.getMonth() - i + 1, 1).getTime();
        out.push({ label: new Date(start).toLocaleDateString("en-IN", { month: "short" }), a: start, b: end });
      }
    }
    return out;
  }, [grain, range, now]);
  const trendLeads = buckets.map((k) => f.leads.filter((l) => inRange(l.createdAt, k.a, k.b)).length);
  const trendConv = buckets.map((k) => f.opps.filter((o) => o.leadId && inRange(o.createdAt, k.a, k.b)).length);

  // Revenue: won value by month (past) + weighted open pipeline by expected close month (forecast).
  const revenue = useMemo(() => {
    const d = new Date(now);
    const months = Array.from({ length: 9 }, (_, i) => {
      const start = new Date(d.getFullYear(), d.getMonth() - 5 + i, 1).getTime();
      const end = new Date(d.getFullYear(), d.getMonth() - 4 + i, 1).getTime();
      return { label: new Date(start).toLocaleDateString("en-IN", { month: "short" }), a: start, b: end };
    });
    const values = months.map((m, i) => {
      if (i <= 5) return f.opps.filter((o) => kind(o.stageId) === "won" && inRange(o.closeDate, m.a, m.b)).reduce((t, o) => t + o.value, 0);
      return f.opps.filter((o) => kind(o.stageId) === "open" && inRange(o.closeDate, m.a, m.b)).reduce((t, o) => t + (o.value * (scoped.stageById.get(o.stageId)?.probability ?? 0)) / 100, 0);
    });
    return { labels: months.map((m) => m.label), values };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.opps, now, scoped.stageById]);

  // Lead sources in range: top 5 + Other (never a generated 7th hue).
  const rangeLeads = f.leads.filter((l) => inRange(l.createdAt, from, now + 1));
  const bySource = Object.entries(rangeLeads.reduce<Record<string, number>>((m, l) => ((m[l.source] = (m[l.source] ?? 0) + 1), m), {})).sort((a, b) => b[1] - a[1]);
  const sourceSegs = [...bySource.slice(0, 5).map(([label, value], i) => ({ label, value, color: SERIES[i] })), ...(bySource.length > 5 ? [{ label: "Other", value: bySource.slice(5).reduce((t, [, v]) => t + v, 0), color: "#94a3b8" }] : [])];

  // Funnel
  const order = ["new", "contacted", "qualified", "converted"] as const;
  const reached = order.map((_, i) => (i === 0 ? rangeLeads.length : rangeLeads.filter((l) => l.status !== "rejected" && order.indexOf(l.status as (typeof order)[number]) >= i).length));

  // Pipeline health + loss reasons
  const openOpps = f.opps.filter((o) => kind(o.stageId) === "open");
  const pastClose = openOpps.filter((o) => new Date(o.closeDate).getTime() < now).length;
  const stale = openOpps.filter((o) => now - new Date(o.updatedAt).getTime() > 14 * DAY).length;
  const lost = f.opps.filter((o) => kind(o.stageId) === "lost" && inRange(o.updatedAt, from, now + 1));
  const lossReasons = Object.entries(lost.reduce<Record<string, number>>((m, o) => ((m[o.outcomeReason ?? "Unspecified"] = (m[o.outcomeReason ?? "Unspecified"] ?? 0) + 1), m), {})).sort((a, b) => b[1] - a[1]);

  // Latest pipeline events
  const oppById = new Map(f.opps.map((o) => [o.id, o]));
  const events = f.acts
    .filter((a) => a.type === "stage" && a.oppId && oppById.has(a.oppId))
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 6);

  // Team performance
  const owners = canTeam ? [...new Set([...rangeLeads.map((l) => l.ownerId), ...f.tasks.map((t) => t.ownerId)].filter(Boolean) as string[])] : [];
  const perf = owners
    .map((id) => {
      const ls = rangeLeads.filter((l) => l.ownerId === id);
      const closed = f.opps.filter((o) => o.ownerId === id && kind(o.stageId) !== "open" && inRange(o.updatedAt, from, now + 1));
      const won = closed.filter((o) => kind(o.stageId) === "won");
      const ts = f.tasks.filter((t) => t.ownerId === id && inRange(t.dueAt, from, now));
      return { id, leads: ls.length, contacted: pct(ls.filter((l) => l.status !== "new").length, ls.length), converted: ls.filter((l) => l.status === "converted").length, wonValue: won.reduce((t, o) => t + o.value, 0), winRate: closed.length ? pct(won.length, closed.length) : null, taskRate: ts.length ? pct(ts.filter((t) => t.completedAt).length, ts.length) : null, activities: f.acts.filter((a) => a.userId === id && ["call", "email", "meeting"].includes(a.type) && inRange(a.at, from, now + 1)).length };
    })
    .sort((a, b) => b.wonValue - a.wonValue);
  const maxWon = Math.max(...perf.map((p) => p.wonValue), 1);

  const scopeText = user?.role === "exec" ? "Your performance" : user?.role === "manager" ? "Your team's performance" : "Organization performance";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="mt-0.5 text-sm text-muted">{scopeText}, compared with the previous {range === 365 ? "year" : `${range} days`}.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canTeam && teams.length > 1 && user?.role !== "manager" && (
            <div className="w-44">
              <Select aria-label="Team" value={teamId} onChange={(e) => setTeamId(e.target.value)} className="h-8 text-[13px]">
                <option value="">All teams</option>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </Select>
            </div>
          )}
          <Segmented label="Date range" value={range} onChange={setRange} items={RANGES} />
        </div>
      </div>

      {/* KPI tiles with sparkline + delta vs previous period */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiSpark label="Leads created" value={cur.leads.toLocaleString("en-IN")} now={cur.leads} prev={prev.leads} spark={spark.map((s) => s.leads)} color={SERIES[0]} href="/leads" />
        <KpiSpark label="Lead → opportunity" value={`${cur.convRate}%`} now={cur.convRate} prev={prev.convRate} unit="pts" spark={spark.map((s) => s.convRate)} color={SERIES[2]} />
        <KpiSpark label="Won revenue" value={formatMoneyCompact(cur.wonValue)} now={cur.wonValue} prev={prev.wonValue} spark={spark.map((s) => s.wonValue)} color={SERIES[1]} sub={`${cur.won} won of ${cur.closed} closed`} href="/opportunities" />
        <KpiSpark label="Task completion" value={cur.due ? `${cur.taskRate}%` : "—"} now={cur.taskRate} prev={prev.taskRate} unit="pts" spark={spark.map((s) => s.taskRate)} color={SERIES[5]} href="/tasks" />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Leads & conversions" subtitle="New leads vs. leads converted to opportunities" className="xl:col-span-2" action={<Segmented label="Granularity" value={grain} onChange={setGrain} items={[{ value: "week", label: "Week" }, { value: "month", label: "Month" }]} />}>
          {trendLeads.some(Boolean) ? (
            <AreaChart labels={buckets.map((b) => b.label)} series={[{ name: "New leads", color: SERIES[0], values: trendLeads }, { name: "Converted", color: SERIES[2], values: trendConv }]} ariaLabel={`New leads and conversions by ${grain}`} height={320} />
          ) : (
            <EmptyState title="No leads in this period" />
          )}
        </Panel>

        <Panel title="Lead sources" subtitle={`${rangeLeads.length} leads in range`}>
          {sourceSegs.length ? <Donut segments={sourceSegs} centerValue={rangeLeads.length.toLocaleString("en-IN")} centerLabel="Total leads" /> : <EmptyState title="No leads in this period" />}
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Revenue & forecast" subtitle="Won revenue by close month; dashed months are weighted open pipeline" className="xl:col-span-2">
          <AreaChart labels={revenue.labels} series={[{ name: "Revenue", color: SERIES[0], values: revenue.values, dashFrom: 5 }]} format={formatMoneyCompact} ariaLabel="Monthly won revenue with three-month weighted forecast" height={220} />
          <div className="mt-3 grid grid-cols-3 divide-x divide-line rounded-lg border border-line text-center">
            <Stat label="Won (6 months)" value={formatMoneyCompact(revenue.values.slice(0, 6).reduce((a, b) => a + b, 0))} />
            <Stat label="Open pipeline" value={formatMoneyCompact(openOpps.reduce((t, o) => t + o.value, 0))} />
            <Stat label="Weighted next 3 mo." value={formatMoneyCompact(revenue.values.slice(6).reduce((a, b) => a + b, 0))} />
          </div>
        </Panel>

        <Panel title="Latest pipeline events" action={<Link href="/opportunities" className="rounded-lg border border-line px-2.5 py-1 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50">View all</Link>} flush>
          {events.length === 0 ? (
            <EmptyState title="No pipeline activity yet" />
          ) : (
            <ul className="divide-y divide-line">
              {events.map((e) => {
                const o = oppById.get(e.oppId!)!;
                const k = kind(o.stageId);
                const Icon = /→ Won|won/i.test(e.subject) ? Trophy : /→ Lost/i.test(e.subject) ? XCircle : ArrowRightLeft;
                return (
                  <li key={e.id}>
                    <Link href={`/opportunities?open=${o.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50">
                      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", Icon === Trophy ? "bg-emerald-50 text-emerald-600" : Icon === XCircle ? "bg-red-50 text-red-500" : "bg-brand-50 text-brand-600")}>
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-slate-900">{o.name}</span>
                        <span className="block truncate text-xs text-muted">{e.subject.replace(/^Opportunity /, "")}</span>
                      </span>
                      <span className="text-right">
                        <span className="block text-[13px] font-semibold text-slate-900 tabular-nums">{formatMoneyCompact(o.value)}</span>
                        <span className="block text-[11px] text-muted">{k === "won" ? "Won · " : k === "lost" ? "Lost · " : ""}{relativeTime(e.at, now)}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Conversion funnel" subtitle="Leads created in range that reached each step">
          <div className="space-y-2.5">
            {order.map((s, i) => (
              <div key={s} className="flex items-center gap-3">
                <span className="w-20 text-[13px] text-slate-600 capitalize">{i === 0 ? "Created" : s}</span>
                <div className="relative h-7 flex-1 rounded-md bg-slate-50">
                  <div className="absolute inset-y-0 left-0 flex items-center rounded-md px-2 text-xs font-semibold text-white" style={{ width: `${Math.max(9, pct(reached[i], reached[0] || 1))}%`, background: SERIES[0], opacity: 1 - i * 0.18 }}>
                    {reached[i]}
                  </div>
                </div>
                <span className="w-16 text-right text-xs text-muted tabular-nums">{i === 0 ? "100%" : `${pct(reached[i], reached[i - 1])}%`}</span>
              </div>
            ))}
            <p className="pt-1 text-xs text-muted">Right column: share that moved on from the previous step.</p>
          </div>
        </Panel>

        <Panel title="Pipeline health">
          <div className="grid grid-cols-2 gap-3">
            <HealthTile label="Open opportunities" value={openOpps.length} />
            <HealthTile label="Open value" value={formatMoneyCompact(openOpps.reduce((t, o) => t + o.value, 0))} />
            <HealthTile label="Past expected close" value={pastClose} tone={pastClose ? "red" : undefined} />
            <HealthTile label="No update in 14+ days" value={stale} tone={stale ? "amber" : undefined} />
          </div>
          {lossReasons.length > 0 && (
            <div className="mt-4">
              <p className="mb-1 text-xs font-medium text-muted">Why deals were lost</p>
              {lossReasons.slice(0, 4).map(([r, n]) => <BarRow key={r} label={r} value={n} max={lossReasons[0][1]} tone="bg-red-300" />)}
            </div>
          )}
        </Panel>
      </div>

      {canTeam && (
        <Panel title="Team performance" subtitle="Ranked by won revenue in range" flush>
          {perf.length === 0 ? (
            <EmptyState title="No activity in this period" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-[13px]">
                <thead className="border-b border-line bg-white text-left text-[11px] font-semibold tracking-[0.06em] text-slate-400 uppercase">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Owner</th>
                    {["Leads", "Contacted", "Converted", "Activities", "Win rate", "Tasks done"].map((h) => <th key={h} className="px-4 py-2.5 text-right font-medium">{h}</th>)}
                    <th className="w-56 px-4 py-2.5 font-medium">Won revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {perf.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-2.5"><span className="flex items-center gap-2"><Avatar name={name(r.id)} size="sm" /><span className="font-medium">{name(r.id)}</span></span></td>
                      <td className="px-4 py-2.5 text-right tabular-nums"><Link href={`/leads?owner=${r.id}`} className="hover:text-brand-600 hover:underline">{r.leads}</Link></td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{r.leads ? `${r.contacted}%` : "—"}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{r.converted}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{r.activities}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{r.winRate === null ? "—" : `${r.winRate}%`}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums"><Link href={`/tasks?owner=${r.id}&view=all`} className="hover:text-brand-600 hover:underline">{r.taskRate === null ? "—" : `${r.taskRate}%`}</Link></td>
                      <td className="px-4 py-2.5">
                        <span className="flex items-center gap-2">
                          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                            <span className="block h-full rounded-full" style={{ width: `${(r.wonValue / maxWon) * 100}%`, background: SERIES[0] }} />
                          </span>
                          <span className="w-16 text-right font-medium tabular-nums">{formatMoneyCompact(r.wonValue)}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}

function Panel({ title, subtitle, action, children, className, flush }: { title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode; className?: string; flush?: boolean }) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-4 pb-3">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className={cn("flex-1", flush ? "border-t border-line" : "px-5 pb-5")}>{children}</div>
    </Card>
  );
}

function KpiSpark({ label, value, now, prev, spark, color, unit, sub, href }: { label: string; value: string; now: number; prev: number; spark: number[]; color: string; unit?: "pts"; sub?: string; href?: string }) {
  const diff = unit === "pts" ? now - prev : prev ? Math.round(((now - prev) / prev) * 100) : now ? 100 : 0;
  const Icon = diff > 0 ? ArrowUpRight : diff < 0 ? ArrowDownRight : Minus;
  const body = (
    <>
      <p className="text-xs font-medium text-muted">{label}</p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <p className="text-2xl font-semibold tracking-tight whitespace-nowrap text-slate-900 tabular-nums">{value}</p>
        <Sparkline values={spark} color={color} className="-mb-1" />
      </div>
      <p className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs">
        <span className={cn("inline-flex items-center gap-0.5 rounded px-1 font-medium whitespace-nowrap", diff > 0 ? "bg-emerald-50 text-emerald-700" : diff < 0 ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600")}>
          <Icon className="size-3" aria-hidden />
          {diff > 0 ? "+" : ""}
          {diff}
          {unit === "pts" ? " pts" : "%"}
        </span>
        <span className="text-muted">{sub ?? "vs previous period"}</span>
      </p>
    </>
  );
  const cls = "block rounded-2xl border border-line bg-white px-4 py-4";
  return href ? (
    <Link href={href} className={cn(cls, "transition-colors hover:border-brand-300")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-2.5">
      <p className="text-[15px] font-semibold text-slate-900 tabular-nums">{value}</p>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  );
}

function HealthTile({ label, value, tone }: { label: string; value: React.ReactNode; tone?: "red" | "amber" }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2.5">
      <p className={cn("text-lg font-semibold tabular-nums", tone === "red" ? "text-red-600" : tone === "amber" ? "text-amber-700" : "text-slate-900")}>{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
