"use client";

import { CalendarDays, KanbanSquare, List, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LogActivityModal } from "@/components/crm";
import { OpportunityFormModal } from "@/components/opportunity-form";
import { FilterMenu } from "@/components/popover";
import { Timeline } from "@/components/timeline";
import { Avatar, Button, Card, Drawer, EmptyState, Field, Input, Modal, Select, StageBadge, Tabs } from "@/components/ui";
import { can } from "@/lib/permissions";
import { useScoped, useUserName } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import type { Opportunity, Stage } from "@/lib/types";
import { cn, formatDate, formatMoney, formatMoneyCompact } from "@/lib/utils";

export default function OpportunitiesPage() {
  const { user, stages, orgUsers, moveOpportunity, toast } = useStore();
  const { opportunities } = useScoped();
  const name = useUserName();
  const [mode, setMode] = useState<"board" | "list">("board");
  const [q, setQ] = useState("");
  const [owners, setOwners] = useState<string[]>([]);
  const [showClosed, setShowClosed] = useState(true);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);
  const [pendingMove, setPendingMove] = useState<{ opp: Opportunity; stage: Stage } | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deep link from search/lead detail
    setOpenId(new URLSearchParams(window.location.search).get("open"));
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return opportunities.filter((o) => (!s || o.name.toLowerCase().includes(s)) && (!owners.length || owners.includes(o.ownerId ?? "")));
  }, [opportunities, q, owners]);

  const visibleStages = stages.filter((s) => showClosed || s.kind === "open");
  const canEdit = can(user, "opp.edit");

  const requestMove = (opp: Opportunity, stageId: string) => {
    const stage = stages.find((s) => s.id === stageId);
    if (!stage || opp.stageId === stageId) return;
    if (stage.kind !== "open") setPendingMove({ opp, stage });
    else {
      moveOpportunity(opp.id, stageId);
      toast(`Moved to ${stage.name}`);
    }
  };

  const openOpp = filtered.find((o) => o.id === openId) ?? opportunities.find((o) => o.id === openId);
  const openTotal = filtered.filter((o) => stages.find((s) => s.id === o.stageId)?.kind === "open");
  const weighted = openTotal.reduce((t, o) => t + (o.value * (stages.find((s) => s.id === o.stageId)?.probability ?? 0)) / 100, 0);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Opportunities</h1>
          <p className="mt-0.5 text-sm text-muted">
            {openTotal.length} open · {formatMoneyCompact(openTotal.reduce((t, o) => t + o.value, 0))} pipeline · {formatMoneyCompact(weighted)} weighted
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tabs value={mode} onChange={setMode} items={[{ value: "board", label: <><KanbanSquare className="size-4" /> Board</> }, { value: "list", label: <><List className="size-4" /> List</> }]} />
          {can(user, "opp.create") && (
            <Button variant="primary" onClick={() => setNewOpen(true)}>
              <Plus className="size-4" /> New opportunity
            </Button>
          )}
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search opportunities" aria-label="Search opportunities" className="h-8 pl-8 text-[13px]" />
        </div>
        {user?.role !== "exec" && <FilterMenu label="Owner" value={owners} onChange={setOwners} options={orgUsers.filter((u) => u.role === "exec" || u.role === "manager").map((u) => ({ value: u.id, label: u.name }))} />}
        <label className="ml-1 flex items-center gap-2 text-[13px] text-slate-600">
          <input type="checkbox" className="accent-brand-600" checked={showClosed} onChange={(e) => setShowClosed(e.target.checked)} /> Show won / lost
        </label>
        {canEdit && mode === "board" && <span className="ml-auto hidden text-xs text-muted md:block">Drag cards between stages, or use the stage menu on each card.</span>}
      </div>

      {opportunities.length === 0 ? (
        <Card>
          <EmptyState icon={KanbanSquare} title="No opportunities yet" description="Convert a qualified lead, or create an opportunity directly." action={can(user, "opp.create") && <Button variant="primary" onClick={() => setNewOpen(true)}>New opportunity</Button>} />
        </Card>
      ) : mode === "board" ? (
        <div className="-mx-4 flex min-h-0 flex-1 gap-3 overflow-x-auto px-4 pb-2 scrollbar-thin sm:-mx-8 sm:px-8">
          {visibleStages.map((stage) => {
            const items = filtered.filter((o) => o.stageId === stage.id).sort((a, b) => new Date(a.closeDate).getTime() - new Date(b.closeDate).getTime());
            const total = items.reduce((t, o) => t + o.value, 0);
            return (
              <section
                key={stage.id}
                aria-label={`${stage.name} stage`}
                onDragOver={(e) => { if (canEdit && dragId) { e.preventDefault(); setOverStage(stage.id); } }}
                onDragLeave={() => setOverStage((s) => (s === stage.id ? null : s))}
                onDrop={(e) => {
                  e.preventDefault();
                  const opp = opportunities.find((o) => o.id === dragId);
                  if (opp) requestMove(opp, stage.id);
                  setDragId(null);
                  setOverStage(null);
                }}
                className={cn("flex w-72 shrink-0 flex-col rounded-xl border bg-slate-100/60", overStage === stage.id ? "border-brand-400 bg-brand-50/60" : "border-transparent")}
              >
                <header className="px-3 pt-3 pb-2">
                  <div className="flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-[13px] font-semibold text-slate-800">
                      <span className={cn("size-2 rounded-full", stage.kind === "won" ? "bg-emerald-500" : stage.kind === "lost" ? "bg-red-400" : "bg-brand-500")} />
                      {stage.name}
                      <span className="rounded-full bg-white px-1.5 text-[11px] font-medium text-slate-500">{items.length}</span>
                    </h2>
                    <span className="text-xs text-muted">{stage.probability}%</span>
                  </div>
                  <p className="mt-0.5 text-xs font-medium text-slate-600 tabular-nums">{formatMoneyCompact(total)}</p>
                </header>
                <div className="flex-1 space-y-2 overflow-y-auto px-2 pb-2 scrollbar-thin">
                  {items.length === 0 && <p className="rounded-lg border border-dashed border-slate-300 px-3 py-6 text-center text-xs text-muted">No opportunities</p>}
                  {items.map((o) => {
                    const overdue = stage.kind === "open" && new Date(o.closeDate).getTime() < Date.now();
                    return (
                      <article
                        key={o.id}
                        draggable={canEdit}
                        onDragStart={(e) => { setDragId(o.id); e.dataTransfer.effectAllowed = "move"; }}
                        onDragEnd={() => { setDragId(null); setOverStage(null); }}
                        className={cn("group rounded-lg border border-line bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-shadow hover:border-brand-300 hover:shadow-sm", canEdit && "cursor-grab active:cursor-grabbing", dragId === o.id && "opacity-50")}
                      >
                        <button type="button" onClick={() => setOpenId(o.id)} className="block w-full text-left">
                          <p className="line-clamp-2 text-[13px] font-medium text-slate-900 group-hover:text-brand-700">{o.name}</p>
                          <p className="mt-1.5 text-sm font-semibold text-slate-800 tabular-nums">{formatMoney(o.value)}</p>
                        </button>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted">
                            <Avatar name={name(o.ownerId)} size="sm" />
                            <span className="truncate">{name(o.ownerId).split(" ")[0]}</span>
                          </span>
                          <span className={cn("flex items-center gap-1 text-xs whitespace-nowrap", overdue ? "font-medium text-red-600" : "text-muted")}>
                            <CalendarDays className="size-3" />
                            {overdue && "Past "}
                            {formatDate(o.closeDate).replace(/ \d{4}$/, "")}
                          </span>
                        </div>
                        {stage.kind !== "open" && o.outcomeReason && <p className="mt-2 truncate rounded bg-slate-50 px-2 py-1 text-[11px] text-slate-600">Reason: {o.outcomeReason}</p>}
                        {canEdit && (
                          <div className="mt-2 md:hidden md:group-focus-within:block md:group-hover:block">
                            <Select aria-label={`Move ${o.name} to stage`} size="sm" className="w-full bg-slate-50" value={o.stageId} onChange={(e) => requestMove(o, e.target.value)}>
                              {stages.map((s) => <option key={s.id} value={s.id}>{s.id === o.stageId ? `Stage: ${s.name}` : `Move to ${s.name}`}</option>)}
                            </Select>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <Card className="overflow-hidden">
          {filtered.length === 0 ? (
            <EmptyState icon={Search} title="No opportunities match" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-[13px]">
                <thead className="border-b border-line bg-white text-left text-[11px] font-semibold tracking-[0.06em] text-slate-400 uppercase">
                  <tr>
                    {["Opportunity", "Stage", "Value", "Owner", "Expected close", "Linked lead"].map((h) => <th key={h} className="px-3 py-2.5 font-medium">{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filtered.filter((o) => visibleStages.some((s) => s.id === o.stageId)).map((o) => {
                    const st = stages.find((s) => s.id === o.stageId);
                    return (
                      <tr key={o.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setOpenId(o.id)}>
                        <td className="px-3 py-2 font-medium text-slate-900">{o.name}</td>
                        <td className="px-3 py-2">{st && <StageBadge name={st.name} kind={st.kind} />}</td>
                        <td className="px-3 py-2 font-medium tabular-nums">{formatMoney(o.value)}</td>
                        <td className="px-3 py-2">{name(o.ownerId)}</td>
                        <td className="px-3 py-2">{formatDate(o.closeDate)}</td>
                        <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                          {o.leadId ? <Link href={`/leads/${o.leadId}`} className="text-brand-600 hover:underline">View lead</Link> : <span className="text-muted">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {openOpp && <OpportunityDrawer key={`${openOpp.id}-${openOpp.updatedAt}`} opp={openOpp} onClose={() => setOpenId(null)} onMove={requestMove} />}
      {pendingMove && <OutcomeModal pending={pendingMove} onClose={() => setPendingMove(null)} />}
      {newOpen && <OpportunityFormModal open onClose={() => setNewOpen(false)} onDone={(id) => setOpenId(id)} />}
    </div>
  );
}

function OutcomeModal({ pending, onClose }: { pending: { opp: Opportunity; stage: Stage }; onClose: () => void }) {
  const { settings, moveOpportunity, toast } = useStore();
  const won = pending.stage.kind === "won";
  const [reason, setReason] = useState(won ? "" : "");
  const [err, setErr] = useState("");
  return (
    <Modal open onClose={onClose} title={won ? "Mark as won" : "Mark as lost"} description={pending.opp.name} size="sm"
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant={won ? "primary" : "danger"} onClick={() => {
        if (!reason.trim()) return setErr(won ? "Add a short note on why it was won." : "Choose a loss reason.");
        moveOpportunity(pending.opp.id, pending.stage.id, reason.trim());
        toast(won ? "Opportunity won" : "Opportunity marked lost");
        onClose();
      }}>{won ? "Mark won" : "Mark lost"}</Button></>}>
      {won ? (
        <Field label="Win reason" htmlFor="win-reason" error={err} required hint="e.g. Best fit program, pricing accepted">
          <Input id="win-reason" value={reason} onChange={(e) => setReason(e.target.value)} aria-invalid={!!err} />
        </Field>
      ) : (
        <Field label="Loss reason" htmlFor="loss-reason" error={err} required>
          <Select id="loss-reason" value={reason} onChange={(e) => setReason(e.target.value)} aria-invalid={!!err}>
            <option value="">Select a reason…</option>
            {settings?.lossReasons.map((r) => <option key={r}>{r}</option>)}
          </Select>
        </Field>
      )}
    </Modal>
  );
}

function OpportunityDrawer({ opp, onClose, onMove }: { opp: Opportunity; onClose: () => void; onMove: (o: Opportunity, stageId: string) => void }) {
  const { db, user, stages, updateOpportunity, toast } = useStore();
  const name = useUserName();
  const [value, setValue] = useState(String(opp.value));
  const [close, setClose] = useState(opp.closeDate.slice(0, 10));
  const [logOpen, setLogOpen] = useState(false);
  const canEdit = can(user, "opp.edit");
  const lead = opp.leadId ? db.leads.find((l) => l.id === opp.leadId) : null;
  const activities = db.activities.filter((a) => a.oppId === opp.id || (opp.leadId && a.leadId === opp.leadId));
  const stage = stages.find((s) => s.id === opp.stageId);
  const dirty = Number(value) !== opp.value || close !== opp.closeDate.slice(0, 10);

  return (
    <Drawer open onClose={onClose} title="Opportunity"
      footer={canEdit ? <><Button onClick={() => setLogOpen(true)}>Log activity</Button><Button variant="primary" disabled={!dirty || !(Number(value) > 0)} onClick={() => { updateOpportunity(opp.id, { value: Number(value), closeDate: new Date(close).toISOString() }); toast("Opportunity updated"); }}>Save changes</Button></> : undefined}>
      <div className="space-y-5">
        <div>
          <h3 className="text-lg font-semibold">{opp.name}</h3>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
            {stage && <StageBadge name={stage.name} kind={stage.kind} />} Owner: {name(opp.ownerId)}
          </p>
          {opp.outcomeReason && stage?.kind !== "open" && <p className="mt-2 text-sm text-slate-600">Reason: {opp.outcomeReason}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Value (INR)" htmlFor="d-value">
            <Input id="d-value" inputMode="numeric" value={value} disabled={!canEdit} onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))} />
          </Field>
          <Field label="Expected close" htmlFor="d-close">
            <Input id="d-close" type="date" value={close} disabled={!canEdit} onChange={(e) => setClose(e.target.value)} />
          </Field>
          <div className="col-span-2">
            <Field label="Stage" htmlFor="d-stage">
              <Select id="d-stage" value={opp.stageId} disabled={!canEdit} onChange={(e) => onMove(opp, e.target.value)}>
                {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </Field>
          </div>
        </div>
        {lead && (
          <div className="rounded-lg border border-line p-3 text-sm">
            <p className="text-xs text-muted">Originating lead · {lead.source}</p>
            <Link href={`/leads/${lead.id}`} className="font-medium text-brand-600 hover:underline">
              {lead.firstName} {lead.lastName}
            </Link>
          </div>
        )}
        <div>
          <h4 className="mb-3 text-sm font-semibold">History</h4>
          <Timeline items={activities} />
        </div>
      </div>
      {logOpen && <LogActivityModal open onClose={() => setLogOpen(false)} leadId={opp.leadId} oppId={opp.id} />}
    </Drawer>
  );
}
