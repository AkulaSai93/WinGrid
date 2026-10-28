import type { DB, Role, User } from "./types";

// Action permissions are kept separate from record scope, per the blueprint.
export type Action =
  | "lead.create"
  | "lead.edit"
  | "lead.delete"
  | "lead.assign"
  | "lead.import"
  | "lead.export"
  | "opp.create"
  | "opp.edit"
  | "task.assignOthers"
  | "analytics.team"
  | "users.view"
  | "users.manage"
  | "settings.manage"
  | "integrations.manage"
  | "audit.view"
  | "products.manage"
  | "platform.manage";

export type Scope = "own" | "team" | "organization" | "platform";

const MATRIX: Record<Role, Action[]> = {
  exec: ["lead.create", "lead.edit", "opp.create", "opp.edit"],
  manager: ["lead.create", "lead.edit", "lead.assign", "lead.import", "lead.export", "opp.create", "opp.edit", "task.assignOthers", "analytics.team", "users.view"],
  org_admin: [
    "lead.create", "lead.edit", "lead.delete", "lead.assign", "lead.import", "lead.export",
    "opp.create", "opp.edit", "task.assignOthers", "analytics.team", "users.view", "users.manage",
    "settings.manage", "integrations.manage", "audit.view", "products.manage",
  ],
  super_admin: [
    "lead.create", "lead.edit", "lead.delete", "lead.assign", "lead.import", "lead.export",
    "opp.create", "opp.edit", "task.assignOthers", "analytics.team", "users.view", "users.manage",
    "settings.manage", "integrations.manage", "audit.view", "products.manage", "platform.manage",
  ],
};

export const ROLE_LABEL: Record<Role, string> = {
  super_admin: "Super Admin",
  org_admin: "Organization Admin",
  manager: "Sales Manager",
  exec: "Sales Executive",
};

export const SCOPE_BY_ROLE: Record<Role, Scope> = {
  exec: "own",
  manager: "team",
  org_admin: "organization",
  super_admin: "platform",
};

export const ALL_ACTIONS: { action: Action; label: string }[] = [
  { action: "lead.create", label: "Create leads" },
  { action: "lead.edit", label: "Edit leads" },
  { action: "lead.assign", label: "Assign / reassign" },
  { action: "lead.import", label: "Import CSV" },
  { action: "lead.export", label: "Export CSV" },
  { action: "lead.delete", label: "Delete leads" },
  { action: "opp.edit", label: "Manage opportunities" },
  { action: "analytics.team", label: "Team analytics" },
  { action: "users.manage", label: "Manage users" },
  { action: "products.manage", label: "Manage products" },
  { action: "settings.manage", label: "Configure org" },
  { action: "audit.view", label: "View audit log" },
  { action: "platform.manage", label: "Manage platform" },
];

export function can(user: User | null | undefined, action: Action) {
  if (!user || user.status !== "active") return false;
  return MATRIX[user.role].includes(action);
}

export function roleCan(role: Role, action: Action) {
  return MATRIX[role].includes(action);
}

/** IDs of users whose records this user may see within an org. */
export function visibleOwnerIds(db: DB, user: User, orgId: string): Set<string> | "all" {
  const scope = SCOPE_BY_ROLE[user.role];
  if (scope === "organization" || scope === "platform") return "all";
  if (scope === "team") {
    return new Set(db.users.filter((u) => u.orgId === orgId && u.teamId && u.teamId === user.teamId).map((u) => u.id).concat(user.id));
  }
  return new Set([user.id]);
}

export function inScope(owners: Set<string> | "all", ownerId: string | null, allowUnassigned = false) {
  if (owners === "all") return true;
  if (ownerId === null) return allowUnassigned;
  return owners.has(ownerId);
}
