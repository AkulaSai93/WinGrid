import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { Spinner } from "@/components/ui";

// The CRM is a client-side workspace (session + data live in the browser),
// so the shell streams in after the static prerender.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<Spinner label="Loading workspace" />}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
