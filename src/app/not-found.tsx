import Link from "next/link";
import { Logo } from "@/components/logo";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <Logo />
      <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="max-w-sm text-sm text-muted">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <Link href="/dashboard" className="inline-flex h-9 items-center rounded-sm bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700">
        Go to dashboard
      </Link>
    </div>
  );
}
