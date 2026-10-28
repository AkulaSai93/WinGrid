import { ArrowRight, BarChart3, Building2, Check, ClipboardList, Gauge, KanbanSquare, LineChart, Lock, Package, Phone, Plug, ScrollText, Search, Settings, ShieldCheck, Upload, Users, UsersRound } from "lucide-react";
import Link from "next/link";
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
    <div className="min-h-dvh bg-canvas text-slate-900">
      {/* Nav */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-40 px-4 pt-4">
        <div data-nav className="pointer-events-auto mx-auto flex h-14 max-w-6xl items-center justify-between rounded-2xl border border-white/80 bg-white/80 px-4 shadow-[0_1px_2px_rgba(16,24,40,0.05),0_8px_24px_-12px_rgba(16,24,40,0.12)] backdrop-blur-md">
          <Link href="/" aria-label="WinGrid home">
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
          <div className="flex items-center gap-1.5">
            <Link href="/login" className="hidden h-9 items-center rounded-xl px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 sm:inline-flex">
              Sign in
            </Link>
            <Link href="/login" className="inline-flex h-9 items-center gap-1.5 rounded-md bg-brand-600 px-3.5 text-sm font-medium text-white shadow-sm hover:bg-brand-700">
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
          <p data-hero="badge" className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-[0_0_0_1px_rgba(16,24,40,0.06)]">
            <span className="size-1.5 rounded-full bg-brand-500" /> Sales CRM for admissions & sales teams
          </p>
          <h1 data-hero="title" className="mx-auto mt-6 max-w-4xl text-[2.6rem] leading-[1.05] font-semibold tracking-[-0.03em] sm:text-6xl">
            Run every lead from first call to <span className="text-brand-600">closed deal</span>
          </h1>
          <p data-hero="copy" className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
            WinGrid gives each team one calm workspace: owners on every lead, every touchpoint on one timeline, a pipeline you can drag, and reports that point to the exact records behind them.
          </p>
          <div data-hero="cta" className="mt-9 flex flex-wrap justify-center gap-3">
            <Link href="/login" className="inline-flex h-12 items-center gap-2 rounded-md bg-brand-600 px-6 text-[15px] font-medium text-white shadow-[0_8px_24px_-8px_rgba(48,72,132,0.6)] hover:bg-brand-700">
              Try the demo workspace <ArrowRight className="size-4" />
            </Link>
            <a href="#how" className="inline-flex h-12 items-center rounded-md bg-white px-6 text-[15px] font-medium text-slate-800 shadow-[0_0_0_1px_rgba(16,24,40,0.08)] hover:bg-slate-50">
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
      <section id="features" className="scroll-mt-24 px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <SectionIntro reveal eyebrow="Features" title="Everything a sales team touches daily, nothing it doesn't" body="The core of a CRM, done carefully: clear ownership, fast lists, and a complete history on every record." />
          <div data-reveal-group className="mt-12 grid gap-4 md:grid-cols-6">
            <Bento className="md:col-span-4" icon={UsersRound} title="Lead management" body="Search, filter and save views across thousands of leads. Assign in bulk, catch duplicates before they're created, and import CSVs with a full preview.">
              <MiniTable />
            </Bento>
            <Bento className="md:col-span-2" icon={ClipboardList} title="Follow-ups that don't slip" body="Overdue and due-today tasks surface first, for you and your team.">
              <MiniTasks />
            </Bento>
            <Bento className="md:col-span-2" icon={KanbanSquare} title="Drag-and-drop pipeline" body="Move deals across stages; won and lost always need a reason.">
              <MiniBoard />
            </Bento>
            <Bento className="md:col-span-2" icon={BarChart3} title="Analytics you can drill into" body="Trends, sources and team performance, each number linked to its records.">
              <MiniChart />
            </Bento>
            <Bento className="md:col-span-2" icon={Package} title="Products & programs" body="Add offerings like Catalyst or IAIB and assign the people who own them.">
              <MiniProducts />
            </Bento>
            <Bento className="md:col-span-3" icon={Lock} title="Roles & tenant isolation" body="Separate workspaces per organization. Actions are permissioned separately from what each role can see.">
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["Super Admin", "All organizations"],
                  ["Org Admin", "Whole organization"],
                  ["Manager", "Team records"],
                  ["Executive", "Own records"],
                ].map(([r, s]) => (
                  <span key={r} className="rounded-xl bg-white px-3 py-2.5 text-left shadow-[0_0_0_1px_rgba(16,24,40,0.04)]">
                    <span className="block text-[13px] font-semibold">{r}</span>
                    <span className="block text-[11px] text-slate-500">{s}</span>
                  </span>
                ))}
              </div>
            </Bento>
            <Bento className="md:col-span-3" icon={ShieldCheck} title="Audit trail built in" body="Every assignment, stage move, import and settings change is logged with who and when.">
              <ul className="space-y-2 text-[13px]">
                {[
                  ["lead.assign", "Karan Malhotra → Anita Desai"],
                  ["opp.stage", "Proposal → Won"],
                  ["product.update", "IAIB: added Lakshmi Rao"],
                ].map(([a, d]) => (
                  <li key={a} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-[0_0_0_1px_rgba(16,24,40,0.04)]">
                    <span className="rounded-full bg-brand-50 px-2 py-0.5 font-mono text-[11px] text-brand-700">{a}</span>
                    <span className="truncate text-slate-600">{d}</span>
                  </li>
                ))}
              </ul>
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
          <ol className="relative space-y-4">
            <span aria-hidden className="absolute top-8 bottom-8 left-[39px] w-px bg-line" />
            <span aria-hidden data-timeline-line className="absolute top-8 bottom-8 left-[39px] w-[2px] -translate-x-[0.5px] rounded-full bg-gradient-to-b from-brand-600 via-brand-500 to-brand-300" />
            {STEPS.map((s, i) => (
              <li key={s.title} data-step className="relative flex gap-5 rounded-2xl p-3 transition-colors hover:bg-canvas">
                <span data-step-icon className="relative z-10 flex size-[54px] shrink-0 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-[0_0_0_1px_rgba(16,24,40,0.06),0_4px_12px_-4px_rgba(48,72,132,0.35)]">
                  <s.icon className="size-5" />
                </span>
                <div className="pt-1">
                  <p className="text-xs font-semibold tracking-[0.08em] text-brand-600 uppercase">Step {i + 1}</p>
                  <h3 className="mt-1 text-lg font-semibold">{s.title}</h3>
                  <p className="mt-1.5 leading-relaxed text-slate-600">{s.body}</p>
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
            <div className="mt-8 rounded-2xl bg-white p-5 shadow-[0_0_0_1px_rgba(16,24,40,0.06)]">
              <p className="font-semibold">Still deciding?</p>
              <p className="mt-1 text-sm text-slate-600">Open the demo workspace and try it with each role: admin, manager and executive.</p>
              <Link href="/login" className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-md bg-slate-900 px-3.5 text-sm font-medium text-white hover:bg-slate-800">
                Open demo <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
          <div data-reveal-group className="divide-y divide-line rounded-2xl bg-white px-6 shadow-[0_0_0_1px_rgba(16,24,40,0.06)]">
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
        <div data-reveal className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-brand-900 px-6 py-14 text-center text-white sm:px-12">
          <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-white/10 blur-2xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-16 size-80 rounded-full bg-brand-500/30 blur-3xl" />
          <h2 className="relative text-3xl font-semibold tracking-tight sm:text-4xl">See your whole pipeline clearly</h2>
          <p className="relative mx-auto mt-3 max-w-xl text-white/80">Sign in to the demo workspace. It&apos;s preloaded with sample leads, deals and tasks, and nothing leaves your browser.</p>
          <Link href="/login" className="relative mt-8 inline-flex h-12 items-center gap-2 rounded-md bg-white px-6 text-[15px] font-semibold text-brand-800 hover:bg-brand-50">
            Open the demo <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line bg-white px-4">
        <div className="mx-auto grid max-w-6xl gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
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
      <h2 className="mt-3 text-3xl leading-tight font-semibold tracking-[-0.02em] sm:text-4xl">{title}</h2>
      {body && <p className="mt-4 text-lg leading-relaxed text-slate-600">{body}</p>}
    </div>
  );
}

function Bento({ className, icon: Icon, title, body, children }: { className?: string; icon: React.ComponentType<{ className?: string }>; title: string; body: string; children: React.ReactNode }) {
  return (
    <div className={`group flex flex-col overflow-hidden rounded-3xl bg-white p-2 shadow-[0_0_0_1px_rgba(16,24,40,0.06)] transition-shadow hover:shadow-[0_0_0_1px_rgba(48,72,132,0.18),0_16px_40px_-20px_rgba(48,72,132,0.35)] ${className ?? ""}`}>
      <div aria-hidden className="flex flex-1 flex-col justify-center rounded-[20px] bg-gradient-to-b from-[#edf0f7] to-[#f7f8fb] px-5 pt-1 pb-5 [&>*:first-child]:mt-4">
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
  return <div data-float className={`absolute z-20 hidden w-72 rounded-2xl bg-white p-4 text-left shadow-[0_24px_48px_-16px_rgba(16,24,40,0.25),0_0_0_1px_rgba(16,24,40,0.06)] lg:block ${className ?? ""}`}>{children}</div>;
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

/* ---------- Illustrative mini-UIs: decorative, mirroring the real screens ---------- */

const pill = (tone: string) => `inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${tone}`;

function MiniTable() {
  const rows = [
    ["Rahul Nguyen", "Qualified", "bg-amber-50 text-amber-800", "Google Ads", "Suresh P."],
    ["Ethan Bose", "New", "bg-brand-50 text-brand-700", "Walk-in", "Karan M."],
    ["Pooja Patel", "Contacted", "bg-sky-50 text-sky-700", "Event", "Lakshmi R."],
    ["Diya Das", "Converted", "bg-emerald-50 text-emerald-700", "Website", "Lakshmi R."],
  ];
  return (
    <div className="overflow-hidden rounded-2xl border border-line">
      <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-2 border-b border-line bg-canvas/50 px-4 py-2 text-[10px] font-semibold tracking-[0.06em] text-slate-400 uppercase">
        <span>Name</span>
        <span>Status</span>
        <span>Source</span>
        <span>Owner</span>
      </div>
      {rows.map(([n, s, t, src, o]) => (
        <div key={n} className="grid grid-cols-[1.4fr_1fr_1fr_1fr] items-center gap-2 border-b border-line/70 bg-white px-4 py-2.5 text-[12px] last:border-0">
          <span className="truncate font-medium">{n}</span>
          <span>
            <span className={pill(t)}>
              <span className="size-1 rounded-full bg-current" />
              {s}
            </span>
          </span>
          <span className="truncate text-slate-500">{src}</span>
          <span className="truncate text-slate-500">{o}</span>
        </div>
      ))}
    </div>
  );
}

function MiniTasks() {
  const items: [string, string, string, boolean][] = [
    ["Call Tara Mehta", "Overdue", "text-rose-600", false],
    ["Email brochure to Dev", "Today 11:00", "text-brand-700", false],
    ["Campus visit: Neil", "Done", "text-slate-400", true],
  ];
  return (
    <ul className="space-y-2">
      {items.map(([t, d, c, done]) => (
        <li key={t} className="flex items-center gap-2.5 rounded-xl bg-white px-3 py-2.5 text-[12px] shadow-[0_0_0_1px_rgba(16,24,40,0.04)]">
          <span className={`flex size-4 shrink-0 items-center justify-center rounded border ${done ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 bg-white"}`}>{done && <Check className="size-3" />}</span>
          <span className={`flex-1 truncate ${done ? "text-slate-400 line-through" : "font-medium"}`}>{t}</span>
          <span className={`shrink-0 text-[11px] font-medium ${c}`}>{d}</span>
        </li>
      ))}
    </ul>
  );
}

function MiniBoard() {
  const cols: [string, string[]][] = [
    ["Proposal", ["Orbit Retail", "Cedar Finance"]],
    ["Won", ["Kite Logistics"]],
  ];
  return (
    <div className="grid grid-cols-2 gap-2">
      {cols.map(([stage, cards]) => (
        <div key={stage} className="rounded-xl bg-white/70 p-2 shadow-[0_0_0_1px_rgba(16,24,40,0.04)]">
          <p className="mb-1.5 flex items-center gap-1.5 px-1 text-[10px] font-semibold text-slate-600">
            <span className={`size-1.5 rounded-full ${stage === "Won" ? "bg-emerald-500" : "bg-brand-500"}`} />
            {stage}
          </p>
          {cards.map((c) => (
            <div key={c} className="mb-1.5 rounded-lg bg-white px-2 py-1.5 text-[11px] font-medium shadow-[0_0_0_1px_rgba(16,24,40,0.05)]">
              {c}
              <span className="block text-[10px] font-normal text-slate-400">₹4,50,000</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function MiniChart() {
  return (
    <svg viewBox="0 0 220 90" className="w-full">
      <defs>
        <linearGradient id="lp-g" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#3c5490" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#3c5490" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[22, 50, 78].map((y) => (
        <line key={y} x1="0" x2="220" y1={y} y2={y} stroke="#e4e7ee" strokeDasharray="3 4" />
      ))}
      <path d="M0,62 C25,58 35,40 60,44 C85,48 95,30 120,34 C145,38 160,18 185,20 C200,21 210,12 220,10 L220,90 L0,90 Z" fill="url(#lp-g)" />
      <path d="M0,62 C25,58 35,40 60,44 C85,48 95,30 120,34 C145,38 160,18 185,20 C200,21 210,12 220,10" fill="none" stroke="#3c5490" strokeWidth="2" strokeLinecap="round" />
      <path d="M0,78 C30,76 50,70 80,72 C110,74 130,64 160,62 C185,60 200,56 220,52" fill="none" stroke="#1baf7a" strokeWidth="2" strokeLinecap="round" />
      <circle cx="185" cy="20" r="4" fill="#3c5490" stroke="white" strokeWidth="2" />
    </svg>
  );
}

function MiniProducts() {
  const items: [string, string[]][] = [
    ["Catalyst", ["AD", "FS", "SP"]],
    ["IAIB", ["KM", "JT", "LR", "GD"]],
  ];
  const tones = ["bg-amber-100 text-amber-800", "bg-slate-200 text-slate-700", "bg-emerald-100 text-emerald-700", "bg-sky-100 text-sky-700"];
  return (
    <ul className="space-y-2">
      {items.map(([n, people]) => (
        <li key={n} className="flex items-center gap-2.5 rounded-xl bg-white px-3 py-2.5 shadow-[0_0_0_1px_rgba(16,24,40,0.04)]">
          <span className="flex size-7 items-center justify-center rounded-lg bg-white text-brand-600 shadow-[0_0_0_1px_rgba(16,24,40,0.05)]">
            <Package className="size-3.5" />
          </span>
          <span className="flex-1 text-[13px] font-semibold">{n}</span>
          <span className="flex gap-0.5">
            {people.map((p, i) => (
              <span key={p} className={`flex size-5 items-center justify-center rounded-full text-[8px] font-semibold ${tones[i % 4]}`}>
                {p}
              </span>
            ))}
          </span>
        </li>
      ))}
    </ul>
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
              <span className="rounded-md bg-brand-600 px-2.5 py-1 text-[11px] font-medium text-white">Log call</span>
              <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">Schedule</span>
            </div>
          </div>
        </div>
      </FloatCard>
      <FloatCard className="top-[540px] -right-10 xl:-right-36">
        <p className="flex items-center justify-between text-[12px] font-semibold">
          Recently won <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">This week</span>
        </p>
        <ul className="mt-2.5 space-y-2 text-[12px]">
          {[
            ["Kite Logistics — MBA", "₹13.3L"],
            ["Orbit Retail — Certificate", "₹7.5L"],
            ["Summit Schools — Training", "₹4.2L"],
          ].map(([n, v]) => (
            <li key={n} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2">
                <span className="flex size-5 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
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
      <div className="-mx-12 px-12 pt-12 -mt-12 [mask-image:linear-gradient(to_bottom,black_58%,transparent_96%)]">
      <div data-hero="window" className="relative h-[560px] overflow-hidden rounded-t-[22px] border border-white bg-white/70 shadow-[0_30px_90px_-30px_rgba(48,72,132,0.45),0_0_0_1px_rgba(16,24,40,0.06)] sm:h-[760px]">
        <div className="flex h-10 items-center gap-2 border-b border-line bg-white px-4">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
          <span className="mx-auto flex h-6 w-72 max-w-[50%] items-center justify-center gap-1.5 rounded-md bg-slate-100 text-[11px] text-slate-500">
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
                <li key={n} className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-[12px] font-medium ${i === 0 ? "bg-white text-slate-900 shadow-[0_0_0_1px_rgba(16,24,40,0.05),0_1px_2px_rgba(16,24,40,0.05)]" : "text-slate-500"}`}>
                  <Icon className={`size-4 ${i === 0 ? "text-brand-600" : "text-slate-400"}`} />
                  {n}
                </li>
              ))}
            </ul>
            <p className="mt-5 mb-1.5 px-3 text-[9px] font-semibold tracking-[0.1em] text-slate-400 uppercase">Organization</p>
            <ul className="space-y-0.5">
              {orgNav.map(([Icon, n]) => (
                <li key={n} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[12px] font-medium text-slate-500">
                  <Icon className="size-4 text-slate-400" />
                  {n}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            {/* Topbar */}
            <div className="flex h-14 shrink-0 items-center gap-3 px-3 md:pl-1">
              <span className="flex h-8 w-64 max-w-[45%] items-center gap-2 rounded-xl bg-white px-3 text-[11px] text-slate-400 shadow-[0_0_0_1px_rgba(16,24,40,0.06)]">
                <Search className="size-3.5" /> Search leads, phone, email…
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
            <div className="mx-2 flex-1 rounded-t-2xl border border-line bg-white p-5 md:mr-2 md:ml-0">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xl font-semibold tracking-tight">Good afternoon, Ravi</p>
                  <p className="text-[11px] text-slate-500">Showing Brightpath Academy&apos;s work · Organization Admin</p>
                </div>
                <div className="hidden gap-2 sm:flex">
                  <span className="rounded-md border border-line px-2.5 py-1.5 text-[11px] font-medium">+ Task</span>
                  <span className="rounded-md bg-brand-600 px-2.5 py-1.5 text-[11px] font-medium text-white">+ Lead</span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2.5 lg:grid-cols-5">
                {kpis.map(([l, v, sub, c], i) => (
                  <div key={l} className={`rounded-2xl border border-brand-100 bg-brand-50/60 p-3 ${i > 3 ? "hidden lg:block" : ""}`}>
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
                <div className="rounded-2xl border border-line p-3.5">
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
                      {high && <span className="rounded-full bg-amber-50 px-1.5 text-[9px] font-medium text-amber-800">High</span>}
                      <span className={`shrink-0 text-[10px] font-medium ${d.startsWith("Overdue") ? "text-rose-600" : "text-brand-700"}`}>{d}</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl border border-line p-3.5">
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
                <div className="rounded-2xl border border-line p-3.5">
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
                <div className="rounded-2xl border border-line p-3.5">
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
