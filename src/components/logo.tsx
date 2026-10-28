import { cn } from "@/lib/utils";

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight text-slate-900", className)}>
      <span className="grid size-7 grid-cols-2 gap-0.5 rounded-lg bg-brand-600 p-1.5" aria-hidden>
        <span className="rounded-[2px] bg-white" />
        <span className="rounded-[2px] bg-white/60" />
        <span className="rounded-[2px] bg-white/60" />
        <span className="rounded-[2px] bg-white" />
      </span>
      {!compact && <span>WinGrid</span>}
    </span>
  );
}
