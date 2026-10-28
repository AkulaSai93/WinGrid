import { ArrowRight, BarChart3, Building2, Check, ClipboardList, Gauge, KanbanSquare, LineChart, Lock, Package, Phone, Plug, ScrollText, Search, Settings, ShieldCheck, Upload, Users, UsersRound } from "lucide-react";
import Link from "next/link";
import { DemoAudit, DemoBoard, DemoChart, DemoProducts, DemoRoles, DemoTable, DemoTasks } from "@/components/landing-demos";
import { LandingMotion } from "@/components/landing-motion";
import { Logo } from "@/components/logo";

const STEPS = [
  { title: "Capture", body: "Leads arrive from web forms, CSV imports or manual entry. Duplicates are flagged by email and phone before anything is created.", icon: Upload },
  { title: "Assign & work", body: "Each lead gets an owner. Calls, emails, meetings and notes land on one timeline, with the next follow-up always scheduled.", icon: Phone },
  { title: "Qualify & convert", body: "Qualified leads become opportunities in one step, keeping their source and full history attached.", icon: KanbanSquare },
  { title: "Close & learn", body: "Deals close as won or lost with a reason, feeding funnel, source and team reports you can drill into.", icon: BarChart3 },
];

const FAQ = [
  { q: "Is each organization's data kept separate?", a: "Yes. Every record belongs to one organization workspace. People only see records inside their workspace, narrowed further by their role: their own, their team's, or the whole organization." },
  { q: "Which roles are supported?", a: "Super Admin, Organization Admin, Sales Manager and Sales Executive. Admins configure users, products, stages and fields; managers assign and review team work; executives work their own leads." },
  { q: "Can we import our existing leads?", a: "Yes. Upload a CSV, map its columns, review row-level errors and duplicates in a preview, then import and download a report of anything skipped." },
  { q: "Can we track products or programs like Catalyst or IAIB?", a: "Yes. Admins add each product with a description and the people who work on it, so teams stay organized around what they sell." },
  { q: "Does it sync with our existing database?", a: "Sync is planned and stays off until the source system, field ownership, sync direction and conflict, duplicate and deletion rules are agreed for your organization." },
  { q: "Is there an audit trail?", a: "Yes. Ownership changes, stage moves, imports, exports, user and settings changes are recorded with who did it and when." },
];

