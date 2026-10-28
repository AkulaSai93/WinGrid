"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createSeed, DB_VERSION } from "./seed";
import type {
  Activity,
  ActivityType,
  DB,
  Lead,
  LeadFilters,
  LeadStatus,
  Opportunity,
  OrgSettings,
  Organization,
  Product,
  Role,
  Session,
  Stage,
  Task,
  User,
} from "./types";
import { normalizePhone, uid } from "./utils";

const DB_KEY = "wingrid.db";
const SESSION_KEY = "wingrid.session";

export type Toast = { id: string; message: string; kind: "success" | "error" | "info" };

export type LeadInput = Pick<Lead, "firstName" | "lastName" | "email" | "phone" | "company" | "jobTitle" | "city" | "source"> & {
  ownerId: string | null;
};

type Mutator = (db: DB) => void;

type StoreValue = {
  ready: boolean;
  db: DB;
  session: Session | null;
  user: User | null;
  orgId: string | null;
  org: Organization | null;
  settings: OrgSettings | null;
  stages: Stage[];
  orgUsers: User[];
  toasts: Toast[];
  toast: (message: string, kind?: Toast["kind"]) => void;
  dismissToast: (id: string) => void;
  login: (email: string, password: string) => { ok: true; user: User } | { ok: false; error: string };
  logout: () => void;
  enterOrg: (orgId: string | null) => void;
  resetDemo: () => void;
  findDuplicates: (email: string, phone: string, excludeId?: string) => Lead[];
  createLead: (input: LeadInput) => string;
  updateLead: (id: string, patch: Partial<Lead>) => void;
  setLeadStatus: (ids: string[], status: LeadStatus, reason?: string) => void;
  assignLeads: (ids: string[], ownerId: string | null) => void;
  deleteLeads: (ids: string[]) => void;
  importLeads: (rows: LeadInput[]) => number;
  logActivity: (a: { leadId: string | null; oppId: string | null; type: ActivityType; subject: string; body?: string; outcome?: string }) => void;
  createTask: (t: Omit<Task, "id" | "orgId" | "createdAt" | "completedAt">) => void;
  toggleTask: (id: string) => void;
  convertLead: (leadId: string, opp: { name: string; value: number; stageId: string; closeDate: string }) => string;
  createOpportunity: (opp: Omit<Opportunity, "id" | "orgId" | "createdAt" | "updatedAt">) => string;
  moveOpportunity: (oppId: string, stageId: string, reason?: string) => void;
  updateOpportunity: (oppId: string, patch: Partial<Opportunity>) => void;
  inviteUser: (u: { name: string; email: string; role: Role; teamId: string | null }) => void;
  updateUser: (id: string, patch: Partial<Pick<User, "role" | "teamId" | "status" | "name">>) => void;
  createTeam: (name: string, managerId: string | null) => void;
  updateOrg: (patch: Partial<Organization>) => void;
  updateSettings: (patch: Partial<OrgSettings>) => void;
  saveStages: (stages: Stage[]) => void;
  setOrgStatus: (orgId: string, status: Organization["status"]) => void;
  saveView: (name: string, filters: LeadFilters, shared: boolean) => void;
  deleteView: (id: string) => void;
  createProduct: (p: { name: string; description: string; memberIds: string[] }) => string;
  updateProduct: (id: string, patch: Partial<Pick<Product, "name" | "description" | "memberIds" | "status">>) => void;
  deleteProduct: (id: string) => void;
};

const StoreContext = createContext<StoreValue | null>(null);

function loadDB(): DB {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DB;
      if (parsed.version === DB_VERSION) {
        // Migrate data saved before products existed (seed ids are deterministic).
        if (!parsed.products) parsed.products = createSeed().products;
        return parsed;
      }
    }
  } catch {
    /* fall through to seed */
  }
  return createSeed();
}

