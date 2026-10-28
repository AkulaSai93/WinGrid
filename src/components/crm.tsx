"use client";

import { CalendarClock, CheckSquare, FileText, Mail, Phone, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge, Button, Checkbox, Field, Input, Modal, Select, Textarea } from "@/components/ui";
import { can } from "@/lib/permissions";
import { useUserName } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import { taskBucket } from "@/lib/tasks";
import type { ActivityType, Task, TaskType } from "@/lib/types";
import { cn, formatDateTime } from "@/lib/utils";

export const TASK_ICON: Record<TaskType, React.ComponentType<{ className?: string }>> = {
  call: Phone,
  email: Mail,
  meeting: Users,
  todo: CheckSquare,
};

export function TaskRow({ task, showOwner, compact }: { task: Task; showOwner?: boolean; compact?: boolean }) {
  const { toggleTask, db, toast } = useStore();
  const name = useUserName();
  const bucket = taskBucket(task);
  const Icon = TASK_ICON[task.type];
  const lead = task.leadId ? db.leads.find((l) => l.id === task.leadId) : null;
  return (
    <div className={cn("flex items-center gap-3 px-4", compact ? "py-2" : "py-2.5")}>
      <Checkbox
        checked={!!task.completedAt}
        onChange={() => {
          toggleTask(task.id);
          toast(task.completedAt ? "Task reopened" : "Task completed");
        }}
        aria-label={`Mark "${task.title}" ${task.completedAt ? "not done" : "done"}`}
      />
      <Icon className="size-4 shrink-0 text-slate-400" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm", task.completedAt ? "text-slate-400 line-through" : "text-slate-800")}>{task.title}</p>
        <p className="truncate text-xs text-muted">
          {lead ? (
            <Link href={`/leads/${lead.id}`} className="hover:text-brand-600 hover:underline">
              {lead.firstName} {lead.lastName}
            </Link>
          ) : (
            "No linked record"
          )}
          {showOwner && <> · {name(task.ownerId)}</>}
          <span className={cn("sm:hidden", bucket === "overdue" && "text-red-600")}> · {formatDateTime(task.dueAt)}</span>
        </p>
      </div>
      {task.priority === "high" && !task.completedAt && <Badge tone="amber">High</Badge>}
      <span className={cn("hidden shrink-0 text-xs whitespace-nowrap tabular-nums sm:inline", bucket === "overdue" ? "font-medium text-red-600" : bucket === "today" ? "font-medium text-brand-700" : "text-muted")}>
        {bucket === "overdue" && "Overdue · "}
        {formatDateTime(task.dueAt)}
      </span>
    </div>
  );
}

function defaultDue() {
  const d = new Date(Date.now() + 86_400_000);
  d.setHours(10, 0, 0, 0);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 16);
}

export function TaskModal({ open, onClose, leadId = null, oppId = null, defaultTitle = "" }: { open: boolean; onClose: () => void; leadId?: string | null; oppId?: string | null; defaultTitle?: string }) {
  const { user, orgUsers, createTask, toast } = useStore();
  const [title, setTitle] = useState(defaultTitle);
  const [type, setType] = useState<TaskType>("call");
  const [due, setDue] = useState(defaultDue);
  const [priority, setPriority] = useState<Task["priority"]>("normal");
  const [ownerId, setOwnerId] = useState(user?.id ?? "");
  const [error, setError] = useState("");
  const assignable = orgUsers.filter((u) => u.status === "active" && u.role !== "super_admin");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setError("Give the task a short title.");
    createTask({ title: title.trim(), type, dueAt: new Date(due).toISOString(), priority, ownerId: ownerId || user!.id, leadId, oppId });
    toast("Follow-up scheduled");
    setTitle("");
    setError("");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Schedule follow-up"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="task-form">
            Save task
          </Button>
        </>
      }
    >
      <form id="task-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Title" htmlFor="t-title" error={error} required>
            <Input id="t-title" value={title} onChange={(e) => setTitle(e.target.value)} aria-invalid={!!error} placeholder="e.g. Call back about fee structure" />
          </Field>
        </div>
        <Field label="Type" htmlFor="t-type">
          <Select id="t-type" value={type} onChange={(e) => setType(e.target.value as TaskType)}>
            <option value="call">Call</option>
            <option value="email">Email</option>
            <option value="meeting">Meeting</option>
            <option value="todo">To-do</option>
          </Select>
        </Field>
        <Field label="Due" htmlFor="t-due">
          <Input id="t-due" type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} />
        </Field>
        <Field label="Priority" htmlFor="t-pri">
          <Select id="t-pri" value={priority} onChange={(e) => setPriority(e.target.value as Task["priority"])}>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
          </Select>
        </Field>
        <Field label="Assign to" htmlFor="t-owner">
          <Select id="t-owner" value={ownerId} onChange={(e) => setOwnerId(e.target.value)} disabled={!can(user, "task.assignOthers")}>
            {assignable.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
                {u.id === user?.id ? " (me)" : ""}
              </option>
            ))}
          </Select>
        </Field>
      </form>
    </Modal>
  );
}

