import type {
  Activity,
  DB,
  Lead,
  LeadStatus,
  Opportunity,
  OrgSettings,
  Organization,
  Product,
  Stage,
  Task,
  Team,
  User,
} from "./types";

export const DB_VERSION = 3;
export const DEMO_PASSWORD = "demo1234";

// Small deterministic PRNG so demo data is stable between resets.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = ["Aarav", "Priya", "Rohan", "Ananya", "Vikram", "Meera", "Arjun", "Kavya", "Ishaan", "Diya", "Kabir", "Sara", "Neil", "Tara", "Dev", "Nisha", "Rahul", "Pooja", "Aditya", "Riya", "Liam", "Emma", "Noah", "Olivia", "Ethan", "Maya", "Lucas", "Zoe", "Omar", "Leah"];
const LAST = ["Sharma", "Patel", "Iyer", "Reddy", "Kapoor", "Nair", "Gupta", "Mehta", "Rao", "Singh", "Das", "Khan", "Joshi", "Bose", "Menon", "Carter", "Nguyen", "Brooks", "Lopez", "Fischer"];
const COMPANIES = ["Lumen Labs", "Orbit Retail", "Kite Logistics", "Bluepeak Health", "Nimbus Foods", "Vertex Motors", "Cedar Finance", "Pixel Forge", "Harbor Freight Co", "Summit Schools", "Atlas Media", "Quanta Systems", "Greenleaf Farms", "Ironclad Security", "Silverline Travel", "Northstar Clinics"];
const CITIES = ["Bengaluru", "Hyderabad", "Mumbai", "Pune", "Delhi", "Chennai", "Kolkata", "Ahmedabad", "Jaipur", "Kochi"];
const TITLES = ["Founder", "Head of Sales", "Operations Manager", "Procurement Lead", "CTO", "Marketing Director", "Parent", "Student", "Admissions Counsellor", "Finance Manager"];

const SOURCES = ["Website form", "Referral", "Google Ads", "Facebook Ads", "Walk-in", "Event", "CSV import", "Partner"];

const DAY = 86_400_000;

