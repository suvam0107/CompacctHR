# AGENTS.md — HR Management System (Internal ERP)

This file governs how any agent (AI coding agent or human contributor operating in an
agent-like workflow) works in this repository. It complements `ARCHITECTURE.md`, which
explains *what* the system is; this file explains *who* touches which part of it and
*how*. Read `ARCHITECTURE.md` first — this document assumes it.

If an instruction here conflicts with a request in a conversation, the more restrictive
one wins unless a human maintainer explicitly overrides it.

---

## 1. Ground Rules (apply to every agent, no exceptions)

1. **Stack lock**: Angular 21, RxJS, PrimeNG, Bootstrap (CDN, CSS-only), ExcelJS, pdfmake,
   dayjs, jwt-decode, dompurify, zod, chart.js. Do not add a new UI kit, state library
   (NgRx/NGXS/Akita), CSS framework, or HTTP client. If a task seems to need one, stop and
   flag it to a maintainer instead of installing it.
2. **No direct `HttpClient`**: only `core/api/api.service.ts` may inject `HttpClient`.
   Every other service reaches the API exclusively through `APIService.callNonNested()`
   / `callNested()`.
3. **No raw SP names in feature code**: every stored-procedure call goes through a key
   defined in `core/api/spc-registry.ts`. Adding a new call means adding a key there first.
4. **No token storage in `localStorage`/`sessionStorage`**: access token lives in memory
   (`AuthStore`) only; refresh token is an httpOnly cookie the frontend never reads.
5. **No bypassing permission checks**: any new route, menu entry, or destructive action
   must be guarded per §10 of `ARCHITECTURE.md` (route guard + menu metadata +
   `*appHasPermission`), even if it "isn't reachable yet" — assume it will be found.
6. **Follow file naming conventions** in `ARCHITECTURE.md` §3. Don't mix conventions within
   the same folder.
7. **Follow the theme tokens** in `theme/_variables.scss` — no hardcoded hex colors in
   component styles. If a needed color doesn't exist as a token, add it to `_variables.scss`
   first (and justify it in the PR description), don't inline it. The **canonical design
   authority** is the Stitch project "Enterprise Modern" (ID `13407989877844294520`); any
   visual decision not covered below should be traced back to that spec.
8. **Standalone only, zoneless-safe**: no `NgModule`, no reliance on Zone.js-triggered
   change detection (use signals/`resource()`, not manual subscriptions that mutate state
   without a signal write).
9. **Every non-trivial change ships with tests** (unit for logic/components, e2e for new
   user-facing flows) — see §7.
10. **Conventional commits**: `feat(employees): add bulk export to employee list`,
    `fix(auth): correct refresh-token race condition`, `docs(architecture): …`. Scope =
    the top-level folder touched (`employees`, `attendance`, `leave`, `payroll`, `auth`,
    `core`, `shared`, `layout`, `theme`, `mock-data`, `notifications`).
11. **Mock data stays mock data**: while `environment.useMockData` is on, fixtures under
    `src/assets/data/` are the only source of truth for local development — never hardcode
    sample data inline in a component/service to "get something on screen" instead of
    adding/using a proper fixture (see `ARCHITECTURE.md` §1.4).
12. **Never surface a spcKey, SP name, or raw endpoint path in user-facing UI text** —
    this applies everywhere, including labels and table headers, which must
    read as plain English (`"Fetching Employees"`, `"Loading Reference Data"`), never the
    underlying key (`EMP_GET_LIST`) or endpoint (`/api/nonnested`).
13. **Form validation feedback**: Every reactive form MUST highlight unfilled/invalid controls (`.ng-invalid.ng-touched`, `[invalid]`) upon submission attempt (`form.markAllAsTouched()`), rendering explicit inline error messages under each invalid control.
14. **Header Subtitles**: Page headers (`PageHeader`) display clean single-line page titles only; subtitles are omitted across all pages.

---

## 2. Agent Roster

