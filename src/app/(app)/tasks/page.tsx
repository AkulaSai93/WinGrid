"use client";

import { ClipboardList, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { TaskModal, TaskRow } from "@/components/crm";
import { FilterMenu } from "@/components/popover";
import { Timeline } from "@/components/timeline";
import { Button, Card, EmptyState, Input, Tabs } from "@/components/ui";
import { useScoped } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import { useNow } from "@/lib/use-now";
import { BUCKET_LABEL, type TaskBucket, taskBucket } from "@/lib/tasks";
import type { ActivityType, TaskType } from "@/lib/types";
import { cn } from "@/lib/utils";

type View = "open" | "overdue" | "today" | "upcoming" | "completed" | "all";
const VIEWS: { value: View; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "overdue", label: "Overdue" },
  { value: "today", label: "Today" },
  { value: "upcoming", label: "Upcoming" },
  { value: "completed", label: "Completed" },
  { value: "all", label: "All" },
];

export default function TasksPage() {
  const { user, orgUsers } = useStore();
  const { tasks, activities, leads } = useScoped();
  const [tab, setTab] = useState<"tasks" | "activity">("tasks");
  const [view, setView] = useState<View>("open");
  const [owners, setOwners] = useState<string[]>([]);
  const [types, setTypes] = useState<TaskType[]>([]);
  const [q, setQ] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [actTypes, setActTypes] = useState<ActivityType[]>([]);
  const [limit, setLimit] = useState(40);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- deep link from dashboard drill-down */
    const sp = new URLSearchParams(window.location.search);
    const v = sp.get("view") as View | null;
    if (v && VIEWS.some((x) => x.value === v)) setView(v);
    const o = sp.get("owner");
    if (o) setOwners([o]);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const now = useNow();
  const withBucket = useMemo(() => tasks.map((t) => ({ t, b: taskBucket(t, now) })), [tasks, now]);
  const counts = useMemo(() => {
    const c: Record<View, number> = { open: 0, overdue: 0, today: 0, upcoming: 0, completed: 0, all: 0 };
    for (const { t, b } of withBucket) {
      if (owners.length && !owners.includes(t.ownerId)) continue;
      c.all++;
      c[b]++;
      if (b !== "completed") c.open++;
    }
    return c;
  }, [withBucket, owners]);

  const filtered = withBucket
    .filter(({ t, b }) => {
      if (owners.length && !owners.includes(t.ownerId)) return false;
      if (types.length && !types.includes(t.type)) return false;
      if (q.trim() && !t.title.toLowerCase().includes(q.trim().toLowerCase())) return false;
      if (view === "all") return true;
      if (view === "open") return b !== "completed";
      return b === view;
    })
    .sort((a, b) => (view === "completed" ? new Date(b.t.completedAt!).getTime() - new Date(a.t.completedAt!).getTime() : new Date(a.t.dueAt).getTime() - new Date(b.t.dueAt).getTime()));

  const groups: TaskBucket[] = view === "open" || view === "all" ? ["overdue", "today", "upcoming", ...(view === "all" ? (["completed"] as TaskBucket[]) : [])] : [view as TaskBucket];

  const leadIds = useMemo(() => new Set(leads.map((l) => l.id)), [leads]);
  const actFeed = activities
    .filter((a) => a.leadId && leadIds.has(a.leadId) && a.type !== "system")
    .filter((a) => !actTypes.length || actTypes.includes(a.type))
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  const teamUsers = orgUsers.filter((u) => (u.role === "exec" || u.role === "manager") && (user?.role !== "manager" || u.teamId === user.teamId));

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tasks & Activities</h1>
          <p className="mt-0.5 text-sm text-muted">Follow-ups to do, and the history of what&apos;s been done.</p>
        </div>
        <div className="flex gap-2">
          <Tabs value={tab} onChange={setTab} items={[{ value: "tasks", label: "Tasks" }, { value: "activity", label: "Activity log" }]} />
          <Button variant="primary" onClick={() => setNewOpen(true)}>
            <Plus className="size-4" /> Task
          </Button>
        </div>
      </div>

      {tab === "tasks" ? (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-1 rounded-lg border border-line bg-white p-0.5" role="tablist" aria-label="Task view">
              {VIEWS.map((v) => (
                <button key={v.value} type="button" role="tab" aria-selected={view === v.value} onClick={() => setView(v.value)} className={cn("flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium", view === v.value ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:text-slate-900")}>
                  {v.label}
                  <span className={cn("rounded px-1 text-[11px] tabular-nums", v.value === "overdue" && counts.overdue ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-500")}>{counts[v.value]}</span>
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-56">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-slate-400" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tasks" aria-label="Search tasks" className="h-8 pl-8 text-[13px]" />
            </div>
            <FilterMenu label="Type" value={types} onChange={setTypes} options={(["call", "email", "meeting", "todo"] as TaskType[]).map((t) => ({ value: t, label: t === "todo" ? "To-do" : t[0].toUpperCase() + t.slice(1) }))} />
            {user?.role !== "exec" && <FilterMenu label="Owner" value={owners} onChange={setOwners} options={teamUsers.map((u) => ({ value: u.id, label: u.name }))} />}
          </div>

          {filtered.length === 0 ? (
            <Card>
              <EmptyState icon={ClipboardList} title={tasks.length ? "No tasks in this view" : "No tasks yet"} description={tasks.length ? "Try another view or clear filters." : "Schedule follow-ups from a lead, or add a task here."} action={<Button onClick={() => setNewOpen(true)}>Add task</Button>} />
            </Card>
          ) : (
            <div className="space-y-4">
              {groups.map((g) => {
                const items = filtered.filter((x) => x.b === g);
                if (!items.length) return null;
                return (
                  <Card key={g}>
                    <div className={cn("flex items-center justify-between border-b border-line px-4 py-2.5 text-[13px] font-semibold", g === "overdue" ? "text-red-700" : "text-slate-800")}>
                      {BUCKET_LABEL[g]} <span className="font-normal text-muted">{items.length}</span>
                    </div>
                    <div className="divide-y divide-line">
                      {items.slice(0, 100).map(({ t }) => (
                        <TaskRow key={t.id} task={t} showOwner={user?.role !== "exec"} />
                      ))}
                    </div>
                    {items.length > 100 && <p className="border-t border-line px-4 py-2 text-xs text-muted">Showing 100 of {items.length}. Narrow with filters.</p>}
                  </Card>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="mb-3">
            <FilterMenu label="Activity type" value={actTypes} onChange={setActTypes} options={(["call", "email", "meeting", "note", "status", "stage"] as ActivityType[]).map((t) => ({ value: t, label: t[0].toUpperCase() + t.slice(1) }))} />
          </div>
          <Card className="p-4">
            <Timeline items={actFeed.slice(0, limit)} />
            {actFeed.length > limit && (
              <div className="mt-4 text-center">
                <Button onClick={() => setLimit((l) => l + 40)}>Load more</Button>
              </div>
            )}
          </Card>
        </>
      )}

      {newOpen && <TaskModal open onClose={() => setNewOpen(false)} />}
    </div>
  );
}