export function createSeed(now = Date.now()): DB {
  const rand = mulberry32(42);
  const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
  const int = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
  const iso = (t: number) => new Date(t).toISOString();
  let idc = 0;
  const id = (p: string) => `${p}_${(++idc).toString(36)}`;

  const organizations: Organization[] = [
    { id: "org_bright", name: "Brightpath Academy", subdomain: "brightpath", plan: "Growth", status: "active", timezone: "Asia/Kolkata", createdAt: iso(now - 220 * DAY) },
    { id: "org_north", name: "Northwind Realty", subdomain: "northwind", plan: "Starter", status: "active", timezone: "Asia/Kolkata", createdAt: iso(now - 95 * DAY) },
    { id: "org_cobalt", name: "Cobalt Insurance", subdomain: "cobalt", plan: "Enterprise", status: "suspended", timezone: "Asia/Dubai", createdAt: iso(now - 400 * DAY) },
  ];

  const users: User[] = [
    { id: "u_super", orgId: null, teamId: null, name: "Sana Qureshi", email: "super@wingrid.demo", role: "super_admin", status: "active", password: DEMO_PASSWORD, lastActiveAt: iso(now - 2 * 3600_000) },
  ];
  const teams: Team[] = [];

  const orgPlans: { org: string; domain: string; admin: string; teams: { name: string; manager: string; execs: string[] }[] }[] = [
    {
      org: "org_bright",
      domain: "brightpath.demo",
      admin: "Ravi Menon",
      teams: [
        { name: "Admissions North", manager: "Anita Desai", execs: ["Karan Malhotra", "Fatima Shaikh", "Joel Thomas"] },
        { name: "Admissions South", manager: "Suresh Pillai", execs: ["Lakshmi Rao", "Imran Ali", "Grace D'Souza"] },
      ],
    },
    {
      org: "org_north",
      domain: "northwind.demo",
      admin: "Helen Park",
      teams: [{ name: "Residential", manager: "Marcus Webb", execs: ["Chloe Adams", "Ben Ortiz", "Nadia Hassan"] }],
    },
    {
      org: "org_cobalt",
      domain: "cobalt.demo",
      admin: "Yusuf Rahman",
      teams: [{ name: "Retail Policies", manager: "Layla Haddad", execs: ["Omar Saleh"] }],
    },
  ];

  const emailFor = (name: string, domain: string) => `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@${domain}`;

  for (const plan of orgPlans) {
    users.push({ id: id("u"), orgId: plan.org, teamId: null, name: plan.admin, email: plan.org === "org_bright" ? "admin@brightpath.demo" : emailFor(plan.admin, plan.domain), role: "org_admin", status: "active", password: DEMO_PASSWORD, lastActiveAt: iso(now - int(1, 30) * 3600_000) });
    plan.teams.forEach((t, ti) => {
      const teamId = id("team");
      const managerId = id("u");
      teams.push({ id: teamId, orgId: plan.org, name: t.name, managerId });
      users.push({ id: managerId, orgId: plan.org, teamId, name: t.manager, email: plan.org === "org_bright" && ti === 0 ? "manager@brightpath.demo" : emailFor(t.manager, plan.domain), role: "manager", status: "active", password: DEMO_PASSWORD, lastActiveAt: iso(now - int(1, 48) * 3600_000) });
      t.execs.forEach((e, ei) => {
        users.push({ id: id("u"), orgId: plan.org, teamId, name: e, email: plan.org === "org_bright" && ti === 0 && ei === 0 ? "exec@brightpath.demo" : emailFor(e, plan.domain), role: "exec", status: ei === 2 && ti === 1 ? "inactive" : "active", password: DEMO_PASSWORD, lastActiveAt: iso(now - int(1, 72) * 3600_000) });
      });
    });
  }

  const settings: OrgSettings[] = organizations.map((o) => ({
    orgId: o.id,
    leadSources: [...SOURCES],
    lossReasons: ["Price too high", "Chose competitor", "No budget", "Timing", "No response"],
    rejectReasons: ["Not interested", "Invalid contact", "Duplicate", "Out of service area"],
    currency: "INR",
  }));

  const productDefs: Record<string, [string, string][]> = {
    org_bright: [
      ["Catalyst", "Flagship 12-month leadership and management program for working professionals."],
      ["IAIB", "International Applied Insurance & Banking certification with placement support."],
      ["Data Science Bootcamp", "16-week hands-on program covering Python, statistics and machine learning."],
    ],
    org_north: [
      ["Lakeview Residences", "2 and 3 BHK apartments, ready to move."],
      ["Green Acres Plots", "Gated plotted development with clubhouse."],
    ],
    org_cobalt: [["Family Health Shield", "Floater health insurance for families up to 6 members."]],
  };
  const products: Product[] = [];
  for (const o of organizations) {
    const admin = users.find((u) => u.orgId === o.id && u.role === "org_admin")!;
    const members = users.filter((u) => u.orgId === o.id && u.role !== "org_admin");
    productDefs[o.id].forEach(([name, description], i) => {
      products.push({
        id: `${o.id}_pr${i}`,
        orgId: o.id,
        name,
        description,
        memberIds: members.filter((_, j) => (j + i) % 2 === 0).map((u) => u.id),
        status: "active",
        createdBy: admin.id,
        createdAt: new Date(o.createdAt).toISOString(),
        updatedAt: new Date(o.createdAt).toISOString(),
      });
    });
  }

  const stageDefs: [string, Stage["kind"], number][] = [
    ["Prospect", "open", 10],
    ["Demo / Visit", "open", 30],
    ["Proposal", "open", 55],
    ["Negotiation", "open", 75],
    ["Won", "won", 100],
    ["Lost", "lost", 0],
  ];
  const stages: Stage[] = [];
  for (const o of organizations) {
    stageDefs.forEach(([name, kind, probability], i) => stages.push({ id: `${o.id}_st${i}`, orgId: o.id, name, order: i, kind, probability }));
  }

  const leads: Lead[] = [];
  const opportunities: Opportunity[] = [];
  const activities: Activity[] = [];
  const tasks: Task[] = [];

  const counts: Record<string, number> = { org_bright: 186, org_north: 64, org_cobalt: 22 };
  const statusWeights: [LeadStatus, number][] = [
    ["new", 0.26],
    ["contacted", 0.3],
    ["qualified", 0.16],
    ["rejected", 0.12],
    ["converted", 0.16],
  ];
  const pickStatus = () => {
    let r = rand();
    for (const [s, w] of statusWeights) {
      if ((r -= w) <= 0) return s;
    }
    return "new" as LeadStatus;
  };

  for (const org of organizations) {
    const sellers = users.filter((u) => u.orgId === org.id && (u.role === "exec" || u.role === "manager"));
    const orgStages = stages.filter((s) => s.orgId === org.id);
    const lossReasons = settings.find((s) => s.orgId === org.id)!.lossReasons;
    for (let i = 0; i < counts[org.id]; i++) {
      const first = pick(FIRST);
      const last = pick(LAST);
      const created = now - Math.pow(rand(), 1.6) * 120 * DAY;
      const status = pickStatus();
      const owner = rand() < 0.08 && status === "new" ? null : pick(sellers);
      const lead: Lead = {
        id: id("ld"),
        orgId: org.id,
        ownerId: owner?.id ?? null,
        firstName: first,
        lastName: last,
        email: `${first}.${last}${int(1, 99)}@${pick(["gmail.com", "outlook.com", "yahoo.in", "proton.me"])}`.toLowerCase(),
        phone: `+91 9${int(100000000, 999999999)}`,
        company: rand() < 0.75 ? pick(COMPANIES) : "",
        jobTitle: pick(TITLES),
        city: pick(CITIES),
        source: pick(SOURCES),
        status,
        rejectReason: status === "rejected" ? pick(settings[0].rejectReasons) : undefined,
        createdAt: iso(created),
        updatedAt: iso(Math.min(now, created + int(0, 10) * DAY)),
      };
      leads.push(lead);

      const actor = owner ?? sellers[0];
      activities.push({ id: id("ac"), orgId: org.id, userId: actor.id, leadId: lead.id, oppId: null, type: "system", subject: `Lead captured from ${lead.source}`, at: lead.createdAt });
      if (status !== "new") {
        const n = int(1, 4);
        for (let k = 0; k < n; k++) {
          const type = pick(["call", "call", "email", "meeting", "note"] as const);
          const at = Math.min(now - 3600_000, created + (k + 1) * int(1, 6) * DAY);
          activities.push({
            id: id("ac"),
            orgId: org.id,
            userId: actor.id,
            leadId: lead.id,
            oppId: null,
            type,
            subject: { call: "Outbound call", email: "Sent follow-up email", meeting: "Discovery meeting", note: "Added note" }[type],
            body: { call: "Discussed requirements and timeline.", email: "Shared brochure and pricing overview.", meeting: "Walked through options; asked for budget range.", note: "Prefers WhatsApp in the evening." }[type],
            outcome: type === "call" ? pick(["Connected", "No answer", "Call back later", "Connected"]) : undefined,
            at: iso(at),
          });
        }
      }

      if (status === "converted" || (status === "qualified" && rand() < 0.4)) {
        const openStages = orgStages.filter((s) => s.kind === "open");
        let stage: Stage;
        const r = rand();
        if (status === "converted" && r < 0.35) stage = orgStages.find((s) => s.kind === "won")!;
        else if (status === "converted" && r < 0.5) stage = orgStages.find((s) => s.kind === "lost")!;
        else stage = pick(openStages);
        const oppCreated = Math.min(now, created + int(2, 12) * DAY);
        const opp: Opportunity = {
          id: id("op"),
          orgId: org.id,
          ownerId: lead.ownerId,
          leadId: lead.id,
          name: `${lead.company || `${first} ${last}`} — ${pick(org.id === "org_north" ? ["2BHK purchase", "Villa site visit", "Rental lease", "Plot booking"] : org.id === "org_cobalt" ? ["Health cover", "Motor policy", "Term plan"] : ["MBA admission", "Undergrad program", "Certificate course", "Corporate training"])}`,
          value: int(4, 60) * 25_000,
          stageId: stage.id,
          closeDate: iso(stage.kind === "open" ? now + int(-5, 60) * DAY : oppCreated + int(5, 30) * DAY),
          outcomeReason: stage.kind === "lost" ? pick(lossReasons) : stage.kind === "won" ? "Signed" : undefined,
          createdAt: iso(oppCreated),
          updatedAt: iso(oppCreated),
        };
        opportunities.push(opp);
        activities.push({ id: id("ac"), orgId: org.id, userId: actor.id, leadId: lead.id, oppId: opp.id, type: "stage", subject: `Opportunity created in ${stage.name}`, at: opp.createdAt });
      }

      if (owner && (status === "new" || status === "contacted" || status === "qualified") && rand() < 0.7) {
        const dueOffset = int(-6, 10);
        const done = dueOffset < 0 && rand() < 0.45;
        const ttype = pick(["call", "call", "email", "meeting", "todo"] as const);
        tasks.push({
          id: id("tk"),
          orgId: org.id,
          ownerId: owner.id,
          leadId: lead.id,
          oppId: null,
          title: { call: `Call ${first} ${last}`, email: `Email brochure to ${first}`, meeting: `Meeting with ${first} ${last}`, todo: `Verify documents for ${first}` }[ttype],
          type: ttype,
          priority: pick(["low", "normal", "normal", "high"] as const),
          dueAt: iso(new Date(now + dueOffset * DAY).setHours(int(9, 18), pick([0, 30]), 0, 0)),
          completedAt: done ? iso(now + dueOffset * DAY + 3600_000) : null,
          createdAt: iso(now - int(1, 10) * DAY),
        });
      }
    }
  }

  return {
    version: DB_VERSION,
    organizations,
    teams,
    users,
    leads,
    stages,
    opportunities,
    activities,
    tasks,
    audit: [],
    savedViews: [],
    settings,
    products,
  };
}
