"use client";

import { AlertTriangle, Inbox, Loader2, Lock, X } from "lucide-react";
import Link from "next/link";
import { forwardRef, useEffect, useId, useRef } from "react";
import type { LeadStatus, StageKind } from "@/lib/types";
import { cn, initials } from "@/lib/utils";

type BtnVariant = "primary" | "secondary" | "ghost" | "danger";
const btnBase = "inline-flex items-center justify-center gap-1.5 rounded-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap";
const btnVariants: Record<BtnVariant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-[0_1px_2px_rgba(16,24,40,0.12),inset_0_1px_0_rgba(255,255,255,0.12)]",
  secondary: "bg-white text-slate-700 border border-line shadow-[0_1px_2px_rgba(16,24,40,0.04)] hover:bg-slate-50 hover:border-slate-300",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
};
const btnSizes = { sm: "h-8 px-2.5 text-[13px]", md: "h-9 px-3.5 text-sm" };

export const Button = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: "sm" | "md"; loading?: boolean }>(
  function Button({ variant = "secondary", size = "md", loading, className, children, disabled, type = "button", ...rest }, ref) {
    return (
      <button ref={ref} type={type} disabled={disabled || loading} className={cn(btnBase, btnVariants[variant], btnSizes[size], className)} {...rest}>
        {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {children}
      </button>
    );
  },
);

export function ButtonLink({ href, variant = "secondary", size = "md", className, children }: { href: string; variant?: BtnVariant; size?: "sm" | "md"; className?: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={cn(btnBase, btnVariants[variant], btnSizes[size], className)}>
      {children}
    </Link>
  );
}

/** Icon-only button: always has an accessible label and a tooltip. */
export function IconButton({ label, children, className, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <span className="group relative inline-flex">
      <button type="button" aria-label={label} className={cn("inline-flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40", className)} {...rest}>
        {children}
      </button>
      <span role="tooltip" className="pointer-events-none absolute top-full left-1/2 z-50 mt-1 -translate-x-1/2 rounded-md bg-slate-900 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
        {label}
      </span>
    </span>
  );
}

export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("min-w-0 rounded-lg border border-line bg-white", className)} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }: { title: React.ReactNode; subtitle?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

const badgeTones = {
  slate: "bg-slate-100 text-slate-600",
  blue: "bg-brand-50 text-brand-700",
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-800",
  red: "bg-rose-50 text-rose-700",
  violet: "bg-teal-50 text-teal-700",
  cyan: "bg-sky-50 text-sky-700",
};
export type Tone = keyof typeof badgeTones;

export function Badge({ tone = "slate", children, className, dot }: { tone?: Tone; children: React.ReactNode; className?: string; dot?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-sm px-1.5 py-0.5 text-xs font-medium whitespace-nowrap", badgeTones[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}

export const LEAD_STATUS_META: Record<LeadStatus, { label: string; tone: Tone }> = {
  new: { label: "New", tone: "blue" },
  contacted: { label: "Contacted", tone: "cyan" },
  qualified: { label: "Qualified", tone: "amber" },
  converted: { label: "Converted", tone: "green" },
  rejected: { label: "Rejected", tone: "red" },
};

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  const m = LEAD_STATUS_META[status];
  return (
    <Badge tone={m.tone} dot>
      {m.label}
    </Badge>
  );
}

export function StageBadge({ name, kind }: { name: string; kind: StageKind }) {
  return (
    <Badge tone={kind === "won" ? "green" : kind === "lost" ? "red" : "blue"} dot>
      {name}
    </Badge>
  );
}

const avatarColors = ["bg-brand-100 text-brand-700", "bg-emerald-100 text-emerald-700", "bg-slate-200 text-slate-700", "bg-amber-100 text-amber-800", "bg-cyan-100 text-cyan-700", "bg-rose-100 text-rose-700"];
export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const hash = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  return (
    <span aria-hidden className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-semibold", avatarColors[hash % avatarColors.length], size === "sm" ? "size-6 text-[10px]" : size === "lg" ? "size-11 text-sm" : "size-8 text-xs")}>
      {initials(name)}
    </span>
  );
}

const inputCls = "h-9 w-full rounded-lg border border-line bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none disabled:bg-slate-50 aria-[invalid=true]:border-red-400 aria-[invalid=true]:ring-red-100";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...rest }, ref) {
  return <input ref={ref} className={cn(inputCls, className)} {...rest} />;
});

export { Select } from "@/components/select";

