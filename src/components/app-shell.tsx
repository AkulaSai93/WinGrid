"use client";

import {
  Building2,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  Gauge,
  KanbanSquare,
  LineChart,
  LogOut,
  Menu,
  Package,
  Plug,
  RotateCcw,
  ScrollText,
  Search,
  Settings,
  Shield,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Logo } from "@/components/logo";
import { Avatar, Button, ConfirmDialog, DemoTag, LeadStatusBadge, Select, Spinner } from "@/components/ui";
import { type Action, can, ROLE_LABEL } from "@/lib/permissions";
import { useScoped } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; perm?: Action; needsOrg?: boolean };

const NAV: { section?: string; items: NavItem[] }[] = [
  {
    items: [
      { href: "/dashboard", label: "Dashboard", icon: Gauge, needsOrg: true },
      { href: "/leads", label: "Leads", icon: UsersRound, needsOrg: true },
      { href: "/accounts", label: "Accounts", icon: Building2, needsOrg: true },
      { href: "/opportunities", label: "Opportunities", icon: KanbanSquare, needsOrg: true },
      { href: "/products", label: "Products", icon: Package, needsOrg: true },
      { href: "/tasks", label: "Tasks & Activities", icon: ClipboardList, needsOrg: true },
      { href: "/analytics", label: "Analytics", icon: LineChart, needsOrg: true },
    ],
  },
  {
    section: "Organization",
    items: [
      { href: "/users", label: "Users & Teams", icon: Users, perm: "users.view", needsOrg: true },
      { href: "/settings", label: "Settings", icon: Settings, perm: "settings.manage", needsOrg: true },
      { href: "/integrations", label: "Integrations & Sync", icon: Plug, perm: "integrations.manage", needsOrg: true },
      { href: "/audit", label: "Audit log", icon: ScrollText, perm: "audit.view" },
    ],
  },
  {
    section: "Platform",
    items: [{ href: "/admin", label: "Super Admin", icon: Shield, perm: "platform.manage" }],
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { ready, user, orgId } = useStore();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (ready && !user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [ready, user, router, pathname]);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restore per-viewer preference
      setCollapsed(localStorage.getItem("wingrid.nav") === "collapsed");
    } catch {}
  }, []);

  const toggle = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem("wingrid.nav", c ? "open" : "collapsed");
      } catch {}
      return !c;
    });
  };

  if (!ready || !user) return <Spinner label="Loading workspace" />;

  const items = NAV.map((g) => ({ ...g, items: g.items.filter((i) => !i.perm || can(user, i.perm)) })).filter((g) => g.items.length);
  const current = items.flatMap((g) => g.items).find((i) => pathname === i.href || pathname.startsWith(i.href + "/"));
  const needsOrgButMissing = current?.needsOrg && !orgId;

  const nav = (
    <nav aria-label="Main" className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-2 scrollbar-thin">
      {items.map((g, gi) => (
        <div key={gi}>
          {g.section && !collapsed && <p className="mb-1.5 px-3 text-[11px] font-semibold tracking-[0.08em] text-slate-400 uppercase">{g.section}</p>}
          <ul className="space-y-0.5">
            {g.items.map((i) => {
              const active = pathname === i.href || pathname.startsWith(i.href + "/");
              const disabled = i.needsOrg && !orgId;
              return (
                <li key={i.href} className="group relative">
                  <Link
                    href={i.href}
                    onClick={() => setMobileOpen(false)}
                    aria-current={active ? "page" : undefined}
                    aria-label={collapsed ? i.label : undefined}
                    className={cn(
                      "flex h-9 items-center gap-3 rounded-xl px-3 text-[13.5px] font-medium transition-all",
                      active ? "bg-white text-slate-900 shadow-[0_1px_2px_rgba(16,24,40,0.06),0_0_0_1px_rgba(16,24,40,0.04)]" : "text-slate-500 hover:bg-white/70 hover:text-slate-900",
                      disabled && "opacity-50",
                      collapsed && "justify-center px-0",
                    )}
                  >
                    <i.icon className={cn("size-[18px] shrink-0", active ? "text-brand-600" : "text-slate-400 group-hover:text-slate-700")} strokeWidth={active ? 2.25 : 1.75} />
                    {!collapsed && <span className="truncate">{i.label}</span>}
                  </Link>
                  {collapsed && (
                    <span role="tooltip" className="pointer-events-none absolute top-1/2 left-full z-50 ml-2 -translate-y-1/2 rounded-md bg-slate-900 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 group-hover:opacity-100">
                      {i.label}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="fixed inset-0 flex overflow-hidden">
      {/* Desktop sidebar */}
      <aside className={cn("hidden shrink-0 flex-col transition-[width] md:flex", collapsed ? "w-[68px]" : "w-60")}>
        <div className={cn("flex h-16 items-center", collapsed ? "justify-center" : "px-5")}>
          <Link href="/dashboard" aria-label="WinGrid home">
            <Logo compact={collapsed} />
          </Link>
        </div>
        {nav}
        <div className="p-3">
          <button type="button" onClick={toggle} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} className={cn("flex h-8 w-full items-center gap-2 rounded-xl px-3 text-[13px] text-slate-400 hover:bg-white/70 hover:text-slate-700", collapsed && "justify-center px-0")}>
            {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
            {!collapsed && "Collapse"}
          </button>
        </div>
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex bg-slate-900/40 md:hidden" onMouseDown={(e) => e.target === e.currentTarget && setMobileOpen(false)}>
          <aside className="flex w-64 flex-col bg-canvas">
            <div className="flex h-16 items-center justify-between px-5">
              <Logo />
              <button type="button" aria-label="Close menu" onClick={() => setMobileOpen(false)} className="rounded-lg p-1.5 hover:bg-slate-100">
                <X className="size-5" />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setMobileOpen(true)} />
        <main className="relative flex-1 overflow-y-auto bg-white scrollbar-thin md:mr-2 md:mb-2 md:rounded-2xl md:border md:border-line md:shadow-[0_1px_3px_rgba(16,24,40,0.04)]">
          <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-8">
            {needsOrgButMissing ? <ChooseOrg /> : children}
          </div>
        </main>
      </div>
    </div>
  );
}

function ChooseOrg() {
  const { db, enterOrg } = useStore();
  return (
    <div className="mx-auto mt-10 max-w-lg rounded-xl border border-line bg-white p-6">
      <h1 className="text-base font-semibold">Choose an organization workspace</h1>
      <p className="mt-1 text-sm text-muted">Super Admins don&apos;t belong to an organization. Entering a workspace is deliberate and recorded in the audit log.</p>
      <ul className="mt-4 divide-y divide-line rounded-lg border border-line">
        {db.organizations.map((o) => (
          <li key={o.id} className="flex items-center justify-between px-3 py-2.5 text-sm">
            <span>
              {o.name} <span className="text-muted">· {o.subdomain}</span>
            </span>
            <Button size="sm" onClick={() => enterOrg(o.id)}>
              Enter
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Topbar({ onMenu }: { onMenu: () => void }) {
  const { user, org, db, logout, resetDemo, enterOrg } = useStore();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const h = (e: MouseEvent) => !menuRef.current?.contains(e.target as Node) && setMenuOpen(false);
    const k = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", h);
    document.addEventListener("keydown", k);
    return () => {
      document.removeEventListener("mousedown", h);
      document.removeEventListener("keydown", k);
    };
  }, [menuOpen]);

  if (!user) return null;
  return (
    <header className="flex h-16 shrink-0 items-center gap-3 px-3 sm:pr-4 sm:pl-2">
      <button type="button" onClick={onMenu} aria-label="Open menu" className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 md:hidden">
        <Menu className="size-5" />
      </button>
      <GlobalSearch />
      <div className="ml-auto flex items-center gap-2">
        <DemoTag />
        {user.role === "super_admin" ? (
          <div className="hidden w-48 sm:block">
            <Select aria-label="Organization workspace" size="sm" value={org?.id ?? ""} onChange={(e) => enterOrg(e.target.value || null)}>
              <option value="">Platform (no org)</option>
              {db.organizations.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </Select>
          </div>
        ) : (
          org && <span className="hidden text-[13px] font-medium text-slate-600 lg:inline">{org.name}</span>
        )}
        <div className="relative" ref={menuRef}>
          <button type="button" onClick={() => setMenuOpen((o) => !o)} aria-haspopup="menu" aria-expanded={menuOpen} className="flex items-center gap-2 rounded-lg py-1 pr-1.5 pl-1 hover:bg-slate-100">
            <Avatar name={user.name} />
            <span className="hidden text-left leading-tight lg:block">
              <span className="block text-[13px] font-medium text-slate-900">{user.name}</span>
              <span className="block text-[11px] text-muted">{ROLE_LABEL[user.role]}</span>
            </span>
            <ChevronDown className="size-4 text-slate-400" />
          </button>
          {menuOpen && (
            <div role="menu" className="absolute right-0 z-50 mt-1 w-64 rounded-xl border border-line bg-white p-1.5 shadow-lg">
              <div className="px-2.5 py-2">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted">{user.email}</p>
                <p className="mt-1 text-xs text-muted">
                  {ROLE_LABEL[user.role]}
                  {org ? ` · ${org.name}` : ""}
                </p>
              </div>
              <div className="my-1 h-px bg-line" />
              <button role="menuitem" type="button" onClick={() => { setMenuOpen(false); setConfirmReset(true); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-slate-700 hover:bg-slate-100">
                <RotateCcw className="size-4 text-slate-400" /> Reset demo data
              </button>
              <button role="menuitem" type="button" onClick={() => { logout(); router.push("/login"); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-slate-700 hover:bg-slate-100">
                <LogOut className="size-4 text-slate-400" /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={() => { resetDemo(); router.push("/login"); }}
        title="Reset demo data?"
        message="All changes made in this browser (leads, tasks, users, settings) will be replaced with fresh demo data and you'll be signed out."
        confirmLabel="Reset data"
        danger
      />
    </header>
  );
}

function GlobalSearch() {
  const { leads, opportunities } = useScoped();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (s.length < 2) return [];
    const ls = leads
      .filter((l) => `${l.firstName} ${l.lastName}`.toLowerCase().includes(s) || l.email.toLowerCase().includes(s) || l.phone.replace(/\s/g, "").includes(s.replace(/\s/g, "")) || l.company.toLowerCase().includes(s))
      .slice(0, 6)
      .map((l) => ({ id: l.id, href: `/leads/${l.id}`, title: `${l.firstName} ${l.lastName}`, sub: l.company || l.email, lead: l }));
    const os = opportunities
      .filter((o) => o.name.toLowerCase().includes(s))
      .slice(0, 3)
      .map((o) => ({ id: o.id, href: `/opportunities?open=${o.id}`, title: o.name, sub: "Opportunity", lead: null }));
    return [...ls, ...os];
  }, [q, leads, opportunities]);

  const go = (href: string) => {
    setOpen(false);
    setQ("");
    router.push(href);
  };

  return (
    <div className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
      <input
        ref={inputRef}
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(0); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
          if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
          if (e.key === "Enter" && results[active]) go(results[active].href);
          if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); }
        }}
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-controls="global-search-results"
        aria-label="Search leads and opportunities"
        placeholder="Search leads, phone, email…"
        className="h-9 w-full rounded-xl border border-transparent bg-white pr-14 pl-9 text-sm shadow-[0_0_0_1px_rgba(16,24,40,0.06)] placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 focus:outline-none"
      />
      <kbd className="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded border border-line bg-white px-1.5 text-[10px] text-slate-400 sm:block">⌘K</kbd>
      {open && q.trim().length >= 2 && (
        <div id="global-search-results" role="listbox" className="absolute top-full right-0 left-0 z-50 mt-1 overflow-hidden rounded-xl border border-line bg-white shadow-lg">
          {results.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted">No matches for “{q}”.</p>
          ) : (
            results.map((r, i) => (
              <button
                key={r.id}
                role="option"
                aria-selected={i === active}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => go(r.href)}
                onMouseEnter={() => setActive(i)}
                className={cn("flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm", i === active && "bg-brand-50")}
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-slate-900">{r.title}</span>
                  <span className="block truncate text-xs text-muted">{r.sub}</span>
                </span>
                {r.lead ? <LeadStatusBadge status={r.lead.status} /> : <KanbanSquare className="size-4 text-slate-400" />}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
