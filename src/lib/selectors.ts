"use client";

import { useMemo } from "react";
import { inScope, visibleOwnerIds } from "./permissions";
import { useStore } from "./store";

/** Records the current user may see in the active org (tenant isolation + record scope). */
export function useScoped() {
  const { db, user, orgId, stages } = useStore();
  return useMemo(() => {
    if (!user || !orgId) {
      return { owners: new Set<string>() as Set<string> | "all", leads: [], opportunities: [], tasks: [], activities: [], stageById: new Map() };
    }
    const owners = visibleOwnerIds(db, user, orgId);
    // Managers and admins can see unassigned leads so they can route them.
    const seeUnassigned = user.role !== "exec";
    const leads = db.leads.filter((l) => l.orgId === orgId && inScope(owners, l.ownerId, seeUnassigned));
    const opportunities = db.opportunities.filter((o) => o.orgId === orgId && inScope(owners, o.ownerId, seeUnassigned));
    const tasks = db.tasks.filter((t) => t.orgId === orgId && inScope(owners, t.ownerId));
    const activities = db.activities.filter((a) => a.orgId === orgId);
    const stageById = new Map(stages.map((s) => [s.id, s]));
    return { owners, leads, opportunities, tasks, activities, stageById };
  }, [db, user, orgId, stages]);
}

export function useUserName() {
  const { db } = useStore();
  return useMemo(() => {
    const map = new Map(db.users.map((u) => [u.id, u.name]));
    return (id: string | null | undefined) => (id ? (map.get(id) ?? "Unknown") : "Unassigned");
  }, [db.users]);
}
