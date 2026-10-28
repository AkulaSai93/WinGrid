"use client";

import { ArrowRight, PhoneCall, Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { BarRow, Kpi, TaskModal, TaskRow } from "@/components/crm";
import { Avatar, Button, ButtonLink, Card, CardHeader, EmptyState, LeadStatusBadge } from "@/components/ui";
import { can, ROLE_LABEL } from "@/lib/permissions";
import { useScoped, useUserName } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import { useNow } from "@/lib/use-now";
import { taskBucket } from "@/lib/tasks";
import type { LeadStatus } from "@/lib/types";
import { formatMoneyCompact, pct, relativeTime } from "@/lib/utils";

const DAY = 86_400_000;

export default function DashboardPage() {
  const { user, org, orgUsers } = useStore();
  const { leads, opportunities, tasks, activities, stageById } = useScoped();
  const name = useUserName();
  const [taskOpen, setTaskOpen] = useState(false);
  const now = useNow();

  const stats = useMemo(() => {
    const newThisWeek = leads.filter((l) => now - new Date(l.createdAt).getTime() < 7 * DAY).length;
    const newPrevWeek = leads.filter((l) => {
      const age = now - new Date(l.createdAt).getTime();
      return age >= 7 * DAY && age < 14 * DAY;
    }).length;
    const open = opportunities.filter((o) => stageById.get(o.stageId)?.kind === "open");
    const openValue = open.reduce((s, o) => s + o.value, 0);
    const closed90 = opportunities.filter((o) => stageById.get(o.stageId)?.kind !== "open" && now - new Date(o.updatedAt).getTime() < 90 * DAY);
    const won90 = closed90.filter((o) => stageById.get(o.stageId)?.kind === "won");
    const openTasks = tasks.filter((t) => !t.completedAt);
    const overdue = openTasks.filter((t) => taskBucket(t, now) === "overdue");
    const today = openTasks.filter((t) => taskBucket(t, now) === "today");
    return { newThisWeek, newPrevWeek, open, openValue, closed90, won90, overdue, today };
  }, [leads, opportunities, tasks, stageById, now]);

  // Leads that have had no contact yet — the most important "next action" list.
  const untouched = useMemo(() => {
    const touched = new Set(activities.filter((a) => a.leadId && ["call", "email", "meeting"].includes(a.type)).map((a) => a.leadId));
    return leads
      .filter((l) => l.status === "new" && !touched.has(l.id))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(0, 6);
  }, [leads, activities]);

  const funnel: LeadStatus[] = ["new", "contacted", "qualified", "converted", "rejected"];
  const funnelCounts = funnel.map((s) => leads.filter((l) => l.status === s).length);
  const maxFunnel = Math.max(...funnelCounts, 1);

  const openStages = [...stageById.values()].filter((s) => s.kind === "open").sort((a, b) => a.order - b.order);
  const stageValues = openStages.map((s) => ({ s, value: stats.open.filter((o) => o.stageId === s.id).reduce((t, o) => t + o.value, 0), count: stats.open.filter((o) => o.stageId === s.id).length }));
  const maxStage = Math.max(...stageValues.map((x) => x.value), 1);

  const isTeamView = can(user, "analytics.team");
  const teamRows = useMemo(() => {
    if (!isTeamView) return [];
    const owners = [...new Set(tasks.map((t) => t.ownerId))];
    return owners
      .map((id) => {
        const mine = tasks.filter((t) => t.ownerId === id);
        const b = mine.map((t) => taskBucket(t, now));
        return { id, total: mine.length, overdue: b.filter((x) => x === "overdue").length, today: b.filter((x) => x === "today").length, pending: b.filter((x) => x !== "completed").length, completed: b.filter((x) => x === "completed").length };
      })
      .sort((a, b) => b.overdue - a.overdue || b.pending - a.pending);
  }, [tasks, isTeamView, now]);

  const priorityTasks = [...stats.overdue, ...stats.today].sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()).slice(0, 8);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const scopeLabel = user?.role === "exec" ? "your" : user?.role === "manager" ? "your team's" : `${org?.name ?? "the organization"}'s`;
  const winRate = pct(stats.won90.length, stats.closed90.length);
  const delta = stats.newThisWeek - stats.newPrevWeek;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {greeting}, {user?.name.split(" ")[0]}
          </h1>
          <p className="mt-0.5 text-sm text-muted">
            Showing {scopeLabel} work · {user ? ROLE_LABEL[user.role] : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setTaskOpen(true)}>
            <Plus className="size-4" /> Task
          </Button>
          {can(user, "lead.create") && (
            <ButtonLink href="/leads?new=1" variant="primary">
              <Plus className="size-4" /> Lead
            </ButtonLink>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label="New leads · 7 days" value={stats.newThisWeek} sub={`${delta >= 0 ? "+" : ""}${delta} vs previous 7 days`} href="/leads" />
        <Kpi label="Awaiting first contact" value={leads.filter((l) => l.status === "new").length} sub="Leads in New status" href="/leads?status=new" />
        <Kpi label="Open pipeline" value={formatMoneyCompact(stats.openValue)} sub={`${stats.open.length} open opportunities`} href="/opportunities" />
        <Kpi label="Win rate · 90 days" value={stats.closed90.length ? `${winRate}%` : "—"} sub={`${stats.won90.length} won of ${stats.closed90.length} closed`} href="/analytics" />
        <Kpi label="Overdue tasks" value={<span className={stats.overdue.length ? "text-red-600" : undefined}>{stats.overdue.length}</span>} sub={`${stats.today.length} due later today`} href="/tasks?view=overdue" />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Today's priorities" subtitle="Overdue and due-today follow-ups, oldest first" action={<Link href="/tasks" className="inline-flex shrink-0 items-center gap-1 text-[13px] font-medium whitespace-nowrap text-brand-600 hover:text-brand-700">All tasks <ArrowRight className="size-3.5" /></Link>} />
          {priorityTasks.length === 0 ? (
            <EmptyState title="You're all caught up" description="No overdue or due-today tasks. Schedule follow-ups from any lead to keep momentum." />
          ) : (
            <div className="divide-y divide-line">
              {priorityTasks.map((t) => (
                <TaskRow key={t.id} task={t} showOwner={user?.role !== "exec"} />
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Needs first contact" subtitle="New leads with no call, email or meeting yet" />
          {untouched.length === 0 ? (
            <EmptyState title="Every new lead has been contacted" />
          ) : (
            <ul className="divide-y divide-line">
              {untouched.map((l) => (
                <li key={l.id}>
                  <Link href={`/leads/${l.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50">
                    <Avatar name={`${l.firstName} ${l.lastName}`} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-800">
                        {l.firstName} {l.lastName}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {l.source} · {name(l.ownerId)}
                      </span>
                    </span>
                    <span className="text-xs text-muted">{relativeTime(l.createdAt)}</span>
                    <PhoneCall className="size-4 text-brand-500" aria-label="Open to call" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Lead funnel" subtitle={`${leads.length} leads by current status. Click a row to see them.`} />
          <div className="px-4 py-3">
            {funnel.map((s, i) => (
              <BarRow key={s} label={<LeadStatusBadge status={s} />} value={funnelCounts[i]} max={maxFunnel} href={`/leads?status=${s}`} display={`${funnelCounts[i]} · ${pct(funnelCounts[i], leads.length)}%`} tone={s === "rejected" ? "bg-red-300" : s === "converted" ? "bg-emerald-500" : "bg-brand-500"} />
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title="Open pipeline by stage" subtitle="Total value of open opportunities" action={<Link href="/opportunities" className="text-[13px] font-medium text-brand-600 hover:text-brand-700">Board</Link>} />
          <div className="px-4 py-3">
            {stageValues.map(({ s, value, count }) => (
              <BarRow key={s.id} label={s.name} value={value} max={maxStage} display={`${formatMoneyCompact(value)} · ${count}`} href="/opportunities" />
            ))}
          </div>
        </Card>
      </div>

      {isTeamView && (
        <Card>
          <CardHeader title="Team task summary" subtitle="Click a number to open the matching tasks" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-line bg-white text-left text-[11px] font-semibold tracking-[0.06em] text-slate-400 uppercase">
                <tr>
                  <th className="px-4 py-2 font-medium">Owner</th>
                  {["Total", "Overdue", "Due today", "Pending", "Completed"].map((h) => (
                    <th key={h} className="px-4 py-2 text-right font-medium">
                      {h}
                    </th>
                  ))}
                  <th className="px-4 py-2 font-medium">Completion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {teamRows.map((r) => {
                  const u = orgUsers.find((x) => x.id === r.id);
                  const cell = (n: number, view: string, red?: boolean) => (
                    <td className="px-4 py-2 text-right tabular-nums">
                      <Link href={`/tasks?owner=${r.id}&view=${view}`} className={red && n > 0 ? "font-semibold text-red-600 hover:underline" : "text-slate-700 hover:text-brand-600 hover:underline"}>
                        {n}
                      </Link>
                    </td>
                  );
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-2">
                        <span className="flex items-center gap-2">
                          <Avatar name={name(r.id)} size="sm" />
                          <span className="font-medium text-slate-800">{name(r.id)}</span>
                          {u && u.status !== "active" && <span className="text-xs text-muted">({u.status})</span>}
                        </span>
                      </td>
                      {cell(r.total, "all")}
                      {cell(r.overdue, "overdue", true)}
                      {cell(r.today, "today")}
                      {cell(r.pending, "open")}
                      {cell(r.completed, "completed")}
                      <td className="px-4 py-2">
                        <span className="flex items-center gap-2">
                          <span className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                            <span className="block h-full rounded-full bg-emerald-500" style={{ width: `${pct(r.completed, r.total)}%` }} />
                          </span>
                          <span className="text-xs text-muted tabular-nums">{pct(r.completed, r.total)}%</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <TaskModal open={taskOpen} onClose={() => setTaskOpen(false)} />
    </div>
  );
}