export default function Landing() {
  return (
    <LandingMotion>
    <div className="min-h-dvh overflow-x-clip bg-canvas text-slate-900">
      {/* Nav */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-40 px-4 pt-4">
        <div data-nav className="pointer-events-auto mx-auto flex h-14 max-w-6xl items-center justify-between rounded-lg md:grid md:grid-cols-[1fr_auto_1fr] border border-white/80 bg-white/80 px-4 shadow-[0_1px_2px_rgba(16,24,40,0.05),0_8px_24px_-12px_rgba(16,24,40,0.12)] backdrop-blur-md">
          <Link href="/" aria-label="WinGrid home" className="justify-self-start">
            <Logo />
          </Link>
          <nav aria-label="Landing" className="hidden items-center gap-1 text-sm text-slate-600 md:flex">
            {[
              ["Features", "#features"],
              ["How it works", "#how"],
              ["FAQ", "#faq"],
            ].map(([l, h]) => (
              <a key={h} href={h} className="rounded-lg px-3 py-1.5 hover:bg-slate-100 hover:text-slate-900">
                {l}
              </a>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-1.5 justify-self-end whitespace-nowrap md:col-start-3">
            <Link href="/login" className="inline-flex h-9 items-center rounded-sm px-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 sm:px-3">
              Sign in
            </Link>
            <Link href="/login" className="inline-flex h-9 items-center gap-1.5 rounded-sm bg-brand-600 px-3.5 text-sm font-medium text-white shadow-sm hover:bg-brand-700">
              Open demo <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-32 pb-4 sm:pt-40">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[880px] bg-gradient-to-b from-[#e6eaf3] via-[#eff1f6] to-canvas" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[880px] [mask-image:radial-gradient(60rem_34rem_at_50%_35%,black,transparent_75%)] bg-[radial-gradient(rgba(15,23,42,0.13)_1px,transparent_1px)] [background-size:22px_22px]" />
        <div className="relative mx-auto max-w-6xl text-center">
          <p data-hero="badge" className="inline-flex items-center gap-2 rounded-sm bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-[0_0_0_1px_rgba(16,24,40,0.06)]">
            <span className="size-1.5 rounded-full bg-brand-500" /> Sales CRM for admissions & sales teams
          </p>
          <h1 data-hero="title" className="mx-auto mt-6 max-w-4xl text-[2.6rem] leading-[1.05] font-semibold tracking-[-0.03em] sm:text-6xl">
            Run every lead from first call to <span className="text-brand-600">closed deal</span>
          </h1>
          <p data-hero="copy" className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:mt-6 sm:text-lg">
            WinGrid gives each team one calm workspace: owners on every lead, every touchpoint on one timeline, a pipeline you can drag, and reports that point to the exact records behind them.
          </p>
          <div data-hero="cta" className="mx-auto mt-9 flex max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
            <Link href="/login" className="inline-flex h-12 items-center justify-center gap-2 rounded-sm bg-brand-600 px-6 text-[15px] font-medium text-white shadow-[0_8px_24px_-8px_rgba(48,72,132,0.6)] hover:bg-brand-700">
              Try the demo workspace <ArrowRight className="size-4" />
            </Link>
            <a href="#how" className="inline-flex h-12 items-center justify-center rounded-sm bg-white px-6 text-[15px] font-medium text-slate-800 shadow-[0_0_0_1px_rgba(16,24,40,0.08)] hover:bg-slate-50">
              See how it works
            </a>
          </div>
          <ul data-hero="checks" className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
            {["Role-based access", "Duplicate checks", "CSV import with preview", "Audit trail"].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <Check className="size-4 text-brand-600" /> {t}
              </li>
            ))}
          </ul>
        </div>
        <HeroPreview />
      </section>

      {/* Features: bento */}
      <section id="features" className="scroll-mt-24 px-4 pt-6 pb-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <SectionIntro reveal eyebrow="Features" title="Everything a sales team touches daily, nothing it doesn't" body="The core of a CRM, done carefully: clear ownership, fast lists, and a complete history on every record." />
          <div data-reveal-group className="mt-12 grid gap-4 md:grid-cols-6">
            <Bento className="md:col-span-4" icon={UsersRound} title="Lead management" body="Search, filter and save views across thousands of leads. Assign in bulk, catch duplicates before they're created, and import CSVs with a full preview.">
              <DemoTable />
            </Bento>
            <Bento className="md:col-span-2" icon={ClipboardList} title="Follow-ups that don't slip" body="Overdue and due-today tasks surface first, for you and your team.">
              <DemoTasks />
            </Bento>
            <Bento className="md:col-span-2" icon={KanbanSquare} title="Drag-and-drop pipeline" body="Move deals across stages; won and lost always need a reason.">
              <DemoBoard />
            </Bento>
            <Bento className="md:col-span-2" icon={BarChart3} title="Analytics you can drill into" body="Trends, sources and team performance, each number linked to its records.">
              <DemoChart />
            </Bento>
            <Bento className="md:col-span-2" icon={Package} title="Products & programs" body="Add offerings like Catalyst or IAIB and assign the people who own them.">
              <DemoProducts />
            </Bento>
            <Bento className="md:col-span-3" icon={Lock} title="Roles & tenant isolation" body="Separate workspaces per organization. Actions are permissioned separately from what each role can see.">
              <DemoRoles />
            </Bento>
            <Bento className="md:col-span-3" icon={ShieldCheck} title="Audit trail built in" body="Every assignment, stage move, import and settings change is logged with who and when.">
              <DemoAudit />
            </Bento>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-24 bg-white px-4 py-20">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_1.3fr]">
          <div data-reveal className="lg:sticky lg:top-28 lg:self-start">
            <SectionIntro align="left" eyebrow="How it works" title="From first enquiry to closed deal in four steps" body="The same lifecycle for every lead, so managers always know where things stand and nothing falls through the cracks." />
            <Link href="/login" className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800">
              Walk through it in the demo <ArrowRight className="size-4" />
            </Link>
          </div>
          <ol className="relative space-y-1">
            <span aria-hidden className="absolute top-8 bottom-8 left-[32px] w-px bg-line" />
            <span aria-hidden data-timeline-line className="absolute top-8 bottom-8 left-[32px] w-[2px] -translate-x-[0.5px] rounded-full bg-gradient-to-b from-brand-600 via-brand-500 to-brand-300" />
            {STEPS.map((s, i) => (
              <li key={s.title} data-step className="relative flex gap-4 rounded-lg p-3 transition-colors hover:bg-canvas">
                <span data-step-icon className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-lg bg-white text-brand-600 shadow-[0_0_0_1px_rgba(16,24,40,0.06),0_4px_12px_-4px_rgba(48,72,132,0.35)]">
                  <s.icon className="size-4" />
                </span>
                <div>
                  <p className="text-[10.5px] font-semibold tracking-[0.1em] text-brand-600 uppercase">Step {i + 1}</p>
                  <h3 className="mt-0.5 text-[15px] font-semibold">{s.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-24 px-4 py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_1.6fr]">
          <div data-reveal>
            <SectionIntro align="left" eyebrow="FAQ" title="Questions teams ask before switching" />
            <div className="mt-8 rounded-lg bg-white p-5 shadow-[0_0_0_1px_rgba(16,24,40,0.06)]">
              <p className="font-semibold">Still deciding?</p>
              <p className="mt-1 text-sm text-slate-600">Open the demo workspace and try it with each role: admin, manager and executive.</p>
              <Link href="/login" className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-sm bg-slate-900 px-3.5 text-sm font-medium text-white hover:bg-slate-800">
                Open demo <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
          <div data-reveal-group className="divide-y divide-line rounded-lg bg-white px-6 shadow-[0_0_0_1px_rgba(16,24,40,0.06)]">
            {FAQ.map((f, i) => (
              <details key={f.q} className="group py-5" open={i === 0}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span aria-hidden className="flex size-7 shrink-0 items-center justify-center rounded-full bg-canvas text-brand-600 transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 pr-10 leading-relaxed text-slate-600">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-20">
        <div data-reveal className="relative mx-auto max-w-6xl overflow-hidden rounded-lg bg-brand-900 px-6 py-14 text-center text-white sm:px-12">
          <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-white/10 blur-2xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-16 size-80 rounded-full bg-brand-500/30 blur-3xl" />
          <h2 className="relative text-3xl font-semibold tracking-tight sm:text-4xl">See your whole pipeline clearly</h2>
          <p className="relative mx-auto mt-3 max-w-xl text-white/80">Sign in to the demo workspace. It&apos;s preloaded with sample leads, deals and tasks, and nothing leaves your browser.</p>
          <Link href="/login" className="relative mt-8 inline-flex h-12 items-center gap-2 rounded-sm bg-white px-6 text-[15px] font-semibold text-brand-800 hover:bg-brand-50">
            Open the demo <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="overflow-hidden border-t border-line bg-white px-4">
        <div className="mx-auto grid max-w-6xl grid-cols-3 gap-x-6 gap-y-10 py-12 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="col-span-3 lg:col-span-1">
            <Logo />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-500">A multi-organization sales CRM for leads, pipeline, follow-ups and reporting.</p>
          </div>
          <FooterCol title="Product" links={[["Features", "#features"], ["How it works", "#how"], ["FAQ", "#faq"]]} />
          <FooterCol title="Workspace" links={[["Sign in", "/login"], ["Reset password", "/forgot-password"], ["Open demo", "/login"]]} />
          <FooterCol title="Modules" links={[["Leads", "/leads"], ["Opportunities", "/opportunities"], ["Analytics", "/analytics"]]} />
        </div>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 border-t border-line py-6 text-xs text-slate-500 sm:flex-row">
          <p>© WinGrid</p>
          <p>Demo build. Sample data is stored only in your browser.</p>
        </div>
        <p aria-hidden data-parallax="0.35" className="pointer-events-none mx-auto max-w-6xl overflow-hidden text-center text-[22vw] leading-[0.78] font-bold tracking-[-0.06em] text-transparent select-none lg:text-[260px]" style={{ backgroundImage: "linear-gradient(180deg, rgba(48,72,132,0.16), rgba(48,72,132,0) 85%)", WebkitBackgroundClip: "text", backgroundClip: "text" }}>
          WinGrid
        </p>
      </footer>
    </div>
    </LandingMotion>
  );
}

function SectionIntro({ eyebrow, title, body, align = "center", reveal }: { eyebrow: string; title: string; body?: string; align?: "center" | "left"; reveal?: boolean }) {
  return (
    <div data-reveal={reveal || undefined} className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-md"}>
      <p className="text-xs font-semibold tracking-[0.12em] text-brand-600 uppercase">{eyebrow}</p>
      <h2 className="mt-3 text-[1.75rem] leading-tight font-semibold tracking-[-0.02em] sm:text-[2.1rem]">{title}</h2>
      {body && <p className="mt-3 text-[15px] leading-relaxed text-slate-600">{body}</p>}
    </div>
  );
}

function Bento({ className, icon: Icon, title, body, children }: { className?: string; icon: React.ComponentType<{ className?: string }>; title: string; body: string; children: React.ReactNode }) {
  return (
    <div data-bento className={`group relative flex flex-col overflow-hidden rounded-lg bg-white p-2 shadow-[0_0_0_1px_rgba(16,24,40,0.06)] transition-shadow will-change-transform hover:shadow-[0_0_0_1px_rgba(48,72,132,0.18),0_24px_48px_-24px_rgba(48,72,132,0.4)] ${className ?? ""}`}>
      {/* Cursor spotlight, positioned by LandingMotion via --mx/--my */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-10 rounded-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: "radial-gradient(380px circle at var(--mx, 50%) var(--my, 50%), rgba(72,96,156,0.10), transparent 60%)" }} />
      <div aria-hidden className="flex flex-1 flex-col justify-center rounded-lg bg-gradient-to-b from-[#edf0f7] to-[#f7f8fb] px-5 pt-1 pb-5 [&>*:first-child]:mt-4">
        {children}
      </div>
      <div className="px-4 pt-4 pb-3">
        <h3 className="flex items-center gap-2 text-[17px] font-semibold">
          <Icon className="size-[18px] text-brand-600" />
          {title}
        </h3>
        <p className="mt-1.5 text-[14.5px] leading-relaxed text-slate-600">{body}</p>
      </div>
    </div>
  );
}

/** Renders the final value (so it reads correctly without JS); GSAP counts up from 0. */
function CountUp({ value }: { value: string }) {
  const m = value.match(/^(\D*)([\d.]+)(.*)$/);
  if (!m) return <>{value}</>;
  return (
    <span data-count={m[2]} data-prefix={m[1]} data-suffix={m[3]}>
      {value}
    </span>
  );
}

function FloatCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div data-float className={`absolute z-20 hidden w-72 rounded-lg bg-white p-4 text-left shadow-[0_24px_48px_-16px_rgba(16,24,40,0.25),0_0_0_1px_rgba(16,24,40,0.06)] lg:block ${className ?? ""}`}>{children}</div>;
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-[0.08em] text-slate-400 uppercase">{title}</p>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map(([l, h]) => (
          <li key={l}>
            <Link href={h} className="text-slate-600 hover:text-slate-900">
              {l}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function HeroPreview() {
  const nav: [React.ComponentType<{ className?: string }>, string][] = [
    [Gauge, "Dashboard"],
    [UsersRound, "Leads"],
    [Building2, "Accounts"],
    [KanbanSquare, "Opportunities"],
    [Package, "Products"],
    [ClipboardList, "Tasks & Activities"],
    [LineChart, "Analytics"],
  ];
  const orgNav: [React.ComponentType<{ className?: string }>, string][] = [
    [Users, "Users & Teams"],
    [Settings, "Settings"],
    [Plug, "Integrations & Sync"],
    [ScrollText, "Audit log"],
  ];
  const kpis: [string, string, string, string][] = [
    ["New leads · 7 days", "26", "+11 vs previous 7 days", "#3c5490"],
    ["Awaiting first contact", "40", "Leads in New status", "#2a78d6"],
    ["Open pipeline", "₹2.5Cr", "27 open opportunities", "#eb6834"],
    ["Win rate · 90 days", "71%", "10 won of 14 closed", "#1baf7a"],
    ["Overdue tasks", "24", "1 due later today", "#e11d48"],
  ];
  const tasks: [string, string, string, boolean][] = [
    ["Meeting with Lucas Sharma", "Lucas Sharma · Imran Ali", "Overdue · 22 Oct, 9:00 am", false],
    ["Call Ishaan Brooks", "Ishaan Brooks · Anita Desai", "Overdue · 22 Oct, 10:00 am", false],
    ["Call Leah Nguyen", "Leah Nguyen · Imran Ali", "Overdue · 22 Oct, 4:30 pm", true],
    ["Email brochure to Dev", "Dev Lopez · Imran Ali", "Today · 11:00 am", false],
    ["Call Olivia Reddy", "Olivia Reddy · Joel Thomas", "Today · 3:30 pm", false],
  ];
  const contacts: [string, string, string][] = [
    ["Maya Kapoor", "Walk-in · Anita Desai", "bg-slate-200 text-slate-700"],
    ["Zoe Kapoor", "Partner · Unassigned", "bg-sky-100 text-sky-700"],
    ["Arjun Brooks", "CSV import · Unassigned", "bg-emerald-100 text-emerald-700"],
    ["Olivia Singh", "Facebook Ads · Unassigned", "bg-amber-100 text-amber-800"],
  ];
  const funnel: [string, number, string][] = [
    ["New", 40, "bg-brand-500"],
    ["Contacted", 52, "bg-brand-500"],
    ["Qualified", 31, "bg-brand-500"],
    ["Converted", 30, "bg-emerald-500"],
  ];
  const stages: [string, number, string][] = [
    ["Prospect", 74, "₹73.8L"],
    ["Demo / Visit", 19, "₹18.5L"],
    ["Proposal", 72, "₹72.3L"],
    ["Negotiation", 86, "₹86.3L"],
  ];

  return (
    <div data-hero="preview" className="relative mx-auto mt-16 max-w-[1120px]" aria-hidden>
      <FloatCard className="top-[420px] -left-10 xl:-left-36">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-800">AD</span>
          <div>
            <p className="text-[12px] text-slate-500">
              <span className="font-semibold text-slate-900">Anita Desai</span> assigned you a lead
            </p>
            <p className="mt-1 text-[13px] font-semibold">Maya Kapoor · Walk-in</p>
            <div className="mt-2.5 flex gap-1.5">
              <span className="rounded-sm bg-brand-600 px-2.5 py-1 text-[11px] font-medium text-white">Log call</span>
              <span className="rounded-sm bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">Schedule</span>
            </div>
          </div>
        </div>
      </FloatCard>
      <FloatCard className="top-[540px] -right-10 xl:-right-36">
        <p className="flex items-center justify-between text-[12px] font-semibold">
          Recently won <span className="rounded-sm bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">This week</span>
        </p>
        <ul className="mt-2.5 space-y-2 text-[12px]">
          {[
            ["Kite Logistics — MBA", "₹13.3L"],
            ["Orbit Retail — Certificate", "₹7.5L"],
            ["Summit Schools — Training", "₹4.2L"],
          ].map(([n, v]) => (
            <li key={n} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2">
                <span className="flex size-5 items-center justify-center rounded-sm bg-emerald-50 text-emerald-600">
                  <Check className="size-3" />
                </span>
                {n}
              </span>
              <span className="font-semibold tabular-nums">{v}</span>
            </li>
          ))}
        </ul>
      </FloatCard>

      {/* Browser window with the full desktop app. The mask fades the window, its border and its
          glow together, so the bottom dissolves into the page instead of ending on a hard edge. */}
      <div className="sm:-mx-12 sm:px-12 sm:pt-12 sm:-mt-12 [mask-image:linear-gradient(to_bottom,black_58%,transparent_96%)]">
      <div data-hero="window" className="relative h-[470px] overflow-hidden rounded-t-lg border border-white bg-white/70 shadow-[0_30px_90px_-30px_rgba(48,72,132,0.45),0_0_0_1px_rgba(16,24,40,0.06)] sm:h-[760px]">
        <div className="flex h-10 items-center gap-2 border-b border-line bg-white px-4">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
          <span className="mx-auto flex h-6 w-72 max-w-[50%] items-center justify-center gap-1.5 rounded-sm bg-slate-100 text-[11px] text-slate-500">
            <Lock className="size-3" /> app.wingrid.io/dashboard
          </span>
        </div>
        <div className="flex h-full bg-canvas text-left">
          {/* Sidebar */}
          <div className="hidden w-52 shrink-0 flex-col px-3 md:flex">
            <div className="flex h-14 items-center px-2">
              <Logo className="text-sm" />
            </div>
            <ul className="space-y-0.5">
              {nav.map(([Icon, n], i) => (
                <li key={n} className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium ${i === 0 ? "bg-white text-slate-900 shadow-[0_0_0_1px_rgba(16,24,40,0.05),0_1px_2px_rgba(16,24,40,0.05)]" : "text-slate-500"}`}>
                  <Icon className={`size-4 ${i === 0 ? "text-brand-600" : "text-slate-400"}`} />
                  {n}
                </li>
              ))}
            </ul>
            <p className="mt-5 mb-1.5 px-3 text-[9px] font-semibold tracking-[0.1em] text-slate-400 uppercase">Organization</p>
            <ul className="space-y-0.5">
              {orgNav.map(([Icon, n]) => (
                <li key={n} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-slate-500">
                  <Icon className="size-4 text-slate-400" />
                  {n}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            {/* Topbar */}
            <div className="flex h-14 shrink-0 items-center gap-3 px-3 md:pl-1">
              <span className="flex h-8 w-64 max-w-[60%] items-center gap-2 overflow-hidden rounded-lg bg-white px-3 text-[11px] whitespace-nowrap text-slate-400 shadow-[0_0_0_1px_rgba(16,24,40,0.06)]">
                <Search className="size-3.5 shrink-0" /> <span className="truncate">Search leads, phone, email…</span>
              </span>
              <span className="ml-auto hidden rounded bg-amber-100 px-1.5 py-0.5 text-[8px] font-semibold tracking-wide text-amber-800 uppercase sm:inline">Demo data</span>
              <span className="hidden text-[11px] font-medium text-slate-600 lg:inline">Brightpath Academy</span>
              <span className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-semibold text-emerald-700">RM</span>
                <span className="hidden leading-tight lg:block">
                  <span className="block text-[11px] font-semibold">Ravi Menon</span>
                  <span className="block text-[9px] text-slate-500">Organization Admin</span>
                </span>
              </span>
            </div>

            {/* Sheet */}
            <div className="mx-2 min-w-0 flex-1 rounded-t-lg border border-line bg-white p-4 sm:p-5 md:mr-2 md:ml-0">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xl font-semibold tracking-tight">Good afternoon, Ravi</p>
                  <p className="text-[11px] text-slate-500">Showing Brightpath Academy&apos;s work · Organization Admin</p>
                </div>
                <div className="hidden gap-2 sm:flex">
                  <span className="rounded-sm border border-line px-2.5 py-1.5 text-[11px] font-medium">+ Task</span>
                  <span className="rounded-sm bg-brand-600 px-2.5 py-1.5 text-[11px] font-medium text-white">+ Lead</span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2.5 lg:grid-cols-5">
                {kpis.map(([l, v, sub, c], i) => (
                  <div key={l} className={`rounded-lg border border-brand-100 bg-brand-50/60 p-3 ${i > 3 ? "hidden lg:block" : ""}`}>
                    <p className="text-[10px] font-medium text-slate-500">{l}</p>
                    <div className="mt-1 flex items-end justify-between gap-1">
                      <p className="text-lg font-semibold tabular-nums" style={{ color: l === "Overdue tasks" ? c : undefined }}>
                        <CountUp value={v} />
                      </p>
                      <svg width="48" height="18" viewBox="0 0 56 20" className="hidden sm:block">
                        <path data-draw d="M2,15 C10,14 14,8 22,10 C30,12 34,4 42,6 C48,7 51,3 54,3" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                    </div>
                    <p className="mt-0.5 truncate text-[9px] text-slate-500">{sub}</p>
                  </div>
                ))}
              </div>

              <div className="mt-3 grid gap-2.5 lg:grid-cols-[1.7fr_1fr]">
                <div className="rounded-lg border border-line p-3.5">
                  <div className="flex items-baseline justify-between">
                    <p className="text-[12px] font-semibold">Today&apos;s priorities</p>
                    <span className="text-[10px] font-medium text-brand-600">All tasks →</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Overdue and due-today follow-ups, oldest first</p>
                  {tasks.map(([t, sub, d, high]) => (
                    <div key={t} className="mt-2 flex items-center gap-2.5 border-t border-line pt-2">
                      <span className="size-3 shrink-0 rounded border border-slate-300" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11px] font-medium">{t}</span>
                        <span className="block truncate text-[9px] text-slate-500">{sub}</span>
                      </span>
                      {high && <span className="rounded-sm bg-amber-50 px-1.5 text-[9px] font-medium text-amber-800">High</span>}
                      <span className={`shrink-0 text-[10px] font-medium ${d.startsWith("Overdue") ? "text-rose-600" : "text-brand-700"}`}>{d}</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg border border-line p-3.5">
                  <p className="text-[12px] font-semibold">Needs first contact</p>
                  <p className="text-[10px] text-slate-500">New leads with no call, email or meeting yet</p>
                  {contacts.map(([n, sub, tone]) => (
                    <div key={n} className="mt-2 flex items-center gap-2.5 border-t border-line pt-2">
                      <span className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[8px] font-semibold ${tone}`}>
                        {n
                          .split(" ")
                          .map((x) => x[0])
                          .join("")}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11px] font-medium">{n}</span>
                        <span className="block truncate text-[9px] text-slate-500">{sub}</span>
                      </span>
                      <Phone className="size-3.5 text-brand-500" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 grid gap-2.5 lg:grid-cols-2">
                <div className="rounded-lg border border-line p-3.5">
                  <p className="text-[12px] font-semibold">Lead funnel</p>
                  {funnel.map(([s, n, tone]) => (
                    <div key={s} className="mt-2 flex items-center gap-2 text-[10px]">
                      <span className="w-16 text-slate-600">{s}</span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <span className={`block h-full rounded-full ${tone}`} style={{ width: `${(n / 52) * 100}%` }} />
                      </span>
                      <span className="w-6 text-right font-medium tabular-nums">{n}</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg border border-line p-3.5">
                  <p className="text-[12px] font-semibold">Open pipeline by stage</p>
                  {stages.map(([s, n, v]) => (
                    <div key={s} className="mt-2 flex items-center gap-2 text-[10px]">
                      <span className="w-20 text-slate-600">{s}</span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <span className="block h-full rounded-full bg-brand-500" style={{ width: `${(n / 86) * 100}%` }} />
                      </span>
                      <span className="w-12 text-right font-medium tabular-nums">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
