import Link from "next/link";
import { Logo } from "@/components/logo";

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-[radial-gradient(50rem_25rem_at_50%_-5%,var(--color-brand-100),transparent)]">
      <div className="px-6 py-5">
        <Link href="/" aria-label="WinGrid home">
          <Logo />
        </Link>
      </div>
      <main className="flex flex-1 items-start justify-center px-4 pt-[6vh] pb-12">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-muted">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </main>
    </div>
  );
}
