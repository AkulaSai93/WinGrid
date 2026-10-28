"use client";

import { ScrollText, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Avatar, Badge, Button, Card, EmptyState, Input, PermissionDenied } from "@/components/ui";
import { can } from "@/lib/permissions";
import { useUserName } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import { downloadFile, formatDateTime, toCSV } from "@/lib/utils";

export default function AuditPage() {
  const { user, db, orgId } = useStore();
  const name = useUserName();
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(50);
  const platform = user?.role === "super_admin" && !orgId;

  const events = useMemo(() => {
    const s = q.trim().toLowerCase();
    return db.audit
      .filter((e) => (platform ? true : e.orgId === orgId))
      .filter((e) => !s || `${e.action} ${e.detail} ${name(e.userId)}`.toLowerCase().includes(s));
  }, [db.audit, orgId, platform, q, name]);

  if (!can(user, "audit.view")) return <PermissionDenied what="the audit log" />;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Audit log</h1>
          <p className="mt-0.5 text-sm text-muted">{platform ? "All organizations" : "This organization"}: ownership, status, stage, import/export, user and settings changes.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter events" aria-label="Filter audit events" className="h-8 pl-8 text-[13px]" />
          </div>
          <Button size="sm" disabled={!events.length} onClick={() => downloadFile("audit-log.csv", toCSV([["Time", "User", "Action", "Detail", "Org"], ...events.map((e) => [e.at, name(e.userId), e.action, e.detail, db.organizations.find((o) => o.id === e.orgId)?.name ?? "Platform"])]))}>Export</Button>
        </div>
      </div>
      <Card className="overflow-hidden">
        {events.length === 0 ? (
          <EmptyState icon={ScrollText} title={q ? "No events match" : "No events yet"} description="Actions like assigning leads, changing stages, importing data or editing users appear here." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-[13px]">
                <thead className="border-b border-line bg-white text-left text-[11px] font-semibold tracking-[0.06em] text-slate-400 uppercase">
                  <tr>{["When", "Who", "Action", "Detail", ...(platform ? ["Organization"] : [])].map((h) => <th key={h} className="px-4 py-2.5 font-medium">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {events.slice(0, limit).map((e) => (
                    <tr key={e.id}>
                      <td className="px-4 py-2 whitespace-nowrap text-muted">{formatDateTime(e.at)}</td>
                      <td className="px-4 py-2"><span className="flex items-center gap-2"><Avatar name={name(e.userId)} size="sm" />{name(e.userId)}</span></td>
                      <td className="px-4 py-2"><Badge tone={e.action.includes("delete") ? "red" : e.action.startsWith("platform") ? "violet" : "slate"}>{e.action}</Badge></td>
                      <td className="px-4 py-2 text-slate-700">{e.detail}</td>
                      {platform && <td className="px-4 py-2 text-muted">{db.organizations.find((o) => o.id === e.orgId)?.name ?? "Platform"}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {events.length > limit && <div className="border-t border-line p-3 text-center"><Button size="sm" onClick={() => setLimit((l) => l + 50)}>Load more</Button></div>}
          </>
        )}
      </Card>
    </div>
  );
}
