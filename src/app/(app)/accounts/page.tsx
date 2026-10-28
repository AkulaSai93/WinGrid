"use client";

import { Building2, ChevronDown, ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import { Card, EmptyState, Input, LeadStatusBadge } from "@/components/ui";
import { useScoped, useUserName } from "@/lib/selectors";
import { formatMoneyCompact } from "@/lib/utils";

export default function AccountsPage() {
  const { leads, opportunities, stageById } = useScoped();
  const name = useUserName();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const accounts = useMemo(() => {
    const map = new Map<string, typeof leads>();
    for (const l of leads) {
      if (!l.company) continue;
      map.set(l.company, [...(map.get(l.company) ?? []), l]);
    }
    return [...map.entries()]
      .map(([company, contacts]) => {
        const ids = new Set(contacts.map((c) => c.id));
        const opps = opportunities.filter((o) => o.leadId && ids.has(o.leadId));
        const openOpps = opps.filter((o) => stageById.get(o.stageId)?.kind === "open");
        const won = opps.filter((o) => stageById.get(o.stageId)?.kind === "won");
        return { company, contacts, open: openOpps.length, pipeline: openOpps.reduce((t, o) => t + o.value, 0), won: won.reduce((t, o) => t + o.value, 0), owners: [...new Set(contacts.map((c) => name(c.ownerId)))] };
      })
      .filter((a) => !q.trim() || a.company.toLowerCase().includes(q.trim().toLowerCase()))
      .sort((a, b) => b.pipeline - a.pipeline || b.contacts.length - a.contacts.length);
  }, [leads, opportunities, stageById, q, name]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Accounts</h1>
          <p className="mt-0.5 text-sm text-muted">Companies grouped from your leads&apos; company field, with their contacts and deals.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search accounts" aria-label="Search accounts" className="h-8 pl-8 text-[13px]" />
        </div>
      </div>
      <Card className="overflow-hidden">
        {accounts.length === 0 ? (
          <EmptyState icon={Building2} title={q ? "No accounts match" : "No accounts yet"} description="Accounts appear when leads have a company name." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-[13px]">
              <thead className="border-b border-line bg-white text-left text-[11px] font-semibold tracking-[0.06em] text-slate-400 uppercase">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Account</th>
                  <th className="px-4 py-2.5 text-right font-medium">Contacts</th>
                  <th className="px-4 py-2.5 text-right font-medium">Open deals</th>
                  <th className="px-4 py-2.5 text-right font-medium">Open pipeline</th>
                  <th className="px-4 py-2.5 text-right font-medium">Won</th>
                  <th className="px-4 py-2.5 font-medium">Owners</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {accounts.map((a) => (
                  <Fragment key={a.company}>
                    <tr className="hover:bg-slate-50">
                      <td className="px-4 py-2.5">
                        <button type="button" aria-expanded={open === a.company} onClick={() => setOpen(open === a.company ? null : a.company)} className="flex items-center gap-2 font-medium text-slate-900 hover:text-brand-600">
                          {open === a.company ? <ChevronDown className="size-4 text-slate-400" /> : <ChevronRight className="size-4 text-slate-400" />}
                          <span className="flex size-7 items-center justify-center rounded-md bg-brand-50 text-brand-600"><Building2 className="size-4" /></span>
                          {a.company}
                        </button>
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{a.contacts.length}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{a.open}</td>
                      <td className="px-4 py-2.5 text-right font-medium tabular-nums">{a.pipeline ? formatMoneyCompact(a.pipeline) : "—"}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{a.won ? formatMoneyCompact(a.won) : "—"}</td>
                      <td className="max-w-60 truncate px-4 py-2.5 text-slate-600">{a.owners.join(", ")}</td>
                    </tr>
                    {open === a.company && (
                      <tr>
                        <td colSpan={6} className="bg-slate-50/60 px-4 py-2">
                          <ul className="divide-y divide-line rounded-lg border border-line bg-white">
                            {a.contacts.map((c) => (
                              <li key={c.id}>
                                <Link href={`/leads/${c.id}`} className="flex items-center justify-between gap-3 px-3 py-2 hover:bg-slate-50">
                                  <span>
                                    <span className="font-medium">{c.firstName} {c.lastName}</span>
                                    <span className="ml-2 text-xs text-muted">{c.jobTitle} · {c.email || c.phone}</span>
                                  </span>
                                  <LeadStatusBadge status={c.status} />
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
