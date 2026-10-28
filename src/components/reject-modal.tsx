"use client";

import { useState } from "react";
import { Button, Field, Modal, Select } from "@/components/ui";

export function RejectModal({ open, onClose, reasons, count = 1, onConfirm }: { open: boolean; onClose: () => void; reasons: string[]; count?: number; onConfirm: (reason: string) => void }) {
  const [r, setR] = useState("");
  const [err, setErr] = useState("");
  return (
    <Modal open={open} onClose={onClose} title={count > 1 ? `Reject ${count} leads` : "Reject lead"} size="sm"
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="danger" onClick={() => { if (!r) return setErr("Choose a reason."); onConfirm(r); setR(""); setErr(""); onClose(); }}>Reject</Button></>}>
      <Field label="Reason" htmlFor="rej-reason" error={err} required>
        <Select id="rej-reason" value={r} onChange={(e) => setR(e.target.value)} aria-invalid={!!err}>
          <option value="">Select a reason…</option>
          {reasons.map((x) => <option key={x}>{x}</option>)}
        </Select>
      </Field>
    </Modal>
  );
}
