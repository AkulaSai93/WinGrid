"use client";

import { useState } from "react";
import { Button, Field, Input, Modal, Select } from "@/components/ui";
import { useStore } from "@/lib/store";
import type { Lead } from "@/lib/types";

function isoDate(offsetDays: number) {
  return new Date(Date.now() + offsetDays * 86_400_000).toISOString().slice(0, 10);
}

/** Create a new opportunity, or convert a lead into one (preserving its source and history). */
export function OpportunityFormModal({ open, onClose, lead, onDone }: { open: boolean; onClose: () => void; lead?: Lead; onDone?: (oppId: string) => void }) {
  const { stages, user, orgUsers, convertLead, createOpportunity, toast } = useStore();
  const openStages = stages.filter((s) => s.kind === "open");
  const [name, setName] = useState(lead ? `${lead.company || `${lead.firstName} ${lead.lastName}`} — ` : "");
  const [value, setValue] = useState("");
  const [stageId, setStageId] = useState(openStages[0]?.id ?? "");
  const [closeDate, setCloseDate] = useState(isoDate(30));
  const [ownerId, setOwnerId] = useState(lead?.ownerId ?? user?.id ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!name.trim() || name.trim().endsWith("—")) errs.name = "Name the opportunity.";
    const v = Number(value.replace(/,/g, ""));
    if (!value || Number.isNaN(v) || v <= 0) errs.value = "Enter a positive amount.";
    if (!closeDate) errs.closeDate = "Choose an expected close date.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const payload = { name: name.trim(), value: v, stageId, closeDate: new Date(closeDate).toISOString() };
    const id = lead ? convertLead(lead.id, payload) : createOpportunity({ ...payload, ownerId: ownerId || null, leadId: null });
    toast(lead ? "Lead converted to opportunity" : "Opportunity created");
    onDone?.(id);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={lead ? "Convert to opportunity" : "New opportunity"}
      description={lead ? `The lead will be marked Converted. Its source (${lead.source}) and activity history stay linked.` : undefined}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="opp-form">
            {lead ? "Convert" : "Create opportunity"}
          </Button>
        </>
      }
    >
      <form id="opp-form" noValidate onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Opportunity name" htmlFor="op-name" error={errors.name} required>
            <Input id="op-name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} />
          </Field>
        </div>
        <Field label="Value (INR)" htmlFor="op-value" error={errors.value} required>
          <Input id="op-value" inputMode="numeric" value={value} onChange={(e) => setValue(e.target.value.replace(/[^\d,]/g, ""))} aria-invalid={!!errors.value} placeholder="250000" />
        </Field>
        <Field label="Expected close" htmlFor="op-close" error={errors.closeDate} required>
          <Input id="op-close" type="date" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} aria-invalid={!!errors.closeDate} />
        </Field>
        <Field label="Pipeline stage" htmlFor="op-stage">
          <Select id="op-stage" value={stageId} onChange={(e) => setStageId(e.target.value)}>
            {openStages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.probability}%)
              </option>
            ))}
          </Select>
        </Field>
        {!lead && (
          <Field label="Owner" htmlFor="op-owner">
            <Select id="op-owner" value={ownerId} onChange={(e) => setOwnerId(e.target.value)} disabled={user?.role === "exec"}>
              {orgUsers
                .filter((u) => u.status === "active" && (u.role === "exec" || u.role === "manager"))
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
            </Select>
          </Field>
        )}
      </form>
    </Modal>
  );
}
