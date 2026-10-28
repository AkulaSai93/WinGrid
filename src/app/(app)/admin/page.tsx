"use client";

import { Building2 } from "lucide-react";
import { useState } from "react";
import { Kpi } from "@/components/crm";
import { Badge, Button, Card, CardHeader, ConfirmDialog, PermissionDenied } from "@/components/ui";
import { can } from "@/lib/permissions";
import { useStore } from "@/lib/store";
import { useNow } from "@/lib/use-now";
import type { Organization } from "@/lib/types";
import { formatDate, relativeTime } from "@/lib/utils";

export default function SuperAdminPage() {
  const { user, db, enterOrg, setOrgStatus, toast } = useStore();
  const [suspend, setSuspend] = useState<Organization | null>(null);
  const now = useNow();
  if (!can(user, "platform.manage")) return <PermissionDenied what="platform administration" />;

  const DAY = 86_400_000;
  const rows = db.organizations.map((o) => {
    const users = db.users.filter((u) => u.orgId === o.id);
    const leads = db.leads.filter((l) => l.orgId === o.id);
    const lastActive = users.map((u) => u.lastActiveAt).filter(Boolean).sort().at(-1) ?? null;
    return { o, users: users.length, active: users.filter((u) => u.status === "active").length, leads: leads.length, leads30: leads.filter((l) => now - new Date(l.createdAt).getTime() < 30 * DAY).length, lastActive };
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Super Admin</h1>
        <p className="mt-0.5 text-sm text-muted">Platform-wide view of customer organizations. Entering a workspace is recorded in the audit log.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Organizations" value={db.organizations.length} sub={`${db.organizations.filter((o) => o.status === "active").length} active`} />
        <Kpi label="Users" value={db.users.filter((u) => u.orgId).length} sub={`${db.users.filter((u) => u.orgId && u.status === "active").length} active`} />
        <Kpi label="Leads (all orgs)" value={db.leads.length.toLocaleString()} />
        <Kpi label="New leads · 30 days" value={rows.reduce((t, r) => t + r.leads30, 0)} />
      </div>
      <Card className="overflow-hidden">
        <CardHeader title="Organizations" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-[13px]">
            <thead className="border-b border-line bg-white text-left text-[11px] font-semibold tracking-[0.06em] text-slate-400 uppercase">
              <tr>{["Organization", "Plan", "Status", "Users", "Leads", "New · 30d", "Last activity", "Created", ""].map((h, i) => <th key={i} className="px-4 py-2.5 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map(({ o, users, active, leads, leads30, lastActive }) => (
                <tr key={o.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-2.5">
                    <span className="flex items-center gap-2.5">
                      <span className="flex size-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><Building2 className="size-4" /></span>
                      <span><span className="block font-medium text-slate-900">{o.name}</span><span className="text-xs text-muted">{o.subdomain}.wingrid.app</span></span>
                    </span>
                  </td>
                  <td className="px-4 py-2.5">{o.plan}</td>
                  <td className="px-4 py-2.5"><Badge tone={o.status === "active" ? "green" : "red"} dot>{o.status === "active" ? "Active" : "Suspended"}</Badge></td>
                  <td className="px-4 py-2.5 tabular-nums">{active}/{users}</td>
                  <td className="px-4 py-2.5 tabular-nums">{leads}</td>
                  <td className="px-4 py-2.5 tabular-nums">{leads30}</td>
                  <td className="px-4 py-2.5 text-muted">{lastActive ? relativeTime(lastActive) : "—"}</td>
                  <td className="px-4 py-2.5 text-muted">{formatDate(o.createdAt)}</td>
                  <td className="px-4 py-2.5">
                    <span className="flex justify-end gap-2">
                      <Button size="sm" onClick={() => { enterOrg(o.id); toast(`Entered ${o.name}`, "info"); }}>Enter workspace</Button>
                      {o.status === "active" ? (
                        <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => setSuspend(o)}>Suspend</Button>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => { setOrgStatus(o.id, "active"); toast(`${o.name} reactivated`); }}>Reactivate</Button>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <ConfirmDialog
        open={!!suspend}
        onClose={() => setSuspend(null)}
        onConfirm={() => { if (suspend) { setOrgStatus(suspend.id, "suspended"); toast(`${suspend.name} suspended`); } }}
        title={`Suspend ${suspend?.name}?`}
        message="Users in this organization will be blocked from signing in. Data is kept and the organization can be reactivated."
        confirmLabel="Suspend organization"
        danger
      />
    </div>
  );
}
