"use client";

import { Search, X } from "lucide-react";
import { useState } from "react";
import { Avatar, Button, Checkbox, ConfirmDialog, Field, Input, Modal, Select, Textarea } from "@/components/ui";
import { ROLE_LABEL } from "@/lib/permissions";
import { useStore } from "@/lib/store";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

const DESC_MAX = 500;

export function ProductModal({ product, onClose, readOnly }: { product?: Product; onClose: () => void; readOnly?: boolean }) {
  const { db, orgId, orgUsers, createProduct, updateProduct, deleteProduct, toast } = useStore();
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [memberIds, setMemberIds] = useState<string[]>(product?.memberIds ?? []);
  const [errors, setErrors] = useState<{ name?: string; members?: string }>({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    const errs: typeof errors = {};
    if (!n) errs.name = "Give the product a name.";
    else if (db.products.some((p) => p.orgId === orgId && p.id !== product?.id && p.name.toLowerCase() === n.toLowerCase())) errs.name = "A product with this name already exists.";
    if (!memberIds.length) errs.members = "Add at least one person.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    if (product) {
      updateProduct(product.id, { name: n, description: description.trim(), memberIds });
      toast(`${n} updated`);
    } else {
      createProduct({ name: n, description: description.trim(), memberIds });
      toast(`Product ${n} created with ${memberIds.length} ${memberIds.length === 1 ? "person" : "people"}`);
    }
    onClose();
  };

  if (readOnly && product) {
    const members = orgUsers.filter((u) => product.memberIds.includes(u.id));
    return (
      <Modal open onClose={onClose} title={product.name} footer={<Button onClick={onClose}>Close</Button>}>
        <p className="text-sm whitespace-pre-line text-slate-600">{product.description || "No description."}</p>
        <h3 className="mt-5 mb-2 text-[13px] font-semibold text-slate-800">People ({members.length})</h3>
        <ul className="divide-y divide-line rounded-lg border border-line">
          {members.map((u) => (
            <li key={u.id} className="flex items-center gap-2.5 px-3 py-2 text-sm">
              <Avatar name={u.name} size="sm" />
              <span className="flex-1">{u.name}</span>
              <span className="text-xs text-muted">{ROLE_LABEL[u.role]}</span>
            </li>
          ))}
        </ul>
      </Modal>
    );
  }

  return (
    <>
      <Modal
        open
        onClose={onClose}
        size="lg"
        title={product ? "Edit product" : "New product"}
        description={product ? undefined : "Add a product or program and choose who works on it."}
        footer={
          <div className="flex w-full items-center justify-between gap-2">
            <div className="flex gap-2">
              {product && (
                <>
                  <Button variant="ghost" onClick={() => { updateProduct(product.id, { status: product.status === "active" ? "archived" : "active" }); toast(product.status === "active" ? `${product.name} archived` : `${product.name} restored`); onClose(); }}>
                    {product.status === "active" ? "Archive" : "Restore"}
                  </Button>
                  <Button variant="ghost" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => setConfirmDelete(true)}>
                    Delete
                  </Button>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={onClose}>Cancel</Button>
              <Button variant="primary" type="submit" form="product-form">
                {product ? "Save changes" : "Create product"}
              </Button>
            </div>
          </div>
        }
      >
        <form id="product-form" noValidate onSubmit={submit} className="space-y-4">
          <Field label="Product name" htmlFor="pr-name" error={errors.name} required>
            <Input id="pr-name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} placeholder="e.g. Catalyst" maxLength={80} />
          </Field>
          <Field label="Description" htmlFor="pr-desc" hint={`${description.length}/${DESC_MAX}`}>
            <Textarea id="pr-desc" value={description} onChange={(e) => setDescription(e.target.value.slice(0, DESC_MAX))} rows={3} placeholder="What is this product or program, and who is it for?" />
          </Field>
          <MemberPicker value={memberIds} onChange={(v) => { setMemberIds(v); if (v.length) setErrors((x) => ({ ...x, members: undefined })); }} error={errors.members} />
        </form>
      </Modal>
      {product && (
        <ConfirmDialog
          open={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          onConfirm={() => { deleteProduct(product.id); toast(`${product.name} deleted`); onClose(); }}
          title={`Delete ${product.name}?`}
          message="The product and its member list are removed for everyone. Consider archiving instead if you may need it later."
          confirmLabel="Delete product"
          danger
        />
      )}
    </>
  );
}

function MemberPicker({ value, onChange, error }: { value: string[]; onChange: (v: string[]) => void; error?: string }) {
  const { db, orgId, orgUsers } = useStore();
  const [q, setQ] = useState("");
  const [teamId, setTeamId] = useState("");
  const teams = db.teams.filter((t) => t.orgId === orgId);
  const people = orgUsers.filter((u) => u.status !== "inactive");
  const selected = people.filter((u) => value.includes(u.id));
  const s = q.trim().toLowerCase();
  const list = people.filter((u) => (!s || `${u.name} ${u.email}`.toLowerCase().includes(s)) && (!teamId || u.teamId === teamId));
  const allListed = list.length > 0 && list.every((u) => value.includes(u.id));
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] font-medium text-slate-700">
          People<span className="ml-0.5 text-red-500">*</span>
        </span>
        <span className="text-xs text-muted">{value.length} selected</span>
      </div>

      {selected.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Selected people">
          {selected.map((u) => (
            <li key={u.id} className="flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 py-0.5 pr-1 pl-0.5 text-[13px] text-brand-800">
              <Avatar name={u.name} size="sm" />
              {u.name}
              <button type="button" aria-label={`Remove ${u.name}`} onClick={() => toggle(u.id)} className="rounded-full p-0.5 text-brand-500 hover:bg-brand-100 hover:text-brand-800">
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className={cn("rounded-lg border", error ? "border-red-300" : "border-line")}>
        <div className="flex flex-wrap items-center gap-2 border-b border-line p-2">
          <div className="relative min-w-40 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people" aria-label="Search people to add" className="h-8 pl-8 text-[13px]" />
          </div>
          {teams.length > 0 && (
            <Select aria-label="Filter by team" size="sm" className="w-44" value={teamId} onChange={(e) => setTeamId(e.target.value)}>
              <option value="">All teams</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
          )}
          <button type="button" disabled={!list.length} onClick={() => onChange(allListed ? value.filter((id) => !list.some((u) => u.id === id)) : [...new Set([...value, ...list.map((u) => u.id)])])} className="h-8 rounded-lg px-2 text-[13px] font-medium text-brand-600 hover:bg-brand-50 disabled:opacity-40">
            {allListed ? "Clear these" : "Select all"}
          </button>
        </div>
        <ul className="max-h-56 overflow-y-auto scrollbar-thin">
          {list.length === 0 && <li className="px-3 py-4 text-center text-sm text-muted">No people match.</li>}
          {list.map((u) => (
            <li key={u.id}>
              <label className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm hover:bg-slate-50">
                <Checkbox checked={value.includes(u.id)} onChange={() => toggle(u.id)} />
                <Avatar name={u.name} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-slate-800">{u.name}</span>
                  <span className="block truncate text-xs text-muted">{u.email}</span>
                </span>
                <span className="hidden text-xs text-muted sm:block">
                  {ROLE_LABEL[u.role]}
                  {u.teamId ? ` · ${teams.find((t) => t.id === u.teamId)?.name}` : ""}
                </span>
                {u.status === "invited" && <span className="rounded bg-amber-50 px-1.5 text-[11px] text-amber-800">Invited</span>}
              </label>
            </li>
          ))}
        </ul>
      </div>
      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
