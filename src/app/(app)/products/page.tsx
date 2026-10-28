"use client";

import { Package, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { ProductModal } from "@/components/product-modal";
import { Avatar, Badge, Button, Card, EmptyState, Input, Tabs } from "@/components/ui";
import { can } from "@/lib/permissions";
import { useUserName } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import type { Product } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function ProductsPage() {
  const { db, orgId, user } = useStore();
  const name = useUserName();
  const [status, setStatus] = useState<Product["status"]>("active");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const manage = can(user, "products.manage");

  const all = db.products.filter((p) => p.orgId === orgId);
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return all.filter((p) => p.status === status && (!s || `${p.name} ${p.description}`.toLowerCase().includes(s))).sort((a, b) => a.name.localeCompare(b.name));
  }, [all, status, q]);
  const counts = { active: all.filter((p) => p.status === "active").length, archived: all.filter((p) => p.status === "archived").length };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="mt-0.5 text-sm text-muted">Products and programs your organization sells, and the people assigned to each.</p>
        </div>
        {manage && (
          <Button variant="primary" onClick={() => setCreating(true)}>
            <Plus className="size-4" /> New product
          </Button>
        )}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Tabs value={status} onChange={setStatus} items={[{ value: "active", label: `Active (${counts.active})` }, { value: "archived", label: `Archived (${counts.archived})` }]} />
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" aria-label="Search products" className="h-8 pl-8 text-[13px]" />
        </div>
      </div>

      {list.length === 0 ? (
        <Card>
          {all.length === 0 ? (
            <EmptyState icon={Package} title="No products yet" description="Add the products or programs you sell, like Catalyst or IAIB, and choose who works on each." action={manage && <Button variant="primary" onClick={() => setCreating(true)}><Plus className="size-4" /> New product</Button>} />
          ) : (
            <EmptyState icon={Search} title={q ? "No products match" : `No ${status} products`} />
          )}
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => {
            const members = p.memberIds.map((id) => ({ id, name: name(id) }));
            return (
              <Card key={p.id} className="flex flex-col transition-colors hover:border-brand-300">
                <button type="button" onClick={() => setEditing(p)} className="flex flex-1 flex-col p-4 text-left">
                  <div className="flex items-start gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                      <Package className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-[15px] font-semibold text-slate-900">{p.name}</h2>
                      <p className="text-xs text-muted">Added {formatDate(p.createdAt)} by {name(p.createdBy)}</p>
                    </div>
                    {p.status === "archived" && <Badge>Archived</Badge>}
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm text-slate-600">{p.description || <span className="text-slate-400">No description</span>}</p>
                </button>
                <div className="flex items-center justify-between border-t border-line px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {members.slice(0, 4).map((m) => (
                        <span key={m.id} title={m.name}>
                          <Avatar name={m.name} size="sm" />
                        </span>
                      ))}
                      {members.length > 4 && <span className="flex size-6 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600">+{members.length - 4}</span>}
                    </div>
                    <span className="text-xs text-muted">
                      {members.length} {members.length === 1 ? "person" : "people"}
                    </span>
                  </div>
                  <button type="button" onClick={() => setEditing(p)} className="text-[13px] font-medium text-brand-600 hover:text-brand-700">
                    {manage ? "Manage" : "View"}
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {creating && <ProductModal onClose={() => setCreating(false)} />}
      {editing && <ProductModal key={editing.id} product={editing} readOnly={!manage} onClose={() => setEditing(null)} />}
    </div>
  );
}
