export type Role = "super_admin" | "org_admin" | "manager" | "exec";

export type Organization = {
  id: string;
  name: string;
  subdomain: string;
  plan: "Starter" | "Growth" | "Enterprise";
  status: "active" | "suspended";
  timezone: string;
  createdAt: string;
};

export type Team = {
  id: string;
  orgId: string;
  name: string;
  managerId: string | null;
};

export type UserStatus = "active" | "inactive" | "invited";

export type User = {
  id: string;
  orgId: string | null; // null for platform Super Admins
  teamId: string | null;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  password: string; // demo only — never store plaintext in production
  lastActiveAt: string | null;
};

export type LeadStatus = "new" | "contacted" | "qualified" | "rejected" | "converted";

export type Lead = {
  id: string;
  orgId: string;
  ownerId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  jobTitle: string;
  city: string;
  source: string;
  status: LeadStatus;
  rejectReason?: string;
  createdAt: string;
  updatedAt: string;
};

export type StageKind = "open" | "won" | "lost";

export type Stage = {
  id: string;
  orgId: string;
  name: string;
  order: number;
  kind: StageKind;
  probability: number;
};

export type Opportunity = {
  id: string;
  orgId: string;
  ownerId: string | null;
  leadId: string | null;
  name: string;
  value: number;
  stageId: string;
  closeDate: string;
  outcomeReason?: string;
  createdAt: string;
  updatedAt: string;
};

export type ActivityType = "call" | "email" | "meeting" | "note" | "status" | "stage" | "system";

export type Activity = {
  id: string;
  orgId: string;
  userId: string;
  leadId: string | null;
  oppId: string | null;
  type: ActivityType;
  subject: string;
  body?: string;
  outcome?: string;
  at: string;
};

export type TaskType = "call" | "email" | "meeting" | "todo";

export type Task = {
  id: string;
  orgId: string;
  ownerId: string;
  leadId: string | null;
  oppId: string | null;
  title: string;
  type: TaskType;
  priority: "low" | "normal" | "high";
  dueAt: string;
  completedAt: string | null;
  createdAt: string;
};

export type AuditEvent = {
  id: string;
  orgId: string | null;
  userId: string;
  action: string;
  entity: string;
  entityId: string | null;
  detail: string;
  at: string;
};

export type LeadFilters = {
  q: string;
  status: LeadStatus[];
  source: string[];
  ownerId: string[]; // "unassigned" is allowed
};

export type SavedView = {
  id: string;
  orgId: string;
  userId: string;
  name: string;
  filters: LeadFilters;
  shared: boolean;
};

export type OrgSettings = {
  orgId: string;
  leadSources: string[];
  lossReasons: string[];
  rejectReasons: string[];
  currency: string;
};

export type Product = {
  id: string;
  orgId: string;
  name: string;
  description: string;
  memberIds: string[];
  status: "active" | "archived";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type DB = {
  version: number;
  organizations: Organization[];
  teams: Team[];
  users: User[];
  leads: Lead[];
  stages: Stage[];
  opportunities: Opportunity[];
  activities: Activity[];
  tasks: Task[];
  audit: AuditEvent[];
  savedViews: SavedView[];
  settings: OrgSettings[];
  products: Product[];
};

export type Session = {
  userId: string;
  activeOrgId: string | null; // Super Admins may enter an org deliberately
};
