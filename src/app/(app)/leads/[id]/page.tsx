"use client";

import { ArrowLeft, Briefcase, Building2, CalendarPlus, Check, Mail, MapPin, MessageSquarePlus, Pencil, Phone, Tag, Trash2, UserRound } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { LogActivityModal, TaskModal, TaskRow } from "@/components/crm";
import { LeadFormModal } from "@/components/lead-form";
import { OpportunityFormModal } from "@/components/opportunity-form";
import { RejectModal } from "@/components/reject-modal";
import { Timeline } from "@/components/timeline";
import { Avatar, Button, ButtonLink, Card, CardHeader, ConfirmDialog, EmptyState, IconButton, LeadStatusBadge, Select, StageBadge, Tabs } from "@/components/ui";
import { can } from "@/lib/permissions";
import { useScoped, useUserName } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import type { ActivityType, LeadStatus } from "@/lib/types";
import { cn, formatDate, formatMoney, relativeTime } from "@/lib/utils";

const STEPS: LeadStatus[] = ["new", "contacted", "qualified", "converted"];

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { db, user, orgId, orgUsers, settings, setLeadStatus, assignLeads, deleteLeads, toast } = useStore();
  const { leads, stageById } = useScoped();
  const name = useUserName();
  const [tab, setTab] = useState<"timeline" | "tasks" | "opps">("timeline");
  const [actType, setActType] = useState<ActivityType | null>(null);
  const [taskOpen, setTaskOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const lead = leads.find((l) => l.id === id);
  const existsInOrg = db.leads.some((l) => l.id === id && l.orgId === orgId);

  if (!lead) {
    return (
      <Card className="mx-auto mt-10 max-w-lg">
        <EmptyState
          icon={UserRound}
          title={existsInOrg ? "You don't have access to this lead" : "Lead not found"}
          description={existsInOrg ? "It's owned by someone outside your visibility scope. Ask your manager to reassign it if you need to work on it." : "It may have been deleted, or the link is incorrect."}
          action={<ButtonLink href="/leads">Back to leads</ButtonLink>}
        />
      </Card>
    );
  }

  const activities = db.activities.filter((a) => a.leadId === lead.id);
  const tasks = db.tasks.filter((t) => t.leadId === lead.id).sort((a, b) => Number(!!a.completedAt) - Number(!!b.completedAt) || new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
  const openTasks = tasks.filter((t) => !t.completedAt);
  const opps = db.opportunities.filter((o) => o.leadId === lead.id);
  const fullName = `${lead.firstName} ${lead.lastName}`.trim();
  const canEdit = can(user, "lead.edit");
  const stepIndex = STEPS.indexOf(lead.status);
  const sellers = orgUsers.filter((u) => u.status === "active" && (u.role === "exec" || u.role === "manager"));

  const changeStatus = (s: LeadStatus) => {
    if (s === lead.status) return;
    if (s === "converted") return setConvertOpen(true);
    if (s === "rejected") return setRejectOpen(true);
    setLeadStatus([lead.id], s);
    toast(`Status set to ${s}`);
  };

  return (
    <div className="space-y-4">
      <Link href="/leads" className="inline-flex items-center gap-1 text-[13px] font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft className="size-4" /> Leads
      </Link>

      {/* Header */}
      <Card className="p-4">
        <div className="flex flex-wrap items-start gap-4">
          <Avatar name={fullName} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{fullName}</h1>
              <LeadStatusBadge status={lead.status} />
              {lead.status === "rejected" && lead.rejectReason && <span className="text-xs text-muted">({lead.rejectReason})</span>}
            </div>
            <p className="mt-0.5 text-sm text-muted">
              {[lead.jobTitle, lead.company].filter(Boolean).join(" at ") || "No company"} · Owner: <span className="font-medium text-slate-700">{name(lead.ownerId)}</span> · Last activity {relativeTime(lead.updatedAt)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {lead.phone && (
              <Button onClick={() => setActType("call")}>
                <Phone className="size-4" /> Log call
              </Button>
            )}
            {lead.email && (
              <Button
                onClick={() => {
                  window.location.href = `mailto:${lead.email}`;
                  setActType("email");
                }}
              >
                <Mail className="size-4" /> Email
              </Button>
            )}
            <Button onClick={() => setActType("note")}>
              <MessageSquarePlus className="size-4" /> Note
            </Button>
            <Button onClick={() => setTaskOpen(true)}>
              <CalendarPlus className="size-4" /> Follow-up
            </Button>
            {lead.status !== "converted" && can(user, "opp.create") && (
              <Button variant="primary" onClick={() => setConvertOpen(true)}>
                Convert
              </Button>
            )}
            {canEdit && (
              <IconButton label="Edit lead" onClick={() => setEditOpen(true)}>
                <Pencil className="size-4" />
              </IconButton>
            )}
            {can(user, "lead.delete") && (
              <IconButton label="Delete lead" onClick={() => setDeleteOpen(true)} className="hover:bg-red-50 hover:text-red-600">
                <Trash2 className="size-4" />
              </IconButton>
            )}
          </div>
        </div>

        {/* Status path */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <ol className="flex flex-1 overflow-hidden rounded-lg border border-line" aria-label="Lead status">
            {STEPS.map((s, i) => {
              const done = lead.status !== "rejected" && i < stepIndex;
              const current = s === lead.status;
              return (
                <li key={s} className="flex-1">
                  <button
                    type="button"
                    disabled={!canEdit}
                    onClick={() => changeStatus(s)}
                    aria-current={current ? "step" : undefined}
                    className={cn(
                      "flex h-9 w-full items-center justify-center gap-1.5 border-r border-line text-[13px] font-medium capitalize transition-colors last:border-r-0",
                      current ? "bg-brand-600 text-white" : done ? "bg-brand-50 text-brand-700" : "bg-white text-slate-500 hover:bg-slate-50",
                    )}
                  >
                    {done && <Check className="size-3.5" />}
                    {s}
                  </button>
                </li>
              );
            })}
          </ol>
          {canEdit && lead.status !== "rejected" && lead.status !== "converted" && (
            <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => setRejectOpen(true)}>
              Reject
            </Button>
          )}
          {lead.status === "rejected" && canEdit && (
            <Button size="sm" onClick={() => changeStatus("contacted")}>
              Reopen
            </Button>
          )}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        {/* Details */}
        <div className="space-y-4">
          <Card>
            <CardHeader title="Details" />
            <dl className="divide-y divide-line text-sm">
              {[
                { icon: Mail, label: "Email", value: lead.email ? <a href={`mailto:${lead.email}`} className="text-brand-600 hover:underline">{lead.email}</a> : "—" },
                { icon: Phone, label: "Phone", value: lead.phone ? <a href={`tel:${lead.phone.replace(/\s/g, "")}`} className="text-brand-600 hover:underline">{lead.phone}</a> : "—" },
                { icon: Building2, label: "Company", value: lead.company || "—" },
                { icon: Briefcase, label: "Job title", value: lead.jobTitle || "—" },
                { icon: MapPin, label: "City", value: lead.city || "—" },
                { icon: Tag, label: "Source", value: lead.source },
              ].map((r) => (
                <div key={r.label} className="flex items-center gap-3 px-4 py-2.5">
                  <r.icon className="size-4 shrink-0 text-slate-400" aria-hidden />
                  <dt className="w-20 shrink-0 text-muted">{r.label}</dt>
                  <dd className="min-w-0 truncate text-slate-800">{r.value}</dd>
                </div>
              ))}
              <div className="flex items-center gap-3 px-4 py-2.5">
                <UserRound className="size-4 shrink-0 text-slate-400" aria-hidden />
                <dt className="w-20 shrink-0 text-muted">Owner</dt>
                <dd className="min-w-0 flex-1">
                  {can(user, "lead.assign") ? (
                    <Select
                      aria-label="Lead owner"
                      className="h-8 text-[13px]"
                      value={lead.ownerId ?? ""}
                      onChange={(e) => {
                        assignLeads([lead.id], e.target.value || null);
                        toast(`Assigned to ${e.target.value ? name(e.target.value) : "nobody"}`);
                      }}
                    >
                      <option value="">Unassigned</option>
                      {sellers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    name(lead.ownerId)
                  )}
                </dd>
              </div>
            </dl>
            <p className="border-t border-line px-4 py-2.5 text-xs text-muted">Created {formatDate(lead.createdAt)}</p>
          </Card>

          <Card>
            <CardHeader title="Next follow-up" />
            {openTasks[0] ? (
              <TaskRow task={openTasks[0]} />
            ) : (
              <div className="px-4 py-4 text-sm text-muted">
                Nothing scheduled.{" "}
                <button type="button" onClick={() => setTaskOpen(true)} className="font-medium text-brand-600 hover:underline">
                  Schedule one
                </button>
              </div>
            )}
          </Card>
        </div>

        {/* Activity */}
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2.5">
            <Tabs
              value={tab}
              onChange={setTab}
              items={[
                { value: "timeline", label: `Timeline (${activities.length})` },
                { value: "tasks", label: `Tasks (${openTasks.length} open)` },
                { value: "opps", label: `Opportunities (${opps.length})` },
              ]}
            />
            <Button size="sm" onClick={() => setActType("call")}>
              Log activity
            </Button>
          </div>
          <div className="p-4">
            {tab === "timeline" && <Timeline items={activities} />}
            {tab === "tasks" &&
              (tasks.length ? (
                <div className="-mx-4 -my-4 divide-y divide-line">
                  {tasks.map((t) => (
                    <TaskRow key={t.id} task={t} showOwner />
                  ))}
                </div>
              ) : (
                <EmptyState title="No tasks for this lead" action={<Button onClick={() => setTaskOpen(true)}>Schedule follow-up</Button>} />
              ))}
            {tab === "opps" &&
              (opps.length ? (
                <ul className="-mx-4 -my-4 divide-y divide-line">
                  {opps.map((o) => {
                    const st = stageById.get(o.stageId);
                    return (
                      <li key={o.id}>
                        <Link href={`/opportunities?open=${o.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50">
                          <span>
                            <span className="block text-sm font-medium">{o.name}</span>
                            <span className="text-xs text-muted">Close {formatDate(o.closeDate)}</span>
                          </span>
                          <span className="flex items-center gap-3">
                            <span className="text-sm font-semibold tabular-nums">{formatMoney(o.value)}</span>
                            {st && <StageBadge name={st.name} kind={st.kind} />}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <EmptyState title="No opportunities yet" description="Convert this lead when it's qualified to start tracking a deal." action={lead.status !== "converted" && can(user, "opp.create") && <Button variant="primary" onClick={() => setConvertOpen(true)}>Convert to opportunity</Button>} />
              ))}
          </div>
        </Card>
      </div>

      {actType && <LogActivityModal open onClose={() => setActType(null)} leadId={lead.id} initialType={actType} />}
      {taskOpen && <TaskModal open onClose={() => setTaskOpen(false)} leadId={lead.id} defaultTitle={`Call ${lead.firstName}`} />}
      {editOpen && <LeadFormModal open onClose={() => setEditOpen(false)} lead={lead} />}
      {convertOpen && <OpportunityFormModal open onClose={() => setConvertOpen(false)} lead={lead} onDone={() => setTab("opps")} />}
      <RejectModal open={rejectOpen} onClose={() => setRejectOpen(false)} reasons={settings?.rejectReasons ?? []} onConfirm={(r) => { setLeadStatus([lead.id], "rejected", r); toast("Lead rejected"); }} />
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => { deleteLeads([lead.id]); toast("Lead deleted"); router.push("/leads"); }}
        title="Delete this lead?"
        message={`${fullName} and their open tasks will be removed for everyone. This is recorded in the audit log and can't be undone.`}
        confirmLabel="Delete lead"
        danger
      />
    </div>
  );
}
