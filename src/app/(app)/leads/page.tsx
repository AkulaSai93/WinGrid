"use client";

import { ArrowDown, ArrowUp, ArrowUpDown, Bookmark, ChevronLeft, ChevronRight, Columns3, Download, Search, Trash2, Upload, UserPlus, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ImportModal } from "@/components/import-modal";
import { LeadFormModal } from "@/components/lead-form";
import { RejectModal } from "@/components/reject-modal";
import { FilterMenu, Popover } from "@/components/popover";
import { Button, Card, Checkbox, ConfirmDialog, EmptyState, Field, Input, LEAD_STATUS_META, LeadStatusBadge, Modal, Select } from "@/components/ui";
import { can } from "@/lib/permissions";
import { useScoped, useUserName } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import type { Lead, LeadFilters, LeadStatus } from "@/lib/types";
import { cn, downloadFile, formatDate, relativeTime, toCSV } from "@/lib/utils";

type ColKey = "name" | "status" | "owner" | "source" | "company" | "email" | "phone" | "city" | "jobTitle" | "createdAt" | "updatedAt";
const COLUMNS: { key: ColKey; label: string; sortable?: boolean; required?: boolean }[] = [
  { key: "name", label: "Name", sortable: true, required: true },
  { key: "status", label: "Status", sortable: true },
  { key: "owner", label: "Owner", sortable: true },
  { key: "source", label: "Source", sortable: true },
  { key: "company", label: "Company", sortable: true },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "city", label: "City", sortable: true },
  { key: "jobTitle", label: "Job title" },
  { key: "createdAt", label: "Created", sortable: true },
  { key: "updatedAt", label: "Last activity", sortable: true },
];
const DEFAULT_COLS: ColKey[] = ["name", "status", "owner", "source", "company", "phone", "createdAt", "updatedAt"];
const EMPTY_FILTERS: LeadFilters = { q: "", status: [], source: [], ownerId: [] };
const STATUSES: LeadStatus[] = ["new", "contacted", "qualified", "converted", "rejected"];

type BuiltIn = "all" | "mine" | "unassigned";

