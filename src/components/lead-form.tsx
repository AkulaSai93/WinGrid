"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button, Field, Input, LeadStatusBadge, Modal, Select } from "@/components/ui";
import { can } from "@/lib/permissions";
import { useStore, type LeadInput } from "@/lib/store";
import type { Lead } from "@/lib/types";
import { EMAIL_RE } from "@/lib/utils";

const EMPTY: LeadInput = { firstName: "", lastName: "", email: "", phone: "", company: "", jobTitle: "", city: "", source: "", ownerId: null };

export function validateLead(v: LeadInput) {
  const e: Partial<Record<keyof LeadInput, string>> = {};
  if (!v.firstName.trim()) e.firstName = "First name is required.";
  if (!v.email.trim() && !v.phone.trim()) {
    e.email = "Provide an email or a phone number.";
    e.phone = "Provide an email or a phone number.";
  }
  if (v.email.trim() && !EMAIL_RE.test(v.email.trim())) e.email = "Enter a valid email address.";
  if (v.phone.trim() && v.phone.replace(/\D/g, "").length < 10) e.phone = "Enter at least 10 digits.";
  if (!v.source) e.source = "Choose where this lead came from.";
  return e;
}

export function LeadFormModal({ open, onClose, lead, onCreated }: { open: boolean; onClose: () => void; lead?: Lead; onCreated?: (id: string) => void }) {
  const { user, orgUsers, settings, createLead, updateLead, findDuplicates, toast } = useStore();
  const [v, setV] = useState<LeadInput>(() => (lead ? { ...lead } : { ...EMPTY, ownerId: user?.role === "exec" ? user.id : null }));
  const [errors, setErrors] = useState<Partial<Record<keyof LeadInput, string>>>({});
  const [dupes, setDupes] = useState<Lead[] | null>(null);

  const set = <K extends keyof LeadInput>(k: K, val: LeadInput[K]) => setV((p) => ({ ...p, [k]: val }));
  const sellers = orgUsers.filter((u) => u.status === "active" && (u.role === "exec" || u.role === "manager"));

  const save = (force = false) => {
    const errs = validateLead(v);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const clean = { ...v, firstName: v.firstName.trim(), lastName: v.lastName.trim(), email: v.email.trim().toLowerCase(), phone: v.phone.trim(), company: v.company.trim(), city: v.city.trim(), jobTitle: v.jobTitle.trim() };
    if (!force) {
      const d = findDuplicates(clean.email, clean.phone, lead?.id);
      if (d.length) return setDupes(d);
    }
    if (lead) {
      updateLead(lead.id, clean);
      toast("Lead updated");
    } else {
      const id = createLead(clean);
      toast(`Lead ${clean.firstName} ${clean.lastName} created`);
      onCreated?.(id);
    }
    setV({ ...EMPTY });
    setDupes(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={lead ? "Edit lead" : "New lead"}
      description={lead ? undefined : "Duplicates are checked by email and phone before saving."}
      size="lg"
      footer={
        dupes ? (
          <>
            <Button onClick={() => setDupes(null)}>Back to form</Button>
            <Button variant="primary" onClick={() => save(true)}>
              Create anyway
            </Button>
          </>
        ) : (
          <>
            <Button onClick={onClose}>Cancel</Button>
            <Button variant="primary" type="submit" form="lead-form">
              {lead ? "Save changes" : "Create lead"}
            </Button>
          </>
        )
      }
    >
      {dupes ? (
        <div>
          <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 size-5 shrink-0" />
            <p>
              We found {dupes.length} existing lead{dupes.length > 1 ? "s" : ""} with the same email or phone. Review before creating a new record. Nothing will be overwritten.
            </p>
          </div>
          <ul className="mt-3 divide-y divide-line rounded-lg border border-line">
            {dupes.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                <span>
                  <span className="font-medium">
                    {d.firstName} {d.lastName}
                  </span>
                  <span className="block text-xs text-muted">
                    {d.email} · {d.phone}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <LeadStatusBadge status={d.status} />
                  <Link href={`/leads/${d.id}`} onClick={onClose} className="text-[13px] font-medium text-brand-600 hover:underline">
                    Open existing
                  </Link>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <form
          id="lead-form"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <Field label="First name" htmlFor="lf-first" error={errors.firstName} required>
            <Input id="lf-first" value={v.firstName} onChange={(e) => set("firstName", e.target.value)} aria-invalid={!!errors.firstName} />
          </Field>
          <Field label="Last name" htmlFor="lf-last">
            <Input id="lf-last" value={v.lastName} onChange={(e) => set("lastName", e.target.value)} />
          </Field>
          <Field label="Email" htmlFor="lf-email" error={errors.email}>
            <Input id="lf-email" type="email" value={v.email} onChange={(e) => set("email", e.target.value)} aria-invalid={!!errors.email} />
          </Field>
          <Field label="Phone" htmlFor="lf-phone" error={errors.phone}>
            <Input id="lf-phone" type="tel" value={v.phone} onChange={(e) => set("phone", e.target.value)} aria-invalid={!!errors.phone} placeholder="+91 98xxxxxxxx" />
          </Field>
          <Field label="Company" htmlFor="lf-company">
            <Input id="lf-company" value={v.company} onChange={(e) => set("company", e.target.value)} />
          </Field>
          <Field label="Job title" htmlFor="lf-title">
            <Input id="lf-title" value={v.jobTitle} onChange={(e) => set("jobTitle", e.target.value)} />
          </Field>
          <Field label="City" htmlFor="lf-city">
            <Input id="lf-city" value={v.city} onChange={(e) => set("city", e.target.value)} />
          </Field>
          <Field label="Source" htmlFor="lf-source" error={errors.source} required>
            <Select id="lf-source" value={v.source} onChange={(e) => set("source", e.target.value)} aria-invalid={!!errors.source}>
              <option value="">Select source…</option>
              {settings?.leadSources.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </Field>
          <Field label="Owner" htmlFor="lf-owner" hint={!can(user, "lead.assign") ? "Only managers and admins can assign leads to others." : undefined}>
            <Select id="lf-owner" value={v.ownerId ?? ""} onChange={(e) => set("ownerId", e.target.value || null)} disabled={!can(user, "lead.assign")}>
              <option value="">Unassigned</option>
              {sellers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </Select>
          </Field>
        </form>
      )}
    </Modal>
  );
}
