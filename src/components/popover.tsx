"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Checkbox } from "@/components/ui";
import { cn } from "@/lib/utils";

export function Popover({ trigger, children, align = "left", width = "w-60", label }: { trigger: (open: boolean) => React.ReactNode; children: (close: () => void) => React.ReactNode; align?: "left" | "right"; width?: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", h);
    document.addEventListener("keydown", k);
    return () => {
      document.removeEventListener("mousedown", h);
      document.removeEventListener("keydown", k);
    };
  }, [open]);
  return (
    <div className="relative" ref={ref}>
      <span onClick={() => setOpen((o) => !o)}>{trigger(open)}</span>
      {open && (
        <div role="dialog" aria-label={label} className={cn("absolute z-40 mt-1 rounded-lg border border-line bg-white p-1.5 shadow-lg", width, align === "right" ? "right-0" : "left-0")}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function FilterMenu<T extends string>({ label, options, value, onChange }: { label: string; options: { value: T; label: React.ReactNode }[]; value: T[]; onChange: (v: T[]) => void }) {
  const active = value.length > 0;
  return (
    <Popover
      label={`${label} filter`}
      trigger={(open) => (
        <button
          type="button"
          aria-expanded={open}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[13px] font-medium transition-colors",
            active ? "border-brand-300 bg-brand-50 text-brand-700" : "border-line bg-white text-slate-600 hover:border-slate-300",
          )}
        >
          {label}
          {active && <span className="rounded bg-brand-600 px-1 text-[10px] text-white">{value.length}</span>}
          <ChevronDown className="size-3.5" />
        </button>
      )}
    >
      {() => (
        <div>
          <div className="max-h-72 overflow-y-auto scrollbar-thin">
            {options.map((o) => (
              <label key={o.value} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50">
                <Checkbox checked={value.includes(o.value)} onChange={(e) => onChange(e.target.checked ? [...value, o.value] : value.filter((x) => x !== o.value))} />
                <span className="truncate">{o.label}</span>
              </label>
            ))}
          </div>
          {active && (
            <button type="button" onClick={() => onChange([])} className="mt-1 w-full rounded-lg border-t border-line px-2 py-1.5 text-left text-xs font-medium text-slate-500 hover:text-slate-900">
              Clear {label.toLowerCase()}
            </button>
          )}
        </div>
      )}
    </Popover>
  );
}