const EMPTY_DB: DB = { version: DB_VERSION, organizations: [], teams: [], users: [], leads: [], stages: [], opportunities: [], activities: [], tasks: [], audit: [], savedViews: [], settings: [], products: [] };

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<DB>(EMPTY_DB);
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- hydrate client-only state from localStorage once */
    setDb(loadDB());
    try {
      const s = localStorage.getItem(SESSION_KEY);
      if (s) setSession(JSON.parse(s));
    } catch {}
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(db));
    } catch {}
  }, [db, ready]);

  useEffect(() => {
    if (!ready) return;
    try {
      if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      else localStorage.removeItem(SESSION_KEY);
    } catch {}
  }, [session, ready]);

  const user = useMemo(() => db.users.find((u) => u.id === session?.userId) ?? null, [db.users, session]);
  const orgId = user ? (user.orgId ?? session?.activeOrgId ?? null) : null;
  const org = db.organizations.find((o) => o.id === orgId) ?? null;
  const settings = db.settings.find((s) => s.orgId === orgId) ?? null;
  const stages = useMemo(() => db.stages.filter((s) => s.orgId === orgId).sort((a, b) => a.order - b.order), [db.stages, orgId]);
  const orgUsers = useMemo(() => db.users.filter((u) => u.orgId === orgId), [db.users, orgId]);

  const toast = useCallback((message: string, kind: Toast["kind"] = "success") => {
    const id = uid("t");
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);
  const dismissToast = useCallback((id: string) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  // Every mutation is scoped to the active org and stamped with the acting user.
  const ctx = { current: { userId: user?.id ?? "", orgId: orgId ?? "" } };

  const commit = useCallback((fn: Mutator) => {
    setDb((prev) => {
      const next = structuredClone(prev);
      fn(next);
      return next;
    });
  }, []);

  const audit = (d: DB, action: string, entity: string, entityId: string | null, detail: string, orgOverride?: string | null) => {
    d.audit.unshift({ id: uid("au"), orgId: orgOverride !== undefined ? orgOverride : ctx.current.orgId || null, userId: ctx.current.userId, action, entity, entityId, detail, at: new Date().toISOString() });
    if (d.audit.length > 1000) d.audit.length = 1000;
  };
  const activity = (d: DB, a: Omit<Activity, "id" | "orgId" | "userId" | "at">) => {
    d.activities.push({ id: uid("ac"), orgId: ctx.current.orgId, userId: ctx.current.userId, at: new Date().toISOString(), ...a });
  };
  const nameOf = (d: DB, userId: string | null) => (userId ? (d.users.find((u) => u.id === userId)?.name ?? "Unknown") : "Unassigned");

  const value: StoreValue = {
    ready,
    db,
    session,
    user,
    orgId,
    org,
    settings,
    stages,
    orgUsers,
    toasts,
    toast,
    dismissToast,

    login(email, password) {
      const u = db.users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
      // Neutral error message: never reveal whether the email exists.
      if (!u || u.password !== password) return { ok: false, error: "Email or password is incorrect." };
      if (u.status !== "active") return { ok: false, error: "This account is not active. Contact your administrator." };
      if (u.orgId && db.organizations.find((o) => o.id === u.orgId)?.status !== "active") return { ok: false, error: "Your organization's workspace is suspended. Contact your administrator." };
      const s = { userId: u.id, activeOrgId: u.orgId };
      setSession(s);
      commit((d) => {
        const du = d.users.find((x) => x.id === u.id)!;
        du.lastActiveAt = new Date().toISOString();
        d.audit.unshift({ id: uid("au"), orgId: u.orgId, userId: u.id, action: "auth.login", entity: "user", entityId: u.id, detail: "Signed in", at: new Date().toISOString() });
      });
      return { ok: true, user: u };
    },
    logout() {
      setSession(null);
    },
    enterOrg(target) {
      if (!user || user.role !== "super_admin") return;
      setSession((s) => (s ? { ...s, activeOrgId: target } : s));
      if (target) {
        const name = db.organizations.find((o) => o.id === target)?.name;
        commit((d) => audit(d, "platform.enter_org", "organization", target, `Super Admin entered ${name} workspace`, target));
      }
    },
    resetDemo() {
      const fresh = createSeed();
      setDb(fresh);
      setSession(null);
      toast("Demo data reset");
    },

    findDuplicates(email, phone, excludeId) {
      const e = email.trim().toLowerCase();
      const p = normalizePhone(phone);
      return db.leads.filter((l) => l.orgId === orgId && l.id !== excludeId && ((e && l.email.toLowerCase() === e) || (p.length >= 10 && normalizePhone(l.phone) === p)));
    },
    createLead(input) {
      const id = uid("ld");
      const now = new Date().toISOString();
      commit((d) => {
        d.leads.unshift({ id, orgId: ctx.current.orgId, status: "new", createdAt: now, updatedAt: now, ...input });
        activity(d, { leadId: id, oppId: null, type: "system", subject: `Lead created manually (${input.source})` });
        audit(d, "lead.create", "lead", id, `Created lead ${input.firstName} ${input.lastName}, owner ${nameOf(d, input.ownerId)}`);
      });
      return id;
    },
    updateLead(id, patch) {
      commit((d) => {
        const l = d.leads.find((x) => x.id === id && x.orgId === ctx.current.orgId);
        if (!l) return;
        const changed = Object.keys(patch).filter((k) => l[k as keyof Lead] !== patch[k as keyof Lead]);
        Object.assign(l, patch, { updatedAt: new Date().toISOString() });
        if (changed.length) audit(d, "lead.update", "lead", id, `Updated ${changed.join(", ")}`);
      });
    },
    setLeadStatus(ids, status, reason) {
      commit((d) => {
        for (const id of ids) {
          const l = d.leads.find((x) => x.id === id && x.orgId === ctx.current.orgId);
          if (!l || l.status === status) continue;
          const from = l.status;
          l.status = status;
          l.rejectReason = status === "rejected" ? reason : undefined;
          l.updatedAt = new Date().toISOString();
          activity(d, { leadId: id, oppId: null, type: "status", subject: `Status changed from ${from} to ${status}${reason ? ` — ${reason}` : ""}` });
          audit(d, "lead.status", "lead", id, `${from} → ${status}`);
        }
      });
    },
    assignLeads(ids, ownerId) {
      commit((d) => {
        for (const id of ids) {
          const l = d.leads.find((x) => x.id === id && x.orgId === ctx.current.orgId);
          if (!l || l.ownerId === ownerId) continue;
          const from = nameOf(d, l.ownerId);
          l.ownerId = ownerId;
          l.updatedAt = new Date().toISOString();
          activity(d, { leadId: id, oppId: null, type: "system", subject: `Owner changed from ${from} to ${nameOf(d, ownerId)}` });
          audit(d, "lead.assign", "lead", id, `${from} → ${nameOf(d, ownerId)}`);
        }
      });
    },
    deleteLeads(ids) {
      commit((d) => {
        const set = new Set(ids);
        const removed = d.leads.filter((l) => set.has(l.id) && l.orgId === ctx.current.orgId);
        d.leads = d.leads.filter((l) => !removed.includes(l));
        d.tasks = d.tasks.filter((t) => !t.leadId || !set.has(t.leadId));
        audit(d, "lead.delete", "lead", null, `Deleted ${removed.length} lead(s): ${removed.map((l) => `${l.firstName} ${l.lastName}`).slice(0, 5).join(", ")}${removed.length > 5 ? "…" : ""}`);
      });
    },
    importLeads(rows) {
      const now = new Date().toISOString();
      commit((d) => {
        for (const r of rows) {
          const id = uid("ld");
          d.leads.unshift({ id, orgId: ctx.current.orgId, status: "new", createdAt: now, updatedAt: now, ...r });
          activity(d, { leadId: id, oppId: null, type: "system", subject: "Lead created via CSV import" });
        }
        audit(d, "lead.import", "lead", null, `Imported ${rows.length} lead(s) from CSV`);
      });
      return rows.length;
    },

    logActivity(a) {
      commit((d) => {
        activity(d, a);
        if (a.leadId) {
          const l = d.leads.find((x) => x.id === a.leadId);
          if (l) {
            l.updatedAt = new Date().toISOString();
            if (l.status === "new" && (a.type === "call" || a.type === "email" || a.type === "meeting")) {
              l.status = "contacted";
              activity(d, { leadId: l.id, oppId: null, type: "status", subject: "Status changed from new to contacted (first touch)" });
            }
          }
        }
      });
    },
    createTask(t) {
      commit((d) => {
        const id = uid("tk");
        d.tasks.push({ id, orgId: ctx.current.orgId, createdAt: new Date().toISOString(), completedAt: null, ...t });
        if (t.ownerId !== ctx.current.userId) audit(d, "task.assign", "task", id, `Assigned "${t.title}" to ${nameOf(d, t.ownerId)}`);
      });
    },
    toggleTask(id) {
      commit((d) => {
        const t = d.tasks.find((x) => x.id === id && x.orgId === ctx.current.orgId);
        if (!t) return;
        t.completedAt = t.completedAt ? null : new Date().toISOString();
        if (t.completedAt && (t.leadId || t.oppId)) activity(d, { leadId: t.leadId, oppId: t.oppId, type: t.type === "todo" ? "note" : t.type, subject: `Completed task: ${t.title}` });
      });
    },

    convertLead(leadId, opp) {
      const id = uid("op");
      commit((d) => {
        const l = d.leads.find((x) => x.id === leadId && x.orgId === ctx.current.orgId);
        if (!l) return;
        const now = new Date().toISOString();
        const stage = d.stages.find((s) => s.id === opp.stageId);
        d.opportunities.unshift({ id, orgId: ctx.current.orgId, ownerId: l.ownerId, leadId, createdAt: now, updatedAt: now, ...opp });
        l.status = "converted";
        l.updatedAt = now;
        activity(d, { leadId, oppId: id, type: "stage", subject: `Converted to opportunity "${opp.name}" in ${stage?.name}` });
        audit(d, "lead.convert", "opportunity", id, `Converted ${l.firstName} ${l.lastName} → ${opp.name}`);
      });
      return id;
    },
    createOpportunity(opp) {
      const id = uid("op");
      commit((d) => {
        const now = new Date().toISOString();
        d.opportunities.unshift({ id, orgId: ctx.current.orgId, createdAt: now, updatedAt: now, ...opp });
        activity(d, { leadId: opp.leadId, oppId: id, type: "stage", subject: `Opportunity "${opp.name}" created` });
        audit(d, "opp.create", "opportunity", id, `Created ${opp.name}`);
      });
      return id;
    },
    moveOpportunity(oppId, stageId, reason) {
      commit((d) => {
        const o = d.opportunities.find((x) => x.id === oppId && x.orgId === ctx.current.orgId);
        if (!o || o.stageId === stageId) return;
        const from = d.stages.find((s) => s.id === o.stageId)?.name;
        const to = d.stages.find((s) => s.id === stageId);
        o.stageId = stageId;
        o.outcomeReason = to?.kind === "open" ? undefined : reason;
        o.updatedAt = new Date().toISOString();
        if (to?.kind !== "open") o.closeDate = o.updatedAt;
        activity(d, { leadId: o.leadId, oppId, type: "stage", subject: `Stage moved ${from} → ${to?.name}${reason ? ` (${reason})` : ""}` });
        audit(d, "opp.stage", "opportunity", oppId, `${o.name}: ${from} → ${to?.name}`);
      });
    },
    updateOpportunity(oppId, patch) {
      commit((d) => {
        const o = d.opportunities.find((x) => x.id === oppId && x.orgId === ctx.current.orgId);
        if (!o) return;
        Object.assign(o, patch, { updatedAt: new Date().toISOString() });
        audit(d, "opp.update", "opportunity", oppId, `Updated ${Object.keys(patch).join(", ")}`);
      });
    },

    inviteUser(u) {
      commit((d) => {
        const id = uid("u");
        d.users.push({ id, orgId: ctx.current.orgId, teamId: u.teamId, name: u.name, email: u.email, role: u.role, status: "invited", password: "", lastActiveAt: null });
        audit(d, "user.invite", "user", id, `Invited ${u.email} as ${u.role}`);
      });
    },
    updateUser(id, patch) {
      commit((d) => {
        const u = d.users.find((x) => x.id === id && x.orgId === ctx.current.orgId);
        if (!u) return;
        const changes = Object.entries(patch).filter(([k, v]) => u[k as keyof User] !== v).map(([k, v]) => `${k}: ${String(u[k as keyof User])} → ${String(v)}`);
        Object.assign(u, patch);
        if (changes.length) audit(d, "user.update", "user", id, `${u.name} — ${changes.join("; ")}`);
      });
    },
    createTeam(name, managerId) {
      commit((d) => {
        const id = uid("team");
        d.teams.push({ id, orgId: ctx.current.orgId, name, managerId });
        if (managerId) {
          const m = d.users.find((u) => u.id === managerId);
          if (m) m.teamId = id;
        }
        audit(d, "team.create", "team", id, `Created team ${name}`);
      });
    },
    updateOrg(patch) {
      commit((d) => {
        const o = d.organizations.find((x) => x.id === ctx.current.orgId);
        if (!o) return;
        Object.assign(o, patch);
        audit(d, "org.update", "organization", o.id, `Updated ${Object.keys(patch).join(", ")}`);
      });
    },
    updateSettings(patch) {
      commit((d) => {
        const s = d.settings.find((x) => x.orgId === ctx.current.orgId);
        if (!s) return;
        Object.assign(s, patch);
        audit(d, "settings.update", "settings", null, `Updated ${Object.keys(patch).join(", ")}`);
      });
    },
    saveStages(next) {
      commit((d) => {
        d.stages = d.stages.filter((s) => s.orgId !== ctx.current.orgId).concat(next.map((s, i) => ({ ...s, orgId: ctx.current.orgId, order: i })));
        audit(d, "settings.stages", "pipeline", null, `Pipeline stages: ${next.map((s) => s.name).join(" → ")}`);
      });
    },
    setOrgStatus(target, status) {
      commit((d) => {
        const o = d.organizations.find((x) => x.id === target);
        if (!o) return;
        o.status = status;
        audit(d, "platform.org_status", "organization", target, `${o.name} set to ${status}`, null);
      });
    },
    saveView(name, filters, shared) {
      commit((d) => {
        d.savedViews.push({ id: uid("sv"), orgId: ctx.current.orgId, userId: ctx.current.userId, name, filters, shared });
      });
    },
    createProduct(p) {
      const id = uid("pr");
      const now = new Date().toISOString();
      commit((d) => {
        d.products.push({ id, orgId: ctx.current.orgId, status: "active", createdBy: ctx.current.userId, createdAt: now, updatedAt: now, ...p });
        audit(d, "product.create", "product", id, `Created product ${p.name} with ${p.memberIds.length} member(s)`);
      });
      return id;
    },
    updateProduct(id, patch) {
      commit((d) => {
        const p = d.products.find((x) => x.id === id && x.orgId === ctx.current.orgId);
        if (!p) return;
        const notes: string[] = [];
        if (patch.memberIds) {
          const added = patch.memberIds.filter((m) => !p.memberIds.includes(m)).map((m) => nameOf(d, m));
          const removed = p.memberIds.filter((m) => !patch.memberIds!.includes(m)).map((m) => nameOf(d, m));
          if (added.length) notes.push(`added ${added.join(", ")}`);
          if (removed.length) notes.push(`removed ${removed.join(", ")}`);
        }
        if (patch.name !== undefined && patch.name !== p.name) notes.push(`renamed ${p.name} → ${patch.name}`);
        if (patch.description !== undefined && patch.description !== p.description) notes.push("updated description");
        if (patch.status && patch.status !== p.status) notes.push(patch.status === "archived" ? "archived" : "restored");
        Object.assign(p, patch, { updatedAt: new Date().toISOString() });
        if (notes.length) audit(d, "product.update", "product", id, `${p.name}: ${notes.join("; ")}`);
      });
    },
    deleteProduct(id) {
      commit((d) => {
        const p = d.products.find((x) => x.id === id && x.orgId === ctx.current.orgId);
        if (!p) return;
        d.products = d.products.filter((x) => x !== p);
        audit(d, "product.delete", "product", id, `Deleted product ${p.name}`);
      });
    },
    deleteView(id) {
      commit((d) => {
        d.savedViews = d.savedViews.filter((v) => !(v.id === id && v.userId === ctx.current.userId));
      });
    },
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const v = useContext(StoreContext);
  if (!v) throw new Error("useStore must be used inside StoreProvider");
  return v;
}
