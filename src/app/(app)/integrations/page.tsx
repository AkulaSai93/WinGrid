"use client";

import { Calendar, Database, Mail, MessageCircle, Phone, Webhook } from "lucide-react";
import { Badge, Card, CardHeader, PermissionDenied } from "@/components/ui";
import { can } from "@/lib/permissions";
import { useStore } from "@/lib/store";

// No integration is wired up yet. Per the blueprint we don't show fake connections:
// each card states what must be decided before it can be enabled.
const ITEMS = [
  { icon: Database, name: "Existing database / CRM sync", status: "Needs decisions", body: "Two-way sync stays disabled until these are confirmed:", needs: ["Source system and connection method", "System of record for each field", "Sync direction and frequency", "Duplicate and conflict rules", "Deletion / archive policy", "Retry and idempotency behavior"] },
  { icon: Mail, name: "Email (Gmail / Outlook)", status: "Planned · v1", body: "Log sent and received emails on the lead timeline.", needs: ["Which provider(s)", "Per-user vs shared mailbox"] },
  { icon: Calendar, name: "Calendar", status: "Planned · v1", body: "Create meetings from tasks and sync invites.", needs: ["Google or Microsoft 365"] },
  { icon: Phone, name: "Telephony / click-to-call", status: "Planned · v1", body: "Dial from the lead page and auto-log calls with recordings.", needs: ["Dialer provider", "Call recording consent policy"] },
  { icon: MessageCircle, name: "WhatsApp / SMS", status: "Not scheduled", body: "Send templated messages and log replies.", needs: ["Confirm this channel is in scope"] },
  { icon: Webhook, name: "REST API & webhooks", status: "Planned · v1", body: "Events such as lead.created, lead.status_changed and opportunity.stage_changed, with token-based auth.", needs: ["Consumers and event list", "Rate limits"] },
];

export default function IntegrationsPage() {
  const { user } = useStore();
  if (!can(user, "integrations.manage")) return <PermissionDenied what="integrations" />;
  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Integrations & Sync</h1>
        <p className="mt-0.5 max-w-2xl text-sm text-muted">Nothing is connected yet. Each integration lists what has to be agreed before it can be built and turned on, so no data moves on assumptions.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {ITEMS.map((it) => (
          <Card key={it.name}>
            <CardHeader
              title={<span className="flex items-center gap-2"><span className="flex size-7 items-center justify-center rounded-md bg-brand-50 text-brand-600"><it.icon className="size-4" /></span>{it.name}</span>}
              action={<Badge tone={it.status === "Needs decisions" ? "amber" : it.status.startsWith("Planned") ? "blue" : "slate"}>{it.status}</Badge>}
            />
            <div className="p-4 text-sm">
              <p className="text-slate-600">{it.body}</p>
              <ul className="mt-3 space-y-1.5">
                {it.needs.map((n) => (
                  <li key={n} className="flex gap-2 text-slate-600"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-slate-300" />{n}</li>
                ))}
              </ul>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
