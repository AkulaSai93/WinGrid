# WinGrid CRM

A multi-organization Sales CRM front end built from the *CRM Product Blueprint* and *Executive Summary*. Next.js 16 (App Router) + Tailwind CSS v4, light blue theme.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
```

Open **/login** and pick a demo account (password `demo1234`):

| Role | Email | Sees |
| --- | --- | --- |
| Organization Admin | admin@brightpath.demo | Whole org, settings, users, audit |
| Sales Manager | manager@brightpath.demo | Own team's records, assignment, team analytics |
| Sales Executive | exec@brightpath.demo | Own leads, deals and tasks only |
| Super Admin | super@wingrid.demo | All organizations; enters a workspace deliberately (audited) |

## What's built

- **Landing**: hero, features, how it works, FAQ, footer. **Auth**: login with field validation and neutral errors, password reset with OTP step.
- **Dashboard** (role-aware): KPIs, today's overdue/due tasks, leads needing first contact, lead funnel, pipeline by stage, team task summary with drill-down links.
- **Leads**: search, status/source/owner filters, built-in and saved (shareable) views, sortable columns, column chooser with reorder, bulk assign/status/export/delete, pagination, CSV export.
- **CSV import**: upload → column mapping → row-level validation and duplicate preview → import → created/skipped counts with a downloadable error report.
- **Lead detail**: status path, contact details, owner reassignment, timeline, log call/email/meeting/note with optional follow-up, tasks, convert to opportunity (keeps source and history), reject with reason.
- **Opportunities**: kanban with drag-and-drop (plus a stage menu for keyboard/touch), list view, weighted pipeline, win/loss reason required on close, detail drawer with history.
- **Tasks & Activities**: open/overdue/today/upcoming/completed views, owner and type filters, activity log.
- **Accounts**: companies grouped from leads, with contacts and deal value.
- **Analytics**: date range and team filters, conversion funnel, leads by source, weekly volume, pipeline health, loss reasons, team performance.
- **Users & Teams**: invite, change role/team, deactivate/reactivate, teams, permission matrix.
- **Settings**: org profile, pipeline stages (rename, reorder, probability, won/lost), lead sources, reject and loss reasons.
- **Integrations & Sync**: lists what must be decided before each integration is built. Nothing is falsely shown as connected.
- **Audit log**, **Super Admin** (org list, suspend/reactivate, enter workspace).
- Loading, empty, no-results, error and permission-denied states; keyboard focus rings, labelled icon buttons with tooltips, confirmations on destructive actions, toasts.

## Architecture notes

- `src/lib/store.tsx`: client store persisted to `localStorage`. Every mutation is scoped to the active organization and writes audit/activity entries. **Use "Reset demo data" in the user menu** to restore the seed.
- `src/lib/permissions.ts`: action permissions are separate from record scope (own / team / organization / platform), as the blueprint requires.
- `src/lib/seed.ts`: deterministic demo data (3 orgs, 17 users, ~270 leads). The UI labels it **Demo data**.

## Assumptions and open questions

This is a front-end prototype. Before production:

1. **No backend yet.** Tenant isolation and permissions are enforced in the client only. They must be re-implemented server-side (API + DB `org_id` scoping) and covered by tests.
2. Passwords are plaintext demo values, and the OTP is shown on screen. Real auth (hashed passwords, MFA, sessions) is still to be built.
3. Lead statuses (New → Contacted → Qualified → Converted / Rejected) and pipeline stages are placeholders. Confirm the real stages for your domain (general sales vs. admissions).
4. Two-way DB sync is intentionally not built. It needs a source system, field ownership, direction, conflict, duplicate and deletion rules.
5. Product name ("WinGrid"), logo and INR currency are assumptions.
