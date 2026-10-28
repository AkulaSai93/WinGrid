"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge, Button, Card, CardHeader, Field, IconButton, Input, PermissionDenied, Select, Tabs } from "@/components/ui";
import { can } from "@/lib/permissions";
import { useStore } from "@/lib/store";
import type { Stage, StageKind } from "@/lib/types";
import { uid } from "@/lib/utils";

export default function SettingsPage() {
  const { user, org } = useStore();
  const [tab, setTab] = useState<"org" | "pipeline" | "lists">("org");
  if (!can(user, "settings.manage")) return <PermissionDenied what="organization settings" />;
  return (
    <div className="max-w-4xl">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-0.5 text-sm text-muted">Configuration for {org?.name}. Changes are recorded in the audit log.</p>
        </div>
        <Tabs value={tab} onChange={setTab} items={[{ value: "org", label: "Organization" }, { value: "pipeline", label: "Pipeline stages" }, { value: "lists", label: "Sources & reasons" }]} />
      </div>
      {tab === "org" && <OrgForm key={org?.id} />}
      {tab === "pipeline" && <StagesEditor key={org?.id} />}
      {tab === "lists" && <ListsEditor key={org?.id} />}
    </div>
  );
}

function OrgForm() {
  const { org, updateOrg, toast } = useStore();
  const [name, setName] = useState(org?.name ?? "");
  const [tz, setTz] = useState(org?.timezone ?? "Asia/Kolkata");
  const [err, setErr] = useState("");
  return (
    <Card>
      <CardHeader title="Organization profile" />
      <form className="grid gap-4 p-4 sm:grid-cols-2" noValidate onSubmit={(e) => { e.preventDefault(); if (!name.trim()) return setErr("Organization name is required."); setErr(""); updateOrg({ name: name.trim(), timezone: tz }); toast("Organization updated"); }}>
        <Field label="Organization name" htmlFor="org-name" error={err} required><Input id="org-name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!err} /></Field>
        <Field label="Workspace URL" htmlFor="org-sub" hint="Contact support to change your subdomain."><Input id="org-sub" value={`${org?.subdomain}.wingrid.app`} disabled /></Field>
        <Field label="Timezone" htmlFor="org-tz">
          <Select id="org-tz" value={tz} onChange={(e) => setTz(e.target.value)}>
            {["Asia/Kolkata", "Asia/Dubai", "Asia/Singapore", "Europe/London", "America/New_York"].map((z) => <option key={z}>{z}</option>)}
          </Select>
        </Field>
        <Field label="Plan" htmlFor="org-plan"><Input id="org-plan" value={org?.plan ?? ""} disabled /></Field>
        <div className="sm:col-span-2 flex justify-end"><Button variant="primary" type="submit">Save changes</Button></div>
      </form>
    </Card>
  );
}

