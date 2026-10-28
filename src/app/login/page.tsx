"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthLayout } from "@/components/auth-layout";
import { Button, Field, Input } from "@/components/ui";
import { ROLE_LABEL } from "@/lib/permissions";
import { DEMO_PASSWORD } from "@/lib/seed";
import { useStore } from "@/lib/store";
import { EMAIL_RE } from "@/lib/utils";

const DEMO_ACCOUNTS = [
  { email: "admin@brightpath.demo", role: "org_admin" as const },
  { email: "manager@brightpath.demo", role: "manager" as const },
  { email: "exec@brightpath.demo", role: "exec" as const },
  { email: "super@wingrid.demo", role: "super_admin" as const },
];

export default function LoginPage() {
  const { login, user, ready } = useStore();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);

  const destination = (role: string) => {
    const next = new URLSearchParams(window.location.search).get("next");
    if (next && next.startsWith("/") && !next.startsWith("//")) return next;
    return role === "super_admin" ? "/admin" : "/dashboard";
  };

  useEffect(() => {
    if (ready && user) router.replace(destination(user.role));
  }, [ready, user, router]);

  const submit = (e: React.FormEvent, override?: { email: string; password: string }) => {
    e.preventDefault();
    const em = override?.email ?? email;
    const pw = override?.password ?? password;
    const errs: typeof errors = {};
    if (!em.trim()) errs.email = "Enter your email address.";
    else if (!EMAIL_RE.test(em.trim())) errs.email = "Enter a valid email address.";
    if (!pw) errs.password = "Enter your password.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    setTimeout(() => {
      const res = login(em, pw);
      setLoading(false);
      if (!res.ok) setErrors({ form: res.error });
      else router.replace(destination(res.user.role));
    }, 350);
  };

  return (
    <AuthLayout title="Sign in to WinGrid" subtitle="Use your work email and password.">
      <form onSubmit={submit} noValidate className="space-y-4 rounded-xl border border-line bg-white p-5 shadow-sm">
        {errors.form && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errors.form}
          </div>
        )}
        <Field label="Email" htmlFor="email" error={errors.email}>
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errors.email} placeholder="you@company.com" />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password}>
          <div className="relative">
            <Input id="password" type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={!!errors.password} className="pr-10" />
            <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700">
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm font-medium text-brand-600 hover:text-brand-700">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" variant="primary" className="w-full" loading={loading}>
          Sign in
        </Button>
      </form>

      <div className="mt-6 rounded-xl border border-dashed border-brand-200 bg-brand-50/50 p-4">
        <p className="text-xs font-semibold tracking-wide text-brand-800 uppercase">Demo accounts</p>
        <p className="mt-1 text-xs text-slate-600">
          Password for all: <code className="rounded bg-white px-1 font-mono">{DEMO_PASSWORD}</code>. Each role sees different data and actions.
        </p>
        <div className="mt-3 grid gap-1.5">
          {DEMO_ACCOUNTS.map((a) => (
            <button
              key={a.email}
              type="button"
              onClick={(e) => {
                setEmail(a.email);
                setPassword(DEMO_PASSWORD);
                submit(e as unknown as React.FormEvent, { email: a.email, password: DEMO_PASSWORD });
              }}
              className="flex items-center justify-between rounded-lg border border-line bg-white px-3 py-2 text-left text-sm hover:border-brand-300 hover:bg-white"
            >
              <span className="font-medium text-slate-800">{ROLE_LABEL[a.role]}</span>
              <span className="text-xs text-muted">{a.email}</span>
            </button>
          ))}
        </div>
      </div>
    </AuthLayout>
  );
}