export function Textarea({ className, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputCls, "h-auto min-h-20 py-2", className)} {...rest} />;
}

export function Field({ label, error, hint, required, children, htmlFor }: { label: string; error?: string; hint?: string; required?: boolean; children: React.ReactNode; htmlFor?: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-[13px] font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function Checkbox({ className, ...rest }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input type="checkbox" className={cn("size-4 cursor-pointer rounded border-slate-300 accent-brand-600", className)} {...rest} />;
}

// Stack of open overlays so Escape only closes the topmost one.
const overlayStack: (() => void)[] = [];
if (typeof window !== "undefined") {
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlayStack.length) overlayStack[overlayStack.length - 1]();
  });
}

function useEscape(open: boolean, onClose: () => void) {
  const latest = useRef(onClose);
  useEffect(() => {
    latest.current = onClose;
  });
  useEffect(() => {
    if (!open) return;
    const fn = () => latest.current();
    overlayStack.push(fn);
    return () => {
      const i = overlayStack.lastIndexOf(fn);
      if (i >= 0) overlayStack.splice(i, 1);
    };
  }, [open]);
}

function useFocusFirst(open: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const root = ref.current;
    const el = root?.querySelector<HTMLElement>("[data-autofocus]") ?? root?.querySelector<HTMLElement>("input:not([disabled]), select:not([disabled]), textarea") ?? root?.querySelector<HTMLElement>("button");
    el?.focus();
    return () => prev?.focus?.();
  }, [open]);
  return ref;
}

export function Modal({ open, onClose, title, description, children, footer, size = "md" }: { open: boolean; onClose: () => void; title: string; description?: string; children: React.ReactNode; footer?: React.ReactNode; size?: "sm" | "md" | "lg" }) {
  useEscape(open, onClose);
  const ref = useFocusFirst(open);
  const titleId = useId();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 pt-[8vh]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId} className={cn("w-full rounded-lg bg-white shadow-xl", size === "sm" ? "max-w-md" : size === "lg" ? "max-w-3xl" : "max-w-xl")}>
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <h2 id={titleId} className="text-base font-semibold text-slate-900">
              {title}
            </h2>
            {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
          </div>
          <IconButton label="Close" onClick={onClose}>
            <X className="size-4" />
          </IconButton>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 rounded-b-xl border-t border-line bg-slate-50/60 px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = "Confirm", danger }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; message: React.ReactNode; confirmLabel?: string; danger?: boolean }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant={danger ? "danger" : "primary"}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-3 text-sm text-slate-600">
        {danger && <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-500" aria-hidden />}
        <div>{message}</div>
      </div>
    </Modal>
  );
}

export function Drawer({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode }) {
  useEscape(open, onClose);
  const ref = useFocusFirst(open);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title} className="animate-drawer flex h-full w-full max-w-md flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h2 className="text-base font-semibold">{title}</h2>
          <IconButton label="Close" onClick={onClose}>
            <X className="size-4" />
          </IconButton>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, description, action, className }: { icon?: React.ComponentType<{ className?: string }>; title: string; description?: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-14 text-center", className)}>
      <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <Icon className="size-5" />
      </div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function PermissionDenied({ what = "this page" }: { what?: string }) {
  return (
    <Card className="mx-auto mt-10 max-w-lg">
      <EmptyState icon={Lock} title="You don't have access" description={`Your role doesn't include permission to view ${what}. Ask your organization admin if you need access.`} action={<ButtonLink href="/dashboard">Back to dashboard</ButtonLink>} />
    </Card>
  );
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-16 text-sm text-muted">
      <Loader2 className="size-5 animate-spin text-brand-500" aria-hidden />
      {label}…
    </div>
  );
}

export function PageHeader({ title, description, actions, children }: { title: string; description?: React.ReactNode; actions?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
        {children}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { value: T; label: React.ReactNode }[] }) {
  return (
    <div role="tablist" className="inline-flex rounded-lg bg-slate-100/80 p-1">
      {items.map((it) => (
        <button
          key={it.value}
          role="tab"
          type="button"
          aria-selected={value === it.value}
          onClick={() => onChange(it.value)}
          className={cn("inline-flex h-7 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium transition-colors", value === it.value ? "bg-white text-slate-900 shadow-sm ring-1 ring-line" : "text-slate-500 hover:text-slate-900")}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

export function DemoTag() {
  return (
    <span title="Generated demo data stored in this browser" className="hidden rounded-sm bg-amber-100 sm:inline px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-amber-800 uppercase">
      Demo data
    </span>
  );
}
