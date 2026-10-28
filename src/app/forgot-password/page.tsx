"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AuthLayout } from "@/components/auth-layout";
import { Button, Field, Input } from "@/components/ui";
import { useStore } from "@/lib/store";
import { EMAIL_RE } from "@/lib/utils";

type Step = "email" | "otp" | "password" | "done";

// Demo flow: no email is actually sent. The OTP is shown on screen and labelled as such.
export default function ForgotPasswordPage() {
  const { db } = useStore();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [code, setCode] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState("");

  const exists = db.users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase());

  return (
    <AuthLayout
      title={step === "done" ? "Password updated" : "Reset your password"}
      subtitle={step === "email" ? "We'll send a one-time code to your work email." : step === "otp" ? `Enter the 6-digit code sent to ${email}.` : step === "password" ? "Choose a new password." : undefined}
    >
      <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
        {step === "email" && (
          <form
            noValidate
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!EMAIL_RE.test(email.trim())) return setError("Enter a valid email address.");
              setError("");
              setCode(String(Math.floor(100000 + Math.random() * 900000)));
              setStep("otp");
            }}
          >
            <Field label="Work email" htmlFor="fp-email" error={error}>
              <Input id="fp-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!error} autoComplete="email" />
            </Field>
            <Button type="submit" variant="primary" className="w-full">
              Send code
            </Button>
          </form>
        )}

        {step === "otp" && (
          <form
            noValidate
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!/^\d{6}$/.test(otp)) return setError("Enter the 6-digit code.");
              if (!exists || otp !== code) return setError("That code is invalid or has expired.");
              setError("");
              setStep("password");
            }}
          >
            {/* Neutral message: we never confirm whether an account exists. */}
            <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">If an account exists for this email, a code has been sent.</p>
            {exists && (
              <p className="rounded-lg border border-dashed border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
                Demo mode, no email is sent. Your code is <strong className="font-mono">{code}</strong>.
              </p>
            )}
            <Field label="One-time code" htmlFor="otp" error={error}>
              <Input id="otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} aria-invalid={!!error} className="font-mono tracking-[0.4em]" />
            </Field>
            <Button type="submit" variant="primary" className="w-full">
              Verify code
            </Button>
            <button type="button" onClick={() => { setStep("email"); setOtp(""); setError(""); }} className="w-full text-sm text-muted hover:text-slate-900">
              Use a different email
            </button>
          </form>
        )}

        {step === "password" && (
          <form
            noValidate
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (pw.length < 8) return setError("Use at least 8 characters.");
              if (pw !== pw2) return setError("Passwords don't match.");
              setError("");
              setStep("done");
            }}
          >
            <Field label="New password" htmlFor="pw" hint="At least 8 characters.">
              <Input id="pw" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
            </Field>
            <Field label="Confirm password" htmlFor="pw2" error={error}>
              <Input id="pw2" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} aria-invalid={!!error} />
            </Field>
            <Button type="submit" variant="primary" className="w-full">
              Update password
            </Button>
          </form>
        )}

        {step === "done" && (
          <div className="py-4 text-center">
            <CheckCircle2 className="mx-auto size-10 text-emerald-500" />
            <p className="mt-3 text-sm text-slate-600">Your password reset flow is complete. In this demo, sign-in still uses the demo password.</p>
          </div>
        )}
      </div>
      <p className="mt-5 text-center text-sm text-muted">
        <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
