"use client";

import { AlertCircle, CheckCircle2, Download, FileUp, Upload } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { validateLead } from "@/components/lead-form";
import { Badge, Button, Field, Modal, Select } from "@/components/ui";
import { useStore, type LeadInput } from "@/lib/store";
import { downloadFile, normalizePhone, parseCSV, toCSV } from "@/lib/utils";

const FIELDS: { key: keyof LeadInput; label: string; aliases: string[] }[] = [
  { key: "firstName", label: "First name", aliases: ["first name", "firstname", "first", "name"] },
  { key: "lastName", label: "Last name", aliases: ["last name", "lastname", "last", "surname"] },
  { key: "email", label: "Email", aliases: ["email", "e-mail", "email address"] },
  { key: "phone", label: "Phone", aliases: ["phone", "mobile", "phone number", "contact"] },
  { key: "company", label: "Company", aliases: ["company", "organization", "organisation", "account"] },
  { key: "jobTitle", label: "Job title", aliases: ["title", "job title", "designation"] },
  { key: "city", label: "City", aliases: ["city", "location"] },
  { key: "source", label: "Source", aliases: ["source", "lead source", "channel"] },
];

type Row = { line: number; data: LeadInput; errors: string[]; duplicate: string | null };

export function ImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { db, orgId, orgUsers, settings, importLeads, toast } = useStore();
  const [step, setStep] = useState<"upload" | "map" | "preview" | "done">("upload");
  const [fileName, setFileName] = useState("");
  const [grid, setGrid] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Partial<Record<keyof LeadInput, number>>>({});
  const [ownerId, setOwnerId] = useState<string>("");
  const [fileError, setFileError] = useState("");
  const [result, setResult] = useState<{ created: number; skipped: number; errors: Row[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep("upload");
    setGrid([]);
    setMapping({});
    setFileName("");
    setResult(null);
    setFileError("");
  };
  const close = () => {
    reset();
    onClose();
  };

  const headers = grid[0] ?? [];

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".csv")) return setFileError("Upload a .csv file.");
    if (f.size > 2_000_000) return setFileError("File is larger than 2 MB. Split it into smaller files.");
    const text = await f.text();
    const rows = parseCSV(text);
    if (rows.length < 2) return setFileError("The file needs a header row and at least one data row.");
    setFileError("");
    setFileName(f.name);
    setGrid(rows);
    const m: Partial<Record<keyof LeadInput, number>> = {};
    rows[0].forEach((h, i) => {
      const f2 = FIELDS.find((x) => x.aliases.includes(h.trim().toLowerCase()));
      if (f2 && m[f2.key] === undefined) m[f2.key] = i;
    });
    setMapping(m);
    setStep("map");
  };

  const rows: Row[] = useMemo(() => {
    if (step !== "preview" && step !== "done") return [];
    const existingEmails = new Set(db.leads.filter((l) => l.orgId === orgId).map((l) => l.email.toLowerCase()).filter(Boolean));
    const existingPhones = new Set(db.leads.filter((l) => l.orgId === orgId).map((l) => normalizePhone(l.phone)).filter((p) => p.length >= 10));
    const seenEmails = new Set<string>();
    const seenPhones = new Set<string>();
    return grid.slice(1).map((r, i) => {
      const get = (k: keyof LeadInput) => (mapping[k] !== undefined ? (r[mapping[k]!] ?? "").trim() : "");
      const sourceRaw = get("source");
      const source = settings?.leadSources.find((s) => s.toLowerCase() === sourceRaw.toLowerCase()) ?? (sourceRaw ? sourceRaw : "CSV import");
      const data: LeadInput = { firstName: get("firstName"), lastName: get("lastName"), email: get("email").toLowerCase(), phone: get("phone"), company: get("company"), jobTitle: get("jobTitle"), city: get("city"), source, ownerId: ownerId || null };
      const errs = Object.values(validateLead(data)).filter((x, idx, a) => a.indexOf(x) === idx) as string[];
      const p = normalizePhone(data.phone);
      let duplicate: string | null = null;
      if (data.email && existingEmails.has(data.email)) duplicate = "Email already exists";
      else if (p.length >= 10 && existingPhones.has(p)) duplicate = "Phone already exists";
      else if (data.email && seenEmails.has(data.email)) duplicate = "Repeated in file";
      else if (p.length >= 10 && seenPhones.has(p)) duplicate = "Repeated in file";
      if (data.email) seenEmails.add(data.email);
      if (p.length >= 10) seenPhones.add(p);
      return { line: i + 2, data, errors: errs, duplicate };
    });
  }, [grid, mapping, step, db.leads, orgId, settings, ownerId]);

  const valid = rows.filter((r) => !r.errors.length && !r.duplicate);
  const invalid = rows.filter((r) => r.errors.length);
  const dupes = rows.filter((r) => !r.errors.length && r.duplicate);

  const runImport = () => {
    const created = importLeads(valid.map((r) => r.data));
    setResult({ created, skipped: rows.length - created, errors: rows.filter((r) => r.errors.length || r.duplicate) });
    setStep("done");
    toast(`Imported ${created} lead(s)`);
  };

  const downloadErrors = () => {
    if (!result) return;
    const out = [["Line", "First name", "Last name", "Email", "Phone", "Problem"], ...result.errors.map((r) => [r.line, r.data.firstName, r.data.lastName, r.data.email, r.data.phone, [...r.errors, r.duplicate].filter(Boolean).join("; ")])];
    downloadFile("import-errors.csv", toCSV(out));
  };

  const template = () => downloadFile("wingrid-leads-template.csv", toCSV([FIELDS.map((f) => f.label), ["Asha", "Verma", "asha.verma@example.com", "+91 9876543210", "Lumen Labs", "Founder", "Pune", "Website form"]]));

  return (
    <Modal
      open={open}
      onClose={close}
      title="Import leads from CSV"
      description={fileName ? fileName : "Preview and validate before anything is created."}
      size="lg"
      footer={
        step === "map" ? (
          <>
            <Button onClick={reset}>Choose another file</Button>
            <Button variant="primary" onClick={() => setStep("preview")} disabled={mapping.firstName === undefined}>
              Preview {grid.length - 1} rows
            </Button>
          </>
        ) : step === "preview" ? (
          <>
            <Button onClick={() => setStep("map")}>Back</Button>
            <Button variant="primary" onClick={runImport} disabled={!valid.length}>
              Import {valid.length} lead{valid.length === 1 ? "" : "s"}
            </Button>
          </>
        ) : step === "done" ? (
          <Button variant="primary" onClick={close}>
            Done
          </Button>
        ) : (
          <Button onClick={close}>Cancel</Button>
        )
      }
    >
      <ol className="mb-4 flex gap-2 text-xs font-medium" aria-label="Import steps">
        {(["upload", "map", "preview", "done"] as const).map((s, i) => (
          <li key={s} className={s === step ? "rounded-full bg-brand-600 px-2.5 py-1 text-white" : "rounded-full bg-slate-100 px-2.5 py-1 text-slate-500"}>
            {i + 1}. {{ upload: "Upload", map: "Map columns", preview: "Validate", done: "Result" }[s]}
          </li>
        ))}
      </ol>

      {step === "upload" && (
        <div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onFile(e.dataTransfer.files[0]);
            }}
            className="flex w-full flex-col items-center rounded-lg border-2 border-dashed border-brand-200 bg-brand-50/40 px-6 py-10 text-center hover:border-brand-400"
          >
            <Upload className="size-7 text-brand-500" />
            <span className="mt-2 text-sm font-medium text-slate-800">Drop a CSV here or click to browse</span>
            <span className="mt-1 text-xs text-muted">Up to 2 MB. First row must contain column headers.</span>
          </button>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="sr-only" aria-label="CSV file" onChange={(e) => onFile(e.target.files?.[0])} />
          {fileError && (
            <p role="alert" className="mt-3 flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="size-4" /> {fileError}
            </p>
          )}
          <button type="button" onClick={template} className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700">
            <Download className="size-4" /> Download template
          </button>
        </div>
      )}

      {step === "map" && (
        <div className="space-y-4">
          <p className="text-sm text-muted">Match your file&apos;s columns to WinGrid fields. We pre-filled the obvious matches.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {FIELDS.map((f) => (
              <Field key={f.key} label={f.label} htmlFor={`map-${f.key}`} required={f.key === "firstName"}>
                <Select id={`map-${f.key}`} value={mapping[f.key] ?? ""} onChange={(e) => setMapping((m) => ({ ...m, [f.key]: e.target.value === "" ? undefined : Number(e.target.value) }))}>
                  <option value="">Don&apos;t import</option>
                  {headers.map((h, i) => (
                    <option key={i} value={i}>
                      {h || `Column ${i + 1}`}
                    </option>
                  ))}
                </Select>
              </Field>
            ))}
          </div>
          <Field label="Assign imported leads to" htmlFor="imp-owner">
            <Select id="imp-owner" value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
              <option value="">Leave unassigned</option>
              {orgUsers
                .filter((u) => u.status === "active" && (u.role === "exec" || u.role === "manager"))
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
            </Select>
          </Field>
        </div>
      )}

      {step === "preview" && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 text-sm">
            <Badge tone="green">{valid.length} ready</Badge>
            <Badge tone="amber">{dupes.length} duplicates (will be skipped)</Badge>
            <Badge tone="red">{invalid.length} with errors (will be skipped)</Badge>
          </div>
          <div className="max-h-80 overflow-auto rounded-lg border border-line scrollbar-thin">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-50 text-left text-xs text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">Line</th>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Email / phone</th>
                  <th className="px-3 py-2 font-medium">Source</th>
                  <th className="px-3 py-2 font-medium">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.slice(0, 200).map((r) => (
                  <tr key={r.line} className={r.errors.length ? "bg-red-50/40" : r.duplicate ? "bg-amber-50/40" : undefined}>
                    <td className="px-3 py-1.5 text-muted tabular-nums">{r.line}</td>
                    <td className="px-3 py-1.5">
                      {r.data.firstName} {r.data.lastName}
                    </td>
                    <td className="px-3 py-1.5 text-xs text-slate-600">
                      {r.data.email || "—"}
                      <br />
                      {r.data.phone}
                    </td>
                    <td className="px-3 py-1.5 text-xs">{r.data.source}</td>
                    <td className="px-3 py-1.5 text-xs">
                      {r.errors.length ? <span className="text-red-700">{r.errors.join(" ")}</span> : r.duplicate ? <span className="text-amber-800">Skip: {r.duplicate}</span> : <span className="text-emerald-700">Ready</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > 200 && <p className="text-xs text-muted">Showing first 200 of {rows.length} rows.</p>}
        </div>
      )}

      {step === "done" && result && (
        <div className="py-2 text-center">
          <CheckCircle2 className="mx-auto size-10 text-emerald-500" />
          <p className="mt-3 text-base font-semibold">Import complete</p>
          <p className="mt-1 text-sm text-muted">
            {result.created} created · 0 updated · {result.skipped} skipped
          </p>
          {result.errors.length > 0 && (
            <Button className="mt-4" onClick={downloadErrors}>
              <FileUp className="size-4" /> Download error report
            </Button>
          )}
        </div>
      )}
    </Modal>
  );
}
