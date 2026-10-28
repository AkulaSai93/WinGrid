"use client";

import { ArrowRightLeft, FileText, Flag, Mail, Phone, Sparkles, Users } from "lucide-react";
import { EmptyState } from "@/components/ui";
import { useUserName } from "@/lib/selectors";
import type { Activity, ActivityType } from "@/lib/types";
import { cn, formatDateTime } from "@/lib/utils";

const META: Record<ActivityType, { icon: React.ComponentType<{ className?: string }>; cls: string; label: string }> = {
  call: { icon: Phone, cls: "bg-emerald-50 text-emerald-600 ring-emerald-200", label: "Call" },
  email: { icon: Mail, cls: "bg-brand-50 text-brand-600 ring-brand-200", label: "Email" },
  meeting: { icon: Users, cls: "bg-teal-50 text-teal-600 ring-teal-200", label: "Meeting" },
  note: { icon: FileText, cls: "bg-amber-50 text-amber-700 ring-amber-200", label: "Note" },
  status: { icon: Flag, cls: "bg-cyan-50 text-cyan-700 ring-cyan-200", label: "Status" },
  stage: { icon: ArrowRightLeft, cls: "bg-slate-100 text-brand-700 ring-slate-200", label: "Pipeline" },
  system: { icon: Sparkles, cls: "bg-slate-100 text-slate-500 ring-slate-200", label: "System" },
};

export function Timeline({ items }: { items: Activity[] }) {
  const name = useUserName();
  if (!items.length) return <EmptyState title="No activity yet" description="Log a call, email or note to start this record's history." />;
  const sorted = [...items].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  return (
    <ol className="relative space-y-4 py-1 pl-1">
      <span className="absolute top-2 bottom-2 left-[17px] w-px bg-line" aria-hidden />
      {sorted.map((a) => {
        const m = META[a.type];
        return (
          <li key={a.id} className="relative flex gap-3">
            <span className={cn("z-[1] flex size-8 shrink-0 items-center justify-center rounded-full ring-1", m.cls)}>
              <m.icon className="size-4" />
              <span className="sr-only">{m.label}</span>
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <p className="text-sm font-medium text-slate-800">
                  {a.subject}
                  {a.outcome && <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">{a.outcome}</span>}
                </p>
                <time className="text-xs text-muted" dateTime={a.at}>
                  {formatDateTime(a.at)}
                </time>
              </div>
              {a.body && <p className="mt-1 text-sm whitespace-pre-line text-slate-600">{a.body}</p>}
              <p className="mt-0.5 text-xs text-muted">by {name(a.userId)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