function StagesEditor() {
  const { stages, db, orgId, saveStages, toast } = useStore();
  const [draft, setDraft] = useState<Stage[]>(stages);
  const [err, setErr] = useState("");
  const inUse = (id: string) => db.opportunities.some((o) => o.stageId === id && o.orgId === orgId);
  const set = (i: number, patch: Partial<Stage>) => setDraft((d) => d.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const move = (i: number, dir: -1 | 1) => setDraft((d) => {
    const j = i + dir;
    if (j < 0 || j >= d.length) return d;
    const n = [...d];
    [n[i], n[j]] = [n[j], n[i]];
    return n;
  });
  const save = () => {
    if (draft.some((s) => !s.name.trim())) return setErr("Every stage needs a name.");
    if (!draft.some((s) => s.kind === "won") || !draft.some((s) => s.kind === "lost")) return setErr("Keep at least one Won and one Lost stage.");
    if (!draft.some((s) => s.kind === "open")) return setErr("Keep at least one open stage.");
    setErr("");
    saveStages(draft.map((s) => ({ ...s, name: s.name.trim() })));
    toast("Pipeline stages saved");
  };
  return (
    <Card>
      <CardHeader title="Opportunity pipeline" subtitle="Order, names, type and win probability. Stages with opportunities can't be removed." />
      <ul className="divide-y divide-line">
        {draft.map((s, i) => (
          <li key={s.id} className="flex flex-wrap items-center gap-2 px-4 py-2.5">
            <span className="w-5 text-xs text-muted tabular-nums">{i + 1}</span>
            <Input aria-label="Stage name" value={s.name} onChange={(e) => set(i, { name: e.target.value })} className="h-8 w-48 text-[13px]" />
            <Select aria-label="Stage type" value={s.kind} onChange={(e) => set(i, { kind: e.target.value as StageKind, probability: e.target.value === "won" ? 100 : e.target.value === "lost" ? 0 : s.probability })} className="h-8 w-28 text-[13px]">
              <option value="open">Open</option><option value="won">Won</option><option value="lost">Lost</option>
            </Select>
            <span className="flex items-center gap-1 text-[13px] text-muted">
              <Input aria-label="Win probability" type="number" min={0} max={100} value={s.probability} disabled={s.kind !== "open"} onChange={(e) => set(i, { probability: Math.max(0, Math.min(100, Number(e.target.value))) })} className="h-8 w-16 text-[13px]" />%
            </span>
            {inUse(s.id) && <Badge tone="blue">In use</Badge>}
            <span className="ml-auto flex">
              <IconButton label="Move up" onClick={() => move(i, -1)} disabled={i === 0}><ArrowUp className="size-4" /></IconButton>
              <IconButton label="Move down" onClick={() => move(i, 1)} disabled={i === draft.length - 1}><ArrowDown className="size-4" /></IconButton>
              <IconButton label={inUse(s.id) ? "Stage has opportunities" : "Remove stage"} disabled={inUse(s.id)} onClick={() => setDraft((d) => d.filter((_, j) => j !== i))}><Trash2 className="size-4" /></IconButton>
            </span>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3">
        <Button size="sm" onClick={() => setDraft((d) => [...d, { id: uid("st"), orgId: orgId!, name: "", order: d.length, kind: "open", probability: 50 }])}><Plus className="size-4" /> Add stage</Button>
        <div className="flex items-center gap-3">
          {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
          <Button onClick={() => { setDraft(stages); setErr(""); }}>Discard</Button>
          <Button variant="primary" onClick={save}>Save stages</Button>
        </div>
      </div>
    </Card>
  );
}

function ListsEditor() {
  const { settings, updateSettings, toast } = useStore();
  if (!settings) return null;
  const lists = [
    { key: "leadSources" as const, title: "Lead sources", hint: "Where leads come from. Used in forms, imports and reports." },
    { key: "rejectReasons" as const, title: "Lead rejection reasons", hint: "Required when a lead is rejected." },
    { key: "lossReasons" as const, title: "Opportunity loss reasons", hint: "Required when a deal is marked lost." },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {lists.map((l) => (
        <ListCard key={l.key} title={l.title} hint={l.hint} items={settings[l.key]} onSave={(items) => { updateSettings({ [l.key]: items }); toast(`${l.title} updated`); }} />
      ))}
    </div>
  );
}

function ListCard({ title, hint, items, onSave }: { title: string; hint: string; items: string[]; onSave: (items: string[]) => void }) {
  const [v, setV] = useState("");
  const [err, setErr] = useState("");
  return (
    <Card>
      <CardHeader title={title} subtitle={hint} />
      <ul className="divide-y divide-line">
        {items.map((it) => (
          <li key={it} className="flex items-center justify-between px-4 py-1.5 text-sm">
            {it}
            <IconButton label={`Remove ${it}`} disabled={items.length <= 1} onClick={() => onSave(items.filter((x) => x !== it))}><Trash2 className="size-3.5" /></IconButton>
          </li>
        ))}
      </ul>
      <form className="flex gap-2 border-t border-line p-3" onSubmit={(e) => { e.preventDefault(); const t = v.trim(); if (!t) return; if (items.some((x) => x.toLowerCase() === t.toLowerCase())) return setErr("Already in the list."); setErr(""); onSave([...items, t]); setV(""); }}>
        <div className="flex-1">
          <Input aria-label={`Add to ${title}`} value={v} onChange={(e) => setV(e.target.value)} placeholder="Add…" className="h-8 text-[13px]" aria-invalid={!!err} />
          {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
        </div>
        <Button size="sm" type="submit">Add</Button>
      </form>
    </Card>
  );
}