export default function LeadsPage() {
  const store = useStore();
  const { user, orgUsers, settings, db, assignLeads, setLeadStatus, deleteLeads, saveView, deleteView, toast } = store;
  const { leads } = useScoped();
  const name = useUserName();
  const router = useRouter();

  const [filters, setFilters] = useState<LeadFilters>(EMPTY_FILTERS);
  const [view, setView] = useState<string>("all");
  const [sort, setSort] = useState<{ key: ColKey; dir: "asc" | "desc" }>({ key: "createdAt", dir: "desc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [cols, setCols] = useState<ColKey[]>(DEFAULT_COLS);
  const [newOpen, setNewOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  // Restore persisted preferences + deep-link params once.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-time restore from URL/localStorage */
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("new") === "1") setNewOpen(true);
    const st = sp.get("status") as LeadStatus | null;
    const src = sp.get("source");
    const owner = sp.get("owner");
    if (st || src || owner) setFilters({ ...EMPTY_FILTERS, status: st ? [st] : [], source: src ? [src] : [], ownerId: owner ? [owner] : [] });
    try {
      const saved = localStorage.getItem(`wingrid.cols.${user?.id}`);
      if (saved) setCols(JSON.parse(saved));
      const ps = localStorage.getItem("wingrid.pageSize");
      if (ps) setPageSize(Number(ps));
    } catch {}
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [user?.id]);

  const persistCols = (next: ColKey[]) => {
    setCols(next);
    try {
      localStorage.setItem(`wingrid.cols.${user?.id}`, JSON.stringify(next));
    } catch {}
  };

  const savedViews = db.savedViews.filter((v) => v.orgId === store.orgId && (v.userId === user?.id || v.shared));

  const applyView = (id: string) => {
    setView(id);
    setPage(1);
    setSelected(new Set());
    if (id === "all") setFilters(EMPTY_FILTERS);
    else if (id === "mine") setFilters({ ...EMPTY_FILTERS, ownerId: [user!.id] });
    else if (id === "unassigned") setFilters({ ...EMPTY_FILTERS, ownerId: ["unassigned"] });
    else {
      const v = savedViews.find((x) => x.id === id);
      if (v) setFilters(v.filters);
    }
  };
  const updateFilters = (patch: Partial<LeadFilters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
    setSelected(new Set());
  };

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    const res = leads.filter((l) => {
      if (filters.status.length && !filters.status.includes(l.status)) return false;
      if (filters.source.length && !filters.source.includes(l.source)) return false;
      if (filters.ownerId.length && !filters.ownerId.includes(l.ownerId ?? "unassigned")) return false;
      if (q && !`${l.firstName} ${l.lastName} ${l.email} ${l.phone.replace(/\s/g, "")} ${l.company} ${l.city}`.toLowerCase().includes(q.replace(/\s+/g, " "))) return false;
      return true;
    });
    const val = (l: Lead): string | number => {
      switch (sort.key) {
        case "name":
          return `${l.firstName} ${l.lastName}`.toLowerCase();
        case "owner":
          return name(l.ownerId).toLowerCase();
        case "status":
          return STATUSES.indexOf(l.status);
        case "createdAt":
        case "updatedAt":
          return new Date(l[sort.key]).getTime();
        default:
          return String(l[sort.key as keyof Lead] ?? "").toLowerCase();
      }
    };
    return res.sort((a, b) => {
      const x = val(a);
      const y = val(b);
      const c = x < y ? -1 : x > y ? 1 : 0;
      return sort.dir === "asc" ? c : -c;
    });
  }, [leads, filters, sort, name]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * pageSize, current * pageSize);
  const allOnPage = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const hasFilters = filters.q || filters.status.length || filters.source.length || filters.ownerId.length;
  const sellers = orgUsers.filter((u) => u.role === "exec" || u.role === "manager");
  const visibleSellers = user?.role === "exec" ? sellers.filter((s) => s.id === user.id) : user?.role === "manager" ? sellers.filter((s) => s.teamId === user.teamId) : sellers;

  const toggleSort = (key: ColKey) => setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "createdAt" || key === "updatedAt" ? "desc" : "asc" }));

  const exportRows = (list: Lead[]) => {
    const header = ["First name", "Last name", "Email", "Phone", "Company", "Job title", "City", "Source", "Status", "Owner", "Created"];
    downloadFile(`leads-${new Date().toISOString().slice(0, 10)}.csv`, toCSV([header, ...list.map((l) => [l.firstName, l.lastName, l.email, l.phone, l.company, l.jobTitle, l.city, l.source, l.status, name(l.ownerId), l.createdAt])]));
    toast(`Exported ${list.length} lead(s)`);
  };

  const cell = (l: Lead, key: ColKey) => {
    switch (key) {
      case "name":
        return (
          <Link href={`/leads/${l.id}`} className="font-medium text-slate-900 hover:text-brand-600" onClick={(e) => e.stopPropagation()}>
            {l.firstName} {l.lastName}
          </Link>
        );
      case "status":
        return <LeadStatusBadge status={l.status} />;
      case "owner":
        return l.ownerId ? name(l.ownerId) : <span className="text-amber-700">Unassigned</span>;
      case "createdAt":
        return <span title={new Date(l.createdAt).toLocaleString()}>{formatDate(l.createdAt)}</span>;
      case "updatedAt":
        return <span className="text-muted">{relativeTime(l.updatedAt)}</span>;
      case "email":
        return <span className="text-slate-600">{l.email || "—"}</span>;
      default:
        return (l[key as keyof Lead] as string) || <span className="text-slate-300">—</span>;
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
          <p className="mt-0.5 text-sm text-muted">
            {filtered.length.toLocaleString()} of {leads.length.toLocaleString()} leads you can see
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {can(user, "lead.export") && (
            <Button onClick={() => exportRows(filtered)} disabled={!filtered.length}>
              <Download className="size-4" /> Export
            </Button>
          )}
          {can(user, "lead.import") && (
            <Button onClick={() => setImportOpen(true)}>
              <Upload className="size-4" /> Import CSV
            </Button>
          )}
          {can(user, "lead.create") && (
            <Button variant="primary" onClick={() => setNewOpen(true)}>
              <UserPlus className="size-4" /> New lead
            </Button>
          )}
        </div>
      </div>

      {/* Saved views */}
      <div className="mb-3 flex items-center gap-1 overflow-x-auto border-b border-line scrollbar-thin" role="tablist" aria-label="Saved views">
        {(
          [
            { id: "all", label: "All leads" },
            { id: "mine", label: "My leads" },
            ...(user?.role !== "exec" ? [{ id: "unassigned", label: "Unassigned" }] : []),
          ] as { id: BuiltIn; label: string }[]
        ).map((v) => (
          <ViewTab key={v.id} active={view === v.id} onClick={() => applyView(v.id)}>
            {v.label}
          </ViewTab>
        ))}
        {savedViews.map((v) => (
          <ViewTab key={v.id} active={view === v.id} onClick={() => applyView(v.id)} onRemove={v.userId === user?.id ? () => { deleteView(v.id); if (view === v.id) applyView("all"); toast("View deleted"); } : undefined}>
            {v.name}
            {v.shared && <span className="ml-1 text-[10px] text-muted">shared</span>}
          </ViewTab>
        ))}
      </div>

      {/* Toolbar */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-slate-400" />
          <Input value={filters.q} onChange={(e) => updateFilters({ q: e.target.value })} placeholder="Search name, email, phone, company" aria-label="Search leads" className="h-8 pl-8 text-[13px]" />
        </div>
        <FilterMenu label="Status" value={filters.status} onChange={(v) => updateFilters({ status: v })} options={STATUSES.map((s) => ({ value: s, label: LEAD_STATUS_META[s].label }))} />
        <FilterMenu label="Source" value={filters.source} onChange={(v) => updateFilters({ source: v })} options={(settings?.leadSources ?? []).map((s) => ({ value: s, label: s }))} />
        {user?.role !== "exec" && (
          <FilterMenu label="Owner" value={filters.ownerId} onChange={(v) => updateFilters({ ownerId: v })} options={[{ value: "unassigned", label: "Unassigned" }, ...visibleSellers.map((u) => ({ value: u.id, label: u.name }))]} />
        )}
        {hasFilters ? (
          <>
            <button type="button" onClick={() => { updateFilters(EMPTY_FILTERS); setView("all"); }} className="h-8 rounded-lg px-2 text-[13px] font-medium text-slate-500 hover:text-slate-900">
              Clear all
            </button>
            <Button size="sm" variant="ghost" onClick={() => setSaveOpen(true)}>
              <Bookmark className="size-4" /> Save view
            </Button>
          </>
        ) : null}
        <div className="ml-auto">
          <ColumnChooser cols={cols} onChange={persistCols} />
        </div>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm">
          <span className="font-medium text-brand-800">{selected.size} selected</span>
          <span className="mx-1 h-4 w-px bg-brand-200" />
          {can(user, "lead.assign") && (
            <Select aria-label="Assign selected leads" className="h-8 w-48 text-[13px]" value="" onChange={(e) => {
              const owner = e.target.value === "__none" ? null : e.target.value;
              assignLeads([...selected], owner);
              toast(`Assigned ${selected.size} lead(s) to ${owner ? name(owner) : "nobody"}`);
              setSelected(new Set());
            }}>
              <option value="" disabled>Assign to…</option>
              <option value="__none">Unassign</option>
              {orgUsers.filter((u) => u.status === "active" && (u.role === "exec" || u.role === "manager")).map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </Select>
          )}
          <Select aria-label="Change status of selected leads" className="h-8 w-44 text-[13px]" value="" onChange={(e) => {
            const s = e.target.value as LeadStatus;
            if (s === "rejected") return setRejectOpen(true);
            setLeadStatus([...selected], s);
            toast(`Updated status for ${selected.size} lead(s)`);
            setSelected(new Set());
          }}>
            <option value="" disabled>Change status…</option>
            {(["new", "contacted", "qualified", "rejected"] as LeadStatus[]).map((s) => (
              <option key={s} value={s}>{LEAD_STATUS_META[s].label}</option>
            ))}
          </Select>
          {can(user, "lead.export") && (
            <Button size="sm" onClick={() => exportRows(filtered.filter((l) => selected.has(l.id)))}>
              <Download className="size-4" /> Export
            </Button>
          )}
          {can(user, "lead.delete") && (
            <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="size-4" /> Delete
            </Button>
          )}
          <button type="button" onClick={() => setSelected(new Set())} className="ml-auto text-[13px] font-medium text-brand-700 hover:underline">
            Clear selection
          </button>
        </div>
      )}

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {leads.length === 0 ? (
          <EmptyState title="No leads yet" description="Create your first lead or import a CSV to get started." action={can(user, "lead.create") && <Button variant="primary" onClick={() => setNewOpen(true)}>New lead</Button>} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Search} title="No leads match these filters" description="Try removing a filter or searching for something else." action={<Button onClick={() => applyView("all")}>Clear filters</Button>} />
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-auto scrollbar-thin">
              <table className="w-full min-w-[900px] text-[13px]">
                <thead className="sticky top-0 z-10 border-b border-line bg-white text-left text-[11px] font-semibold tracking-[0.06em] text-slate-400 uppercase shadow-[inset_0_-1px_0_var(--color-line)]">
                  <tr>
                    <th className="w-10 px-3 py-2.5">
                      <Checkbox
                        aria-label="Select all on this page"
                        checked={allOnPage}
                        onChange={() => {
                          const next = new Set(selected);
                          rows.forEach((r) => (allOnPage ? next.delete(r.id) : next.add(r.id)));
                          setSelected(next);
                        }}
                      />
                    </th>
                    {cols.map((k) => {
                      const c = COLUMNS.find((x) => x.key === k)!;
                      const active = sort.key === k;
                      return (
                        <th key={k} className="px-3 py-2.5 font-medium whitespace-nowrap" aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}>
                          {c.sortable ? (
                            <button type="button" onClick={() => toggleSort(k)} className={cn("inline-flex items-center gap-1 hover:text-slate-900", active && "text-slate-900")}>
                              {c.label}
                              {active ? sort.dir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" /> : <ArrowUpDown className="size-3 opacity-40" />}
                            </button>
                          ) : (
                            c.label
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((l) => (
                    <tr key={l.id} onClick={() => router.push(`/leads/${l.id}`)} className={cn("cursor-pointer hover:bg-slate-50", selected.has(l.id) && "bg-brand-50/50")}>
                      <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          aria-label={`Select ${l.firstName} ${l.lastName}`}
                          checked={selected.has(l.id)}
                          onChange={() => {
                            const next = new Set(selected);
                            if (next.has(l.id)) next.delete(l.id);
                            else next.add(l.id);
                            setSelected(next);
                          }}
                        />
                      </td>
                      {cols.map((k) => (
                        <td key={k} className="max-w-56 truncate px-3 py-2 whitespace-nowrap text-slate-700">
                          {cell(l, k)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-3 py-2 text-[13px] text-muted">
              <div className="flex items-center gap-2">
                <span>Rows per page</span>
                <Select aria-label="Rows per page" size="sm" className="w-20" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); try { localStorage.setItem("wingrid.pageSize", e.target.value); } catch {} }}>
                  {[10, 25, 50, 100].map((n) => <option key={n}>{n}</option>)}
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="tabular-nums">
                  {(current - 1) * pageSize + 1}–{Math.min(current * pageSize, filtered.length)} of {filtered.length}
                </span>
                <button type="button" aria-label="Previous page" disabled={current === 1} onClick={() => setPage(current - 1)} className="rounded-md p-1 hover:bg-slate-100 disabled:opacity-40">
                  <ChevronLeft className="size-4" />
                </button>
                <button type="button" aria-label="Next page" disabled={current === pages} onClick={() => setPage(current + 1)} className="rounded-md p-1 hover:bg-slate-100 disabled:opacity-40">
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </Card>

      {newOpen && <LeadFormModal open onClose={() => setNewOpen(false)} onCreated={(id) => router.push(`/leads/${id}`)} />}
      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />
      <SaveViewModal open={saveOpen} onClose={() => setSaveOpen(false)} canShare={user?.role !== "exec"} onSave={(n, shared) => { saveView(n, filters, shared); toast(`Saved view “${n}”`); }} />
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => { deleteLeads([...selected]); toast(`Deleted ${selected.size} lead(s)`); setSelected(new Set()); }}
        title={`Delete ${selected.size} lead(s)?`}
        message="Deleted leads and their open tasks are removed for everyone in your organization. This is recorded in the audit log and can't be undone."
        confirmLabel="Delete leads"
        danger
      />
      <RejectModal open={rejectOpen} onClose={() => setRejectOpen(false)} reasons={settings?.rejectReasons ?? []} count={selected.size} onConfirm={(r) => { setLeadStatus([...selected], "rejected", r); toast(`Rejected ${selected.size} lead(s)`); setSelected(new Set()); }} />
    </div>
  );
}

function ViewTab({ active, onClick, onRemove, children }: { active: boolean; onClick: () => void; onRemove?: () => void; children: React.ReactNode }) {
  return (
    <span className={cn("group -mb-px flex shrink-0 items-center border-b-2", active ? "border-brand-600" : "border-transparent")}>
      <button type="button" role="tab" aria-selected={active} onClick={onClick} className={cn("px-3 py-2 text-[13px] font-medium whitespace-nowrap", active ? "text-brand-700" : "text-slate-500 hover:text-slate-900")}>
        {children}
      </button>
      {onRemove && (
        <button type="button" aria-label="Delete view" onClick={onRemove} className="-ml-1.5 rounded p-0.5 text-slate-300 opacity-0 group-hover:opacity-100 hover:text-red-600 focus:opacity-100">
          <X className="size-3" />
        </button>
      )}
    </span>
  );
}

function ColumnChooser({ cols, onChange }: { cols: ColKey[]; onChange: (c: ColKey[]) => void }) {
  const ordered = [...cols, ...COLUMNS.map((c) => c.key).filter((k) => !cols.includes(k))];
  const move = (k: ColKey, d: -1 | 1) => {
    const i = cols.indexOf(k);
    const j = i + d;
    if (i < 0 || j < 0 || j >= cols.length) return;
    const next = [...cols];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <Popover
      align="right"
      width="w-64"
      label="Choose columns"
      trigger={(open) => (
        <Button size="sm" aria-expanded={open}>
          <Columns3 className="size-4" /> Columns
        </Button>
      )}
    >
      {() => (
        <div>
          <p className="px-2 pt-1 pb-2 text-xs text-muted">Show, hide and reorder columns</p>
          {ordered.map((k) => {
            const c = COLUMNS.find((x) => x.key === k)!;
            const on = cols.includes(k);
            return (
              <div key={k} className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-slate-50">
                <label className="flex flex-1 cursor-pointer items-center gap-2.5 text-sm">
                  <Checkbox checked={on} disabled={c.required} onChange={() => onChange(on ? cols.filter((x) => x !== k) : [...cols, k])} />
                  {c.label}
                </label>
                {on && (
                  <span className="flex">
                    <button type="button" aria-label={`Move ${c.label} left`} onClick={() => move(k, -1)} className="rounded p-0.5 text-slate-400 hover:text-slate-800">
                      <ArrowUp className="size-3.5" />
                    </button>
                    <button type="button" aria-label={`Move ${c.label} right`} onClick={() => move(k, 1)} className="rounded p-0.5 text-slate-400 hover:text-slate-800">
                      <ArrowDown className="size-3.5" />
                    </button>
                  </span>
                )}
              </div>
            );
          })}
          <button type="button" onClick={() => onChange(DEFAULT_COLS)} className="mt-1 w-full border-t border-line px-2 pt-2 pb-1 text-left text-xs font-medium text-slate-500 hover:text-slate-900">
            Reset to default
          </button>
        </div>
      )}
    </Popover>
  );
}

function SaveViewModal({ open, onClose, onSave, canShare }: { open: boolean; onClose: () => void; onSave: (name: string, shared: boolean) => void; canShare: boolean }) {
  const [n, setN] = useState("");
  const [shared, setShared] = useState(false);
  const [err, setErr] = useState("");
  return (
    <Modal open={open} onClose={onClose} title="Save view" description="Saves the current filters so you can return to them in one click." size="sm"
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" type="submit" form="sv-form">Save view</Button></>}>
      <form id="sv-form" className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (!n.trim()) return setErr("Name the view."); onSave(n.trim(), shared); setN(""); setErr(""); onClose(); }}>
        <Field label="View name" htmlFor="sv-name" error={err} required>
          <Input id="sv-name" value={n} onChange={(e) => setN(e.target.value)} aria-invalid={!!err} placeholder="e.g. Hot website leads" />
        </Field>
        {canShare && (
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <Checkbox checked={shared} onChange={(e) => setShared(e.target.checked)} /> Share with my organization
          </label>
        )}
        <p className="text-xs text-muted">Shared views still respect each person&apos;s record visibility.</p>
      </form>
    </Modal>
  );
}
