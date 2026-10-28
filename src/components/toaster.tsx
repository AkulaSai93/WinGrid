"use client";

import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useStore } from "@/lib/store";

export function Toaster() {
  const { toasts, dismissToast } = useStore();
  return (
    <div aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 z-[60] flex w-80 flex-col gap-2">
      {toasts.map((t) => {
        const Icon = t.kind === "error" ? XCircle : t.kind === "info" ? Info : CheckCircle2;
        return (
          <div key={t.id} className="animate-toast pointer-events-auto flex items-start gap-2.5 rounded-lg border border-line bg-white px-3.5 py-3 text-sm shadow-lg">
            <Icon className={t.kind === "error" ? "mt-0.5 size-4 shrink-0 text-red-500" : t.kind === "info" ? "mt-0.5 size-4 shrink-0 text-brand-500" : "mt-0.5 size-4 shrink-0 text-emerald-500"} aria-hidden />
            <p className="flex-1 text-slate-700">{t.message}</p>
            <button type="button" aria-label="Dismiss notification" onClick={() => dismissToast(t.id)} className="text-slate-400 hover:text-slate-700">
              <X className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