Each agent below owns a slice of the codebase. "Owns" means: makes changes there directly.
"May touch with review" means: can propose a change but a maintainer (or the owning agent,
if operating as a named session) should review before merge, because the blast radius is
wider than one feature.

### 2.1 Feature Module Agent

- **Owns**: `src/app/features/<module>/**` for one module at a time (e.g. Employee Agent,
  Attendance Agent, Leave Agent, Payroll Agent, Notifications Agent) plus that module's `<module>.routes.ts`.
- **May touch with review**: `core/config/menu.ts` (adding its own module's entries only),
  `core/api/spc-registry.ts` (adding its own module's keys only).
- **Must not touch**: `core/auth/**`, `core/api/api.service.ts`, `theme/**`,
  `layout/**`, another module's `features/<other-module>/**`.
- **Responsibilities**:
  - Build pages/components/services inside its module folder following the
    `pages/ components/ services/ models/` sub-structure from `ARCHITECTURE.md` §4.
  - Use `shared/components` for anything generic (tables, date range, dialogs) instead of
    reinventing them locally.
  - Every new list view uses `DataTable` + server-side/mock-query pagination via `meta`, not
    client-side slicing of a full dataset.
  - Every destructive/approval action goes through `ConfirmDialog` or modal, triggers a PrimeNG `MessageService` toast notification, updates local/store state reactively, and is permission-gated.
  - Keep feature services thin: fetch via `APIService`, expose via `resource()`, no
    business logic that belongs in the stored procedure.

### 2.2 Shared Component Agent

- **Owns**: `src/app/shared/**` (components, directives, pipes, validators, utils, models).
- **Responsibilities**:
  - Every component here must be usable by ≥2 features (if it's only used once, it belongs
    in that feature's `components/`, not here).
  - Strictly presentational: inputs/outputs/signals in, no `APIService` calls.
  - New shared components ship with a short usage example in the component's doc comment
    and a unit test covering inputs/outputs.
  - Owns `ExportButton` and the `excel-export.util.ts` / `pdf-export.util.ts` contract —
    feature agents consume these, they don't fork them.

### 2.3 Core/Platform Agent

- **Owns**: `src/app/core/**` (auth, api, permissions, state, logging, interceptors,
  `menu.ts` structure/interface itself — not its content, which features append to),
  `mock-data-loader.service.ts`, `app.config.ts`, `app.routes.ts`, layout shell & dynamic route title/breadcrumb listener.
- **Highest scrutiny module** — touches auth, tokens, dynamic page routing, and the SPC transport layer.
- **Responsibilities**:
  - Any change to `api.service.ts`, `mock-data-loader.service.ts`, interceptors, or
    guards requires an explicit written rationale in the PR description and a
    security-focused self-review checklist (token handling, CSRF, permission enforcement)
    before merge.
  - Owns the shape of `APIRequest`/`APIResponse` — changing it is a breaking change for
    every feature agent and must be announced, not silently done.
  - Owns `error-code-map.ts` — feature agents request new entries, this agent adds them.
  - Listens to route navigation events (`NavigationEnd`) to update top app header titles & breadcrumb trails dynamically.

### 2.4 Theming/UI Agent

- **Owns**: `theme/**`, `styles.scss`, `public/logo/**`, the Bootstrap-CDN `<link>` and
  overrides, the PrimeNG preset (`primeng-preset.ts`).
- **Canonical design reference**: Stitch project **"CompacctHR UI Modernization"**
  ("Enterprise Modern" design system, ID `13407989877844294520`). Any visual question
  not resolved by the token list below should be settled by reference to that project.
- **Responsibilities**:
  - Maintains the **Sapphire Blue / white** palette and typography scale; rejects/redirects
    any PR that introduces off-palette colors, heavy motion, or a second icon/font system.
  - Keeps PrimeNG's semantic tokens and this project's CSS variables in sync so both
    component systems render identically.
  - **Approved elevation levels** (3-tier, per Stitch spec):
    - Level 0 — page canvas: `--color-surface-alt` (#F7F9FB), no shadow.
    - Level 1 — cards/content: `--shadow-sm` (`0 1px 3px rgba(15,82,186,0.08)`).
    - Level 2 — dropdowns/popovers: `--shadow-md` (`0 4px 16px rgba(15,82,186,0.12)`).
    - Level 3 — modals/dialogs only: `--shadow-lg` (`0 8px 32px rgba(15,82,186,0.16)`).
  - **Approved additional tokens** (beyond the original base set):
    - `--color-secondary: #206393` — supporting UI elements, secondary buttons, data viz.
    - `--color-primary-container: #D9E2FF` — container/highlight backgrounds.
    - `--radius-lg: 12px` — large dashboard panels and main content cards.
    - `--radius-full: 9999px` — pill-shaped status badges and avatar chips.
    - `--sidebar-width: 260px` — canonical fixed sidebar layout token.
    - `--shadow-lg` — **modal/dialog layer only**, not a general decoration elevation.
    - Full typography scale (`--fs-*`, `--lh-*`, `--fw-*`, `--ls-*`) — see `_variables.scss`.
  - Professionalism check: no gradients, no shadows beyond `--shadow-lg` (modal layer
    only), no animation beyond the 120–150ms hover/focus transitions and the
    `LoadingSkeleton` shimmer sweep defined in `ARCHITECTURE.md` §7 — that shimmer is the
    one intentional exception and should not be used as precedent to add motion elsewhere.

### 2.5 Permissions/RBAC Agent

- **Owns**: `core/permissions/**`, the *content* of `core/config/menu.ts` (structure is
  Core/Platform Agent's), `has-permission.directive.ts`.
- **Responsibilities**:
  - Maintains the canonical list of `Role` and `Permission` values in
    `permission.model.ts` — this is the contract feature agents write `permission:` strings
    against; typos here silently break menu/route/template gating, so changes need a
    grep-for-usages pass before renaming any permission key.
  - Reviews every PR that adds a new route or menu entry for correct guard + permission
    wiring (route guard, menu metadata, template directive — all three, not just one).

### 2.6 Data/Export Agent

- **Owns**: `shared/utils/excel-export.util.ts`, `shared/utils/pdf-export.util.ts`, the PDF
  brand header/footer partial.
- **Responsibilities**: keeps export output visually consistent (brand header, column
  styling) across every feature that exports; performance-conscious for large exports
  (streaming/chunked ExcelJS writes rather than building one giant in-memory workbook when
  row counts get large).

### 2.7 Testing/QA Agent

- **Owns**: `e2e/**`, `vitest.config.ts`, coverage configuration.
- **Responsibilities**:
  - Maintains the Playwright smoke suite covering: login, role-based menu visibility,
    apply/approve leave, export a list to Excel and to PDF.
  - Enforces the coverage gate in CI; when a Feature Module Agent's PR drops coverage,
    this agent (or the CI check standing in for it) blocks merge until tests are added —
    not deleted thresholds.
  - Owns shared test utilities/mocks (e.g. a mock `APIService` fixture) so every feature
    agent tests against the same fake transport instead of hand-rolling one per module.

### 2.8 Documentation Agent

- **Owns**: `README.md`, `ARCHITECTURE.md`, `AGENTS.md`, module-level `README.md` files
  (if a feature grows complex enough to warrant one).
- **Responsibilities**: whenever another agent's change alters something described in
  `ARCHITECTURE.md` (a new SPC endpoint pattern, a new shared component category, a change
  to the auth flow, a new top-level module), the Documentation Agent updates the doc in the
  same PR — architecture drift between code and doc is treated as a bug.

### 2.9 Mock Data Agent

- **Owns**: `src/assets/data/nonnested/**` and `src/assets/data/nested/**` only — the
  fixture JSON files themselves. Nothing else.
- **Must not touch**: `core/api/api.service.ts`, `core/api/mock-data-loader.service.ts`,
  or any live HTTP call of any kind — this agent works **entirely offline**, directly on
  static files, never through the API layer (per `ARCHITECTURE.md` §1.4). It does not run
  the app to "fetch and save" data; it authors fixtures by hand against the expected shape.
- **Responsibilities**:
  - For every key in `core/api/spc-registry.ts`, ensure exactly one matching fixture file
    exists in the correct folder — `nonnested/<KEY>.json` for keys called via
    `callNonNested()`, `nested/<KEY>.json` for keys called via `callNested()`. A key in the
    wrong folder is treated as a bug, since it would silently 404 once wired up.
  - Every fixture is a **complete `APIResponse<T>` envelope** (`{ success, data,
    totalCount? }`), matching exactly what the live endpoint is expected to return — not
    just the bare payload. Nested fixtures contain genuinely nested `data` (parent object
    with child arrays), never a flattened stand-in.
  - **Audits** fixtures whenever a Feature Module Agent changes what a spcKey's response is
    expected to look like (new field, renamed field, new nested relation) — stale fixtures
    that silently drift from the real contract are this agent's responsibility to catch.
  - Keeps fixture data realistic and internally consistent (e.g. an employee's
    `departmentId` in `EMP_GET_LIST.json` should resolve against the same IDs used in the
    department lookup fixture) so the UI doesn't look broken while running on mock data.
  - Where a `zod` schema exists for a given response shape, validates fixtures against it
    before committing.
  - When a Feature Module Agent needs a spcKey that doesn't have a decided shape yet, flags
    it back to that agent rather than inventing a shape unilaterally.

---

## 3. Directory Ownership Matrix

| Path | Owning agent | Others may touch? |
|---|---|---|
| `src/app/core/auth/**`, `core/api/**` | Core/Platform | No — review only |
| `src/app/core/permissions/**` | Permissions/RBAC | No — review only |
| `src/app/core/config/menu.ts` (structure) | Core/Platform | Feature agents append entries |
| `src/app/core/sync/**` (structure) | Core/Platform | Feature agents append `sync-task-registry.ts` entries |
| `src/app/core/state/**`, `core/logging/**`, `core/interceptors/**` | Core/Platform | No |
| `src/app/layout/**` | Core/Platform (chrome) + Theming/UI (styling) | No |
| `src/app/shared/**` | Shared Component | No — request additions |
| `src/app/auth/**` (login/forgot-password pages) | Core/Platform | Theming/UI for styling only |
| `src/app/features/<module>/**` | That module's Feature Agent | No cross-module edits |
| `theme/**`, `styles.scss` | Theming/UI | No |
| `shared/utils/excel-export.util.ts`, `pdf-export.util.ts` | Data/Export | No |
| `src/assets/data/nonnested/**`, `src/assets/data/nested/**` | Mock Data | No — request additions |
| `e2e/**`, `vitest.config.ts` | Testing/QA | Feature agents add their own spec files |
| `*.md` docs | Documentation | Everyone must update relevant sections when their change affects them |

---

## 4. Standard Workflow (every agent, every task)

1. **Read** the relevant section(s) of `ARCHITECTURE.md` and this file before writing code.
2. **Check `spc-registry.ts`** — does the key you need already exist? If not, add it (with
   a comment noting whether it's nested/non-nested and its params shape) before wiring the
   feature.
3. **Implement** inside your owned directory only. If the task requires touching another
   agent's directory, either hand off or clearly flag the cross-boundary change for review.
4. **Style with tokens**, not literals — pull from `theme/_variables.scss`.
5. **Gate access** — route guard + menu metadata + template directive, for anything new
   that isn't universally visible.
6. **Write tests** — unit for the logic/component, e2e if it's a new user-facing flow.
7. **Run**: `npm run lint`, `npm run test`, `npm run build` (or the affected-scope
   equivalents) before considering the task done.
8. **Update docs** if the change alters anything `ARCHITECTURE.md`/`AGENTS.md` describes.
9. **Commit** using the conventional-commit format from §1.10.

---

## 5. Runbooks

### 5.1 Adding a new SPC key

1. Add the key to `core/api/spc-registry.ts` under the `SPC` const, named
   `<MODULE>_<ACTION>[_NESTED]`.
2. Note in a comment: endpoint (`/api/nonnested` vs `/api/nested`), expected `params`
   shape, and expected response shape.
3. Request (or, if acting as the Mock Data Agent, create) the matching fixture at
   `assets/data/nonnested/<KEY>.json` or `assets/data/nested/<KEY>.json`, wrapped in the
   full `APIResponse<T>` envelope — the gateway isn't live yet, so this fixture *is* the
   data source until it is (see `ARCHITECTURE.md` §1.4).
4. Wire it in the owning feature's service via `APIService`, exposed through
   `resource()`/`httpResource()`.
5. If the response shape is a write/critical payload, add a `zod` schema to validate it at
   the service boundary.

### 5.2 Adding a new feature module (e.g. Recruitment)

1. Create `features/recruitment/` mirroring the standard sub-structure (`pages/`,
   `components/`, `services/`, `models/`, `<module>.routes.ts`).
2. Register it as a lazy child in `app.routes.ts` with a `canMatch: [permissionGuard(...)]`.
3. Define its permissions in `permission.model.ts` (Permissions/RBAC Agent territory —
   request via review if you're a Feature Agent).
4. Add its menu entries to `menu.ts` with correct `permission`/`roles` metadata.
5. Add its SPC keys per §5.1 (including matching mock fixtures).
6. If the module has data worth pre-fetching on login (e.g. a summary widget or balance
   shown on the dashboard), add a task to `sync-task-registry.ts` with a plain-English
   label per §1.12 — otherwise skip this step, not every module needs one.
7. Add an e2e smoke test for its primary happy path.
8. Update `ARCHITECTURE.md` §4 directory tree and §18 assumptions.

### 5.3 Adding a new shared component

1. Confirm it's used (or clearly will be used) by 2+ features — otherwise it belongs in
   one feature's local `components/`.
2. Build it standalone, signal-driven, presentational (no `APIService`).
3. Add a unit test and a one-paragraph usage note as a doc comment at the top of the file.
4. Add it to the shared component table in `ARCHITECTURE.md` §11.

---

## 6. Non-Negotiables (will be rejected on review regardless of framing)

- Hardcoded stored-procedure names outside `spc-registry.ts`.
- `HttpClient` injected anywhere outside `api.service.ts` and `mock-data-loader.service.ts`.
- Tokens in `localStorage`/`sessionStorage`.
- New routes/menu items without permission gating.
- Off-palette colors, new fonts/icon sets, or animation beyond the hover/focus transitions
  and the `LoadingSkeleton` shimmer.
- Shadows beyond `--shadow-lg` (which is permitted for the modal/dialog layer only).
  Using `--shadow-lg` outside of `.p-dialog` / overlay contexts requires Theming/UI Agent
  review.
- Hardcoded hex colors that duplicate a token already defined in `_variables.scss` —
  always use the token.
- New state-management libraries.
- Skipped or deleted tests to make CI pass.
- Undocumented breaking changes to `APIRequest`/`APIResponse` or the permission model.
- A mock fixture in the wrong folder (`nested/` vs `nonnested/`) or missing the
  `APIResponse<T>` envelope.
- A `sync-task-registry.ts` label (or any other user-facing string) that reveals a spcKey,
  SP name, or raw endpoint path.

---

## 7. Definition of Done

- [ ] Code lives in the correct owning directory per §3.
- [ ] No ground-rule violations from §1 / §6.
- [ ] Route, menu, and template permission gating all present (if applicable).
- [ ] Uses `shared/` components where a suitable one exists.
- [ ] Theme tokens used, no inline hex colors.
- [ ] Unit tests added/updated; e2e added for new user flows.
- [ ] If a new spcKey was added, a matching mock fixture exists in the correct
      `assets/data/nonnested/` or `assets/data/nested/` folder.
- [ ] `lint`, `test`, and `build` pass locally.
- [ ] `ARCHITECTURE.md`/`AGENTS.md` updated if the change affects what they describe.
- [ ] Conventional commit message(s).