const ACT_TYPES: { value: ActivityType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "call", label: "Call", icon: Phone },
  { value: "email", label: "Email", icon: Mail },
  { value: "meeting", label: "Meeting", icon: Users },
  { value: "note", label: "Note", icon: FileText },
];

export function LogActivityModal({ open, onClose, leadId, oppId = null, initialType = "call" }: { open: boolean; onClose: () => void; leadId: string | null; oppId?: string | null; initialType?: ActivityType }) {
  const { logActivity, createTask, toast, user } = useStore();
  const [type, setType] = useState<ActivityType>(initialType);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [outcome, setOutcome] = useState("Connected");
  const [followUp, setFollowUp] = useState(true);
  const [due, setDue] = useState(defaultDue);
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === "note" && !body.trim()) return setError("Write the note before saving.");
    const defaultSubject = { call: "Call logged", email: "Email logged", meeting: "Meeting logged", note: "Note" }[type as "call"];
    logActivity({ leadId, oppId, type, subject: subject.trim() || defaultSubject, body: body.trim() || undefined, outcome: type === "call" ? outcome : undefined });
    if (followUp && type !== "note") {
      createTask({ title: `Follow up: ${subject.trim() || defaultSubject}`, type: "call", dueAt: new Date(due).toISOString(), priority: "normal", ownerId: user!.id, leadId, oppId });
    }
    toast(followUp && type !== "note" ? "Activity logged and follow-up scheduled" : "Activity logged");
    setSubject("");
    setBody("");
    setError("");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Log activity"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="act-form">
            Save activity
          </Button>
        </>
      }
    >
      <form id="act-form" onSubmit={submit} noValidate className="space-y-4">
        <div role="radiogroup" aria-label="Activity type" className="grid grid-cols-4 gap-2">
          {ACT_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              role="radio"
              aria-checked={type === t.value}
              onClick={() => setType(t.value)}
              className={cn("flex flex-col items-center gap-1 rounded-lg border py-2.5 text-xs font-medium", type === t.value ? "border-brand-500 bg-brand-50 text-brand-700" : "border-line text-slate-600 hover:bg-slate-50")}
            >
              <t.icon className="size-4" />
              {t.label}
            </button>
          ))}
        </div>
        {type !== "note" && (
          <Field label="Subject" htmlFor="a-subj">
            <Input id="a-subj" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={type === "call" ? "e.g. Discussed fees" : type === "email" ? "e.g. Sent brochure" : "e.g. Campus visit"} />
          </Field>
        )}
        {type === "call" && (
          <Field label="Outcome" htmlFor="a-out">
            <Select id="a-out" value={outcome} onChange={(e) => setOutcome(e.target.value)}>
              {["Connected", "No answer", "Busy", "Call back later", "Wrong number"].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </Select>
          </Field>
        )}
        <Field label={type === "note" ? "Note" : "Details"} htmlFor="a-body" error={error} required={type === "note"}>
          <Textarea id="a-body" value={body} onChange={(e) => setBody(e.target.value)} aria-invalid={!!error} rows={3} />
        </Field>
        {type !== "note" && (
          <div className="rounded-lg border border-line bg-slate-50/60 p-3">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Checkbox checked={followUp} onChange={(e) => setFollowUp(e.target.checked)} />
              <CalendarClock className="size-4 text-slate-400" /> Schedule next follow-up
            </label>
            {followUp && (
              <Input type="datetime-local" aria-label="Follow-up due" value={due} onChange={(e) => setDue(e.target.value)} className="mt-2" />
            )}
          </div>
        )}
      </form>
    </Modal>
  );
}

/** Horizontal bar used in dashboard/analytics; the value label keeps it readable without color. */
export function BarRow({ label, value, max, display, href, tone = "bg-brand-500" }: { label: React.ReactNode; value: number; max: number; display?: React.ReactNode; href?: string; tone?: string }) {
  const inner = (
    <>
      <span className="w-32 shrink-0 truncate text-[13px] text-slate-600">{label}</span>
      <span className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <span className={cn("absolute inset-y-0 left-0 rounded-full", tone)} style={{ width: `${max ? Math.max(2, (value / max) * 100) : 0}%` }} />
      </span>
      <span className="w-20 shrink-0 text-right text-[13px] font-medium text-slate-800 tabular-nums">{display ?? value}</span>
    </>
  );
  return href ? (
    <Link href={href} className="-mx-2 flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-slate-50">
      {inner}
    </Link>
  ) : (
    <div className="flex items-center gap-3 py-1.5">{inner}</div>
  );
}

export function Kpi({ label, value, sub, href }: { label: string; value: React.ReactNode; sub?: React.ReactNode; href?: string }) {
  const body = (
    <>
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </>
  );
  const cls = "block rounded-2xl border border-brand-100 bg-brand-50/60 px-4 py-4";
  return href ? (
    <Link href={href} className={cn(cls, "transition-colors hover:border-brand-300 hover:bg-brand-50")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
