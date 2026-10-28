"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import { Children, Fragment, isValidElement, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type Opt = { value: string; label: string; disabled: boolean };

function textOf(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement<{ children?: React.ReactNode }>(node)) return textOf(node.props.children);
  return "";
}

/** Reads <option> children (through fragments/arrays/optgroups) so call sites keep native-style markup. */
function collect(children: React.ReactNode, out: Opt[] = []): Opt[] {
  Children.forEach(children, (child) => {
    if (!isValidElement<{ children?: React.ReactNode; value?: string | number; disabled?: boolean }>(child)) return;
    if (child.type === "option") {
      const label = textOf(child.props.children);
      out.push({ value: child.props.value !== undefined ? String(child.props.value) : label, label, disabled: !!child.props.disabled });
    } else if (child.type === Fragment || child.type === "optgroup") collect(child.props.children, out);
  });
  return out;
}

export type SelectProps = {
  id?: string;
  value?: string | number;
  onChange?: (e: { target: { value: string } }) => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md";
  placeholder?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
};

/**
 * Styled replacement for <select>: same props and <option> children, but a consistent
 * listbox menu (portal-positioned so tables/modals never clip it), keyboard support,
 * type-to-filter for long lists, and a checkmark on the selected option.
 */
export function Select({ id, value, onChange, children, disabled, className, size = "md", placeholder = "Select…", ...aria }: SelectProps) {
  // Call sites size the control with h-8 / w-44 etc.; honour those instead of fighting the defaults.
  const extra = (className ?? "").split(/\s+/).filter((c) => c && c !== "h-8" && c !== "text-[13px]");
  const small = size === "sm" || /(^|\s)h-8(\s|$)/.test(className ?? "");
  const hasWidth = extra.some((c) => /^w-/.test(c));
  const all = collect(children);
  // `value=""` options labelled "Something…" are prompts, not choices: grey in the trigger, hidden in the menu.
  const isPrompt = (o: Opt) => o.value === "" && (o.disabled || o.label.endsWith("…"));
  const current = all.find((o) => o.value === String(value ?? ""));
  const options = all.filter((o) => !isPrompt(o));
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [query, setQuery] = useState("");
  const [pos, setPos] = useState<{ left: number; top: number; width: number; up: boolean; maxH: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const searchable = options.length > 8;

  const visible = options.filter((o) => !query || o.label.toLowerCase().includes(query.toLowerCase()));

  const place = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const below = window.innerHeight - r.bottom - 8;
    const above = r.top - 8;
    const want = Math.min(320, options.length * 36 + (searchable ? 48 : 8));
    const up = below < Math.min(want, 220) && above > below;
    setPos({ left: Math.min(r.left, window.innerWidth - Math.max(r.width, 200) - 8), top: up ? r.top - 4 : r.bottom + 4, width: Math.max(r.width, 200), up, maxH: Math.min(320, up ? above : below) });
  };

  const openMenu = () => {
    if (disabled) return;
    place();
    setQuery("");
    const i = options.findIndex((o) => o.value === current?.value);
    setActive(Math.max(0, i));
    setOpen(true);
  };
  const close = (focus = true) => {
    setOpen(false);
    if (focus) btnRef.current?.focus();
  };
  const choose = (o: Opt) => {
    if (o.disabled) return;
    close();
    if (o.value !== String(value ?? "")) onChange?.({ target: { value: o.value } });
  };

  useLayoutEffect(() => {
    if (open && searchable) searchRef.current?.focus();
  }, [open, searchable]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!listRef.current?.contains(e.target as Node) && !btnRef.current?.contains(e.target as Node)) close(false);
    };
    // Follow the trigger when an ancestor scrolls; close only once it leaves the viewport.
    const onScroll = (e: Event) => {
      if (listRef.current?.contains(e.target as Node)) return;
      const r = btnRef.current?.getBoundingClientRect();
      if (!r || r.bottom < 0 || r.top > window.innerHeight) close(false);
      else place();
    };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", place);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", place);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (open) listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const move = (dir: 1 | -1) => {
    if (!visible.length) return;
    let i = active;
    for (let n = 0; n < visible.length; n++) {
      i = (i + dir + visible.length) % visible.length;
      if (!visible[i].disabled) break;
    }
    setActive(i);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    if (e.key === "Escape") {
      // Keep Escape from also closing a surrounding modal or drawer.
      e.preventDefault();
      e.stopPropagation();
      e.nativeEvent.stopImmediatePropagation();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      move(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      move(-1);
    } else if (e.key === "Enter" || (e.key === " " && !searchable)) {
      e.preventDefault();
      if (visible[active]) choose(visible[active]);
    } else if (e.key === "Tab") close(false);
  };

  const showPlaceholder = !current || isPrompt(current);

  return (
    <>
      <button
        ref={btnRef}
        id={id}
        type="button"
        disabled={disabled}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={aria["aria-label"]}
        aria-invalid={aria["aria-invalid"]}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={onKey}
        className={cn(
          "group inline-flex items-center justify-between gap-2 rounded-xl border border-line bg-white text-left text-slate-900 transition-colors hover:border-slate-300 focus:outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 aria-[invalid=true]:border-red-400",
          small ? "h-8 px-2.5 text-[13px]" : "h-9 px-3 text-sm",
          !hasWidth && "w-full",
          open && "border-brand-500 ring-2 ring-brand-100",
          extra.join(" "),
        )}
      >
        <span className={cn("truncate", showPlaceholder && "text-slate-400")}>{showPlaceholder ? (current?.label ?? placeholder) : current.label}</span>
        <ChevronDown className={cn("size-4 shrink-0 text-slate-400 transition-transform", open && "rotate-180 text-brand-600")} aria-hidden />
      </button>
      {open &&
        pos &&
        createPortal(
          <div
            ref={listRef}
            onKeyDown={onKey}
            style={{ left: pos.left, top: pos.top, width: pos.width, maxHeight: pos.maxH, transform: pos.up ? "translateY(-100%)" : undefined }}
            className="fixed z-[70] flex flex-col overflow-hidden rounded-xl border border-line bg-white shadow-[0_12px_32px_-8px_rgba(15,23,42,0.18)]"
          >
            {searchable && (
              <div className="relative border-b border-line p-1.5">
                <Search className="pointer-events-none absolute top-1/2 left-4 size-3.5 -translate-y-1/2 text-slate-400" aria-hidden />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActive(0);
                  }}
                  placeholder="Search…"
                  aria-label="Filter options"
                  aria-controls={listId}
                  aria-activedescendant={visible[active] ? `${listId}-${active}` : undefined}
                  className="h-8 w-full rounded-md bg-slate-50 pr-2 pl-7 text-[13px] placeholder:text-slate-400 focus:bg-white focus:outline-none"
                />
              </div>
            )}
            <ul id={listId} role="listbox" aria-label={aria["aria-label"]} className="overflow-y-auto p-1 scrollbar-thin">
              {visible.length === 0 && <li className="px-2.5 py-2 text-[13px] text-muted">No matches</li>}
              {visible.map((o, i) => {
                const selected = o.value === String(value ?? "") && !o.disabled;
                return (
                  <li
                    key={`${o.value}-${i}`}
                    id={`${listId}-${i}`}
                    data-index={i}
                    role="option"
                    aria-selected={selected}
                    aria-disabled={o.disabled || undefined}
                    onMouseEnter={() => !o.disabled && setActive(i)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => choose(o)}
                    className={cn(
                      "flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-[13px]",
                      o.disabled ? "cursor-default text-[11px] font-semibold tracking-wide text-slate-400 uppercase" : i === active ? "bg-brand-50 text-brand-800" : "text-slate-700",
                      selected && "font-medium",
                    )}
                  >
                    <span className="truncate">{o.label}</span>
                    {selected && <Check className="size-4 shrink-0 text-brand-600" aria-hidden />}
                  </li>
                );
              })}
            </ul>
          </div>,
          document.body,
        )}
    </>
  );
}
