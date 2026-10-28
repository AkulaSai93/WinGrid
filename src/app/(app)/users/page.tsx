"use client";

import { Check, Minus, Plus, Search, UserPlus } from "lucide-react";
import { useState } from "react";
import { Avatar, Badge, Button, Card, CardHeader, ConfirmDialog, EmptyState, Field, Input, Modal, PermissionDenied, Select, Tabs } from "@/components/ui";
import { ALL_ACTIONS, can, ROLE_LABEL, roleCan, SCOPE_BY_ROLE } from "@/lib/permissions";
import { useStore } from "@/lib/store";
import type { Role, User } from "@/lib/types";
import { EMAIL_RE, relativeTime } from "@/lib/utils";

const ORG_ROLES: Role[] = ["org_admin", "manager", "exec"];
const SCOPE_LABEL = { own: "Own records", team: "Team records", organization: "Whole organization", platform: "All organizations" };

export default function UsersPage() {
  const { user, db, orgId, orgUsers, updateUser, toast } = useStore();
  const [tab, setTab] = useState<"users" | "teams" | "roles">("users");
  const [q, setQ] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);
  const [deactivate, setDeactivate] = useState<User | null>(null);

  if (!can(user, "users.view")) return <PermissionDenied what="users and teams" />;
  const manage = can(user, "users.manage");
  const teams = db.teams.filter((t) => t.orgId === orgId);
  const list = orgUsers
    .filter((u) => user?.role !== "manager" || u.teamId === user.teamId || u.id === user.id)
    .filter((u) => !q.trim() || `${u.name} ${u.email}`.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => ORG_ROLES.indexOf(a.role) - ORG_ROLES.indexOf(b.role) || a.name.localeCompare(b.name));
  const teamName = (id: string | null) => teams.find((t) => t.id === id)?.name ?? "—";

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users & Teams</h1>
          <p className="mt-0.5 text-sm text-muted">{manage ? "Invite people, set their role and team, and control access." : "Your team members. Only admins can change roles."}</p>
        </div>
        <div className="flex gap-2">
          <Tabs value={tab} onChange={setTab} items={[{ value: "users", label: "Users" }, { value: "teams", label: "Teams" }, { value: "roles", label: "Roles & permissions" }]} />
          {manage && tab === "users" && <Button variant="primary" onClick={() => setInviteOpen(true)}><UserPlus className="size-4" /> Invite user</Button>}
          {manage && tab === "teams" && <Button variant="primary" onClick={() => setTeamOpen(true)}><Plus className="size-4" /> New team</Button>}
        </div>
      </div>

      {tab === "users" && (
        <>
          <div className="relative mb-3 w-full sm:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people" aria-label="Search users" className="h-8 pl-8 text-[13px]" />
          </div>
          <Card className="overflow-hidden">
            {list.length === 0 ? <EmptyState title="No users match" /> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[780px] text-[13px]">
                  <thead className="border-b border-line bg-white text-left text-[11px] font-semibold tracking-[0.06em] text-slate-400 uppercase">
                    <tr>{["Name", "Role", "Team", "Status", "Last active", ""].map((h, i) => <th key={i} className="px-4 py-2.5 font-medium">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {list.map((u) => {
                      const self = u.id === user?.id;
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/60">
                          <td className="px-4 py-2.5">
                            <span className="flex items-center gap-2.5">
                              <Avatar name={u.name} />
                              <span><span className="block font-medium text-slate-900">{u.name}{self && <span className="ml-1 text-xs font-normal text-muted">(you)</span>}</span><span className="text-xs text-muted">{u.email}</span></span>
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            {manage && !self ? (
                              <Select aria-label={`Role for ${u.name}`} className="h-8 w-44 text-[13px]" value={u.role} onChange={(e) => { updateUser(u.id, { role: e.target.value as Role }); toast(`${u.name} is now ${ROLE_LABEL[e.target.value as Role]}`); }}>
                                {ORG_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                              </Select>
                            ) : ROLE_LABEL[u.role]}
                          </td>
                          <td className="px-4 py-2.5">
                            {manage && u.role !== "org_admin" ? (
                              <Select aria-label={`Team for ${u.name}`} className="h-8 w-44 text-[13px]" value={u.teamId ?? ""} onChange={(e) => { updateUser(u.id, { teamId: e.target.value || null }); toast("Team updated"); }}>
                                <option value="">No team</option>
                                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                              </Select>
                            ) : teamName(u.teamId)}
                          </td>
                          <td className="px-4 py-2.5">
                            <Badge tone={u.status === "active" ? "green" : u.status === "invited" ? "amber" : "slate"} dot>{u.status[0].toUpperCase() + u.status.slice(1)}</Badge>
                          </td>
                          <td className="px-4 py-2.5 text-muted">{u.lastActiveAt ? relativeTime(u.lastActiveAt) : "Never"}</td>
                          <td className="px-4 py-2.5 text-right">
                            {manage && !self && (u.status === "active" ? (
                              <Button size="sm" variant="ghost" onClick={() => setDeactivate(u)}>Deactivate</Button>
                            ) : (
                              <Button size="sm" onClick={() => { updateUser(u.id, { status: "active" }); toast(`${u.name} activated`); }}>{u.status === "invited" ? "Mark accepted" : "Reactivate"}</Button>
                            ))}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      {tab === "teams" && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {teams.length === 0 && <Card className="md:col-span-2"><EmptyState title="No teams yet" description="Group sales executives under a manager to control team visibility." /></Card>}
          {teams.map((t) => {
            const members = orgUsers.filter((u) => u.teamId === t.id);
            return (
              <Card key={t.id}>
                <CardHeader title={t.name} subtitle={`Manager: ${orgUsers.find((u) => u.id === t.managerId)?.name ?? "None"}`} />
                <ul className="divide-y divide-line">
                  {members.map((m) => (
                    <li key={m.id} className="flex items-center gap-2.5 px-4 py-2 text-sm">
                      <Avatar name={m.name} size="sm" />
                      <span className="flex-1">{m.name}</span>
                      <span className="text-xs text-muted">{ROLE_LABEL[m.role]}</span>
                    </li>
                  ))}
                  {members.length === 0 && <li className="px-4 py-3 text-sm text-muted">No members</li>}
                </ul>
              </Card>
            );
          })}
        </div>
      )}

      {tab === "roles" && (
        <Card className="overflow-hidden">
          <CardHeader title="Permission matrix" subtitle="Actions each role can take, and which records they can see. Enforced for every screen in this workspace." />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-[13px]">
              <thead className="border-b border-line bg-white text-left text-[11px] font-semibold tracking-[0.06em] text-slate-400 uppercase">
                <tr><th className="px-4 py-2.5 font-medium">Capability</th>{ORG_ROLES.map((r) => <th key={r} className="px-4 py-2.5 text-center font-medium">{ROLE_LABEL[r]}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-line">
                <tr className="bg-brand-50/40">
                  <td className="px-4 py-2.5 font-medium">Record visibility</td>
                  {ORG_ROLES.map((r) => <td key={r} className="px-4 py-2.5 text-center text-brand-800">{SCOPE_LABEL[SCOPE_BY_ROLE[r]]}</td>)}
                </tr>
                {ALL_ACTIONS.filter((a) => a.action !== "platform.manage").map((a) => (
                  <tr key={a.action}>
                    <td className="px-4 py-2">{a.label}</td>
                    {ORG_ROLES.map((r) => (
                      <td key={r} className="px-4 py-2 text-center">
                        {roleCan(r, a.action) ? <Check className="mx-auto size-4 text-emerald-600" aria-label="Allowed" /> : <Minus className="mx-auto size-4 text-slate-300" aria-label="Not allowed" />}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {inviteOpen && <InviteModal onClose={() => setInviteOpen(false)} />}
      {teamOpen && <TeamModal onClose={() => setTeamOpen(false)} />}
      <ConfirmDialog
        open={!!deactivate}
        onClose={() => setDeactivate(null)}
        onConfirm={() => { if (deactivate) { updateUser(deactivate.id, { status: "inactive" }); toast(`${deactivate.name} deactivated`); } }}
        title={`Deactivate ${deactivate?.name}?`}
        message="They won't be able to sign in. Their leads and tasks stay in place. Reassign them from the Leads page."
        confirmLabel="Deactivate"
        danger
      />
    </div>
  );
}

function InviteModal({ onClose }: { onClose: () => void }) {
  const { db, orgId, inviteUser, toast } = useStore();
  const [v, setV] = useState({ name: "", email: "", role: "exec" as Role, teamId: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const teams = db.teams.filter((t) => t.orgId === orgId);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!v.name.trim()) errs.name = "Enter their name.";
    if (!EMAIL_RE.test(v.email.trim())) errs.email = "Enter a valid email.";
    else if (db.users.some((u) => u.email.toLowerCase() === v.email.trim().toLowerCase())) errs.email = "This email already has an account.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    inviteUser({ name: v.name.trim(), email: v.email.trim().toLowerCase(), role: v.role, teamId: v.teamId || null });
    toast(`Invitation recorded for ${v.email}`);
    onClose();
  };
  return (
    <Modal open onClose={onClose} title="Invite user" description="Demo: no email is sent. The user appears as Invited." footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" type="submit" form="invite-form">Send invite</Button></>}>
      <form id="invite-form" noValidate onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor="inv-name" error={errors.name} required><Input id="inv-name" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} aria-invalid={!!errors.name} /></Field>
        <Field label="Work email" htmlFor="inv-email" error={errors.email} required><Input id="inv-email" type="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} aria-invalid={!!errors.email} /></Field>
        <Field label="Role" htmlFor="inv-role"><Select id="inv-role" value={v.role} onChange={(e) => setV({ ...v, role: e.target.value as Role })}>{ORG_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</Select></Field>
        <Field label="Team" htmlFor="inv-team"><Select id="inv-team" value={v.teamId} onChange={(e) => setV({ ...v, teamId: e.target.value })}><option value="">No team</option>{teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</Select></Field>
      </form>
    </Modal>
  );
}

function TeamModal({ onClose }: { onClose: () => void }) {
  const { orgUsers, createTeam, toast } = useStore();
  const [name, setName] = useState("");
  const [managerId, setManagerId] = useState("");
  const [err, setErr] = useState("");
  return (
    <Modal open onClose={onClose} title="New team" size="sm" footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" onClick={() => { if (!name.trim()) return setErr("Name the team."); createTeam(name.trim(), managerId || null); toast(`Team ${name.trim()} created`); onClose(); }}>Create team</Button></>}>
      <div className="space-y-4">
        <Field label="Team name" htmlFor="tm-name" error={err} required><Input id="tm-name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!err} /></Field>
        <Field label="Manager" htmlFor="tm-mgr" hint="The manager is moved into this team.">
          <Select id="tm-mgr" value={managerId} onChange={(e) => setManagerId(e.target.value)}>
            <option value="">No manager yet</option>
            {orgUsers.filter((u) => u.role === "manager").map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </Select>
        </Field>
      </div>
    </Modal>
  );
}
