# ARCHITECTURE.md — HR Management System (Internal ERP)

## 0. Document Purpose

This document is the single source of truth for how the frontend is built, structured, and
extended. It reflects three decisions already locked in:

| Decision | Choice |
|---|---|
| State management | Native Angular Signals + injectable services (no NgRx/NGXS) |
| Auth strategy | JWT — access token (~1 hour, in memory) + refresh token (httpOnly, Secure cookie) |
| Module scope (v1) | Core only — Employee, Attendance, Leave, Payroll (Basics) |

Everything below is designed so that additional modules (Recruitment, Performance,
Onboarding, Assets, etc.) can be added later **without restructuring the app** — the
`features/` folder is built to scale horizontally.

---

## 1. System Context: The Thick Database Pattern

There is **no traditional business-logic backend**. Business rules, validation, and data
shaping live inside **stored procedures** in the database. The web tier is a thin gateway
that exposes exactly **two HTTP endpoints**, and Angular is responsible for orchestration,
UI state, client-side validation (UX only — never the source of truth), and presentation.

```
┌─────────────────────┐        ┌───────────────────────┐        ┌────────────────────┐
│   Angular 21 SPA     │ ──────▶│  Thin API Gateway      │ ──────▶│   RDBMS             │
│  (this repository)   │        │  2 endpoints only      │        │  Stored Procedures  │
│                       │◀────── │  /api/nonnested         │◀────── │  (business logic)   │
└─────────────────────┘        │  /api/nested            │        └────────────────────┘
                                └───────────────────────┘
```

### 1.1 The Two Endpoints

| Endpoint | Purpose | Shape returned |
|---|---|---|
| `POST /api/nonnested` | **Non-nested** — single stored proc, one (or several sibling) flat recordset(s). Used for lists, dropdowns, simple CRUD, counts. | Flat array(s) of rows |
| `POST /api/nested` | **Nested** — orchestrated/aggregated call (e.g. `FOR JSON PATH` with nested paths, or gateway-side recordset stitching) returning parent→child hierarchies in one round trip. Used for detail/360 views. | Hierarchical JSON object graph |

Both endpoints share one request envelope:

```ts
interface APIRequest<TParams = Record<string, unknown>> {
  spcKey: string;        // logical key, NEVER the raw SP name
  params: TParams;
  meta?: {
    page?: number;
    pageSize?: number;
    sort?: { field: string; direction: 'asc' | 'desc' }[];
  };
}

interface APIResponse<T> {
  success: boolean;
  data: T;
  errorCode?: string;     // maps to shared/utils/error-code-map.ts
  message?: string;
  totalCount?: number;    // for paginated non-nested calls
}
```

### 1.2 Why `spcKey` and not the SP name

The frontend **never** references a raw stored procedure name in a component or feature
service. Every call goes through a logical key defined in `core/api/spc-registry.ts`. This
gives us:

- One place to see every SP the frontend depends on (audit-friendly).
- Compile-time autocomplete/type-safety for `params` per key.
- The gateway independently validates the caller's permission for a given `spcKey` — the
  frontend registry is a **developer convenience and documentation aid**, not a security
  boundary. Security is enforced server-side, always.

```ts
// core/api/spc-registry.ts
export const SPC = {
  EMPLOYEE_LIST: 'EMP_GET_LIST',                 // non-nested
  EMPLOYEE_DETAIL_360: 'EMP_GET_DETAIL_NESTED',   // nested (personal + docs + history)
  ATTENDANCE_LOG: 'ATT_GET_LOG',                  // non-nested
  LEAVE_APPLY: 'LEAVE_APPLY_TXN',                 // non-nested (write)
  AUTH_LOGIN: 'AUTH_LOGIN_VALIDATE',              // non-nested
  AUTH_ME: 'AUTH_GET_SESSION_NESTED',             // nested (user + roles + permissions + menu flags)
} as const;

export type SpcKey = typeof SPC[keyof typeof SPC];
```

### 1.3 Client-Side Access — `APIService`

All HTTP traffic funnels through one core service. **No feature is allowed to inject
`HttpClient` directly** (enforced via ESLint rule — see AGENTS.md).

```ts
// core/api/api.service.ts
@Injectable({ providedIn: 'root' })
export class APIService {
  private http = inject(HttpClient);
  private mock = inject(MockDataLoaderService);

  callNonNested<T>(spcKey: SpcKey, params: Record<string, unknown> = {}, meta?: RequestMeta) {
    if (environment.useMockData) {
      return this.mock.loadNonNested<T>(spcKey);
    }
    return this.http.post<APIResponse<T>>('/api/nonnested', { spcKey, params, meta });
  }

  callNested<T>(spcKey: SpcKey, params: Record<string, unknown> = {}) {
    if (environment.useMockData) {
      return this.mock.loadNested<T>(spcKey);
    }
    return this.http.post<APIResponse<T>>('/api/nested', { spcKey, params });
  }
}
```

Feature services wrap these calls and expose Signals via Angular's `resource()` /
`httpResource()` APIs (see §5). Because the mock/live branch lives **inside**
`APIService`, no feature code changes at all when the real gateway comes online — only
`environment.useMockData` flips from `true` to `false`.

### 1.4 Mock Data Mode (Pre-Backend Development)

The real gateway doesn't exist yet, so `APIService` can serve fixtures from
`src/assets/data/` instead of calling the network, controlled by
`environment.useMockData` (`true` in `environment.development.ts`, flipped to `false` once
the real gateway is reachable).

- **Mirrors the live split exactly**: `src/assets/data/nonnested/<SPC_KEY>.json` and
  `src/assets/data/nested/<SPC_KEY>.json` — one file per key from `spc-registry.ts`, filed
  under whichever folder matches how that key is actually called.
- **Same envelope as the real API**: every fixture file is a complete `APIResponse<T>`
  object (`{ success, data, totalCount? }`), not a bare payload — so the day the gateway
  goes live, swapping the flag is a no-op for every component and service.
- `core/api/mock-data-loader.service.ts` (Core/Platform-owned) is the **only** thing that
  reads these files, via `HttpClient.get()` against the static asset path — this stays
  inside `core/api`, so it doesn't violate the "no direct `HttpClient`" rule in
  `AGENTS.md`.
- Populating, auditing, and correcting the fixture files themselves is the **Mock Data
  Agent's** job (see `AGENTS.md`) — it works directly on the JSON under `assets/data/`
  and never touches `api.service.ts`, `mock-data-loader.service.ts`, or makes any live
  HTTP call. This keeps "what shape does the data have" (Mock Data Agent, fast-moving,
  low-risk) cleanly separated from "how is data fetched" (Core/Platform Agent, security/
  transport-sensitive).

```ts
// core/api/mock-data-loader.service.ts
@Injectable({ providedIn: 'root' })
export class MockDataLoaderService {
  private http = inject(HttpClient);

  loadNonNested<T>(spcKey: SpcKey) {
    return this.http.get<APIResponse<T>>(`/assets/data/nonnested/${spcKey}.json`);
  }

  loadNested<T>(spcKey: SpcKey) {
    return this.http.get<APIResponse<T>>(`/assets/data/nested/${spcKey}.json`);
  }
}
```

---

## 2. Tech Stack

### 2.1 Framework & Runtime

- **Angular 21** — standalone-only (no `NgModule`), zoneless change detection
  (`provideZonelessChangeDetection()`), native control flow (`@if`, `@for`, `@switch`),
  `@defer` blocks for heavy/rarely-seen UI, the `resource()`/`httpResource()` reactive
  primitives for async data.
- **TypeScript**, strict mode on.
- **RxJS** — used for event streams, interceptors, debounced search inputs, and
  interop with `resource()` where needed. Not used as a general app-state mechanism.

### 2.2 UI

- **PrimeNG** (Aura preset, customized — see §7) — primary component library: tables,
  dialogs, forms, calendar/date-range, file upload, toasts, menu, charts (via `p-chart` /
  `chart.js`).
- **Bootstrap (CDN only, CSS only)** — loaded as a `<link>` in `index.html` for the 12-column
  grid and layout utility classes (`d-flex`, `gap-*`, `p-*`, `m-*`, breakpoints). The
  Bootstrap **JS bundle is intentionally not loaded** — all interactive widgets come from
  PrimeNG to avoid two competing component systems.
- **PrimeIcons** — icon set, supplemented by a small set of custom SVGs in
  `public/icons/` for brand-specific glyphs.

### 2.3 Data / Export

- **ExcelJS** — client-side `.xlsx` export (styled headers, frozen panes, per-column types).
- **pdfmake** — client-side PDF export (payslips, reports).

### 2.4 Supporting libraries

| Package | Why |
|---|---|
| `dayjs` | Lightweight date manipulation/formatting (Bootstrap/PrimeNG both need consistent date parsing) |
| `jwt-decode` | Decode access token client-side to read expiry/claims (never trust it for authorization — display/UX only) |
| `dompurify` | Sanitize any HTML coming from DB-stored rich text (announcements, templates) before rendering |
| `zod` | Runtime schema validation at the `APIService` boundary for critical write payloads, catching shape drift from stored procs early |
| `chart.js` | Peer dependency of PrimeNG `p-chart`, used on dashboard widgets |

### 2.5 Tooling

| Package | Why |
|---|---|
| `eslint` + `@angular-eslint/*` + `typescript-eslint` | Linting, incl. custom rule banning direct `HttpClient` injection outside `core/api` |
| `prettier` + `eslint-config-prettier` | Formatting |
| `husky` + `lint-staged` | Pre-commit gate (lint + format + affected unit tests) |
| `@commitlint/cli` + `config-conventional` | Conventional commits, enforced in AGENTS.md |
| `vitest` (Angular's native Vitest builder) | Unit tests |
| `@playwright/test` | E2E tests |
| `@compodoc/compodoc` | Generated architecture/API browsing docs (optional, CI artifact) |

---

## 3. File Naming Convention

This project adopts Angular's modern minimal naming for **components**, and keeps explicit
suffixes for everything else, for scanability in a large feature tree.

| Type | Convention | Example |
|---|---|---|
| Component | `<name>.ts` / `.html` / `.scss` (class in PascalCase, no `Component` suffix in filename) | `employee-list.ts`, class `EmployeeList` |
| Service | `<name>.service.ts` | `employee.service.ts` |
| Guard | `<name>.guard.ts` | `auth.guard.ts` |
| Interceptor | `<name>.interceptor.ts` | `error.interceptor.ts` |
| Directive | `<name>.directive.ts` | `has-permission.directive.ts` |
| Pipe | `<name>.pipe.ts` | `date-format.pipe.ts` |
| Model/Interface | `<name>.model.ts` | `employee.model.ts` |
| Routes | `<feature>.routes.ts` | `employees.routes.ts` |
| Signal store | `<name>.store.ts` | `auth.store.ts` |

---

## 4. Directory Structure

```
hr-erp-frontend/
├── .husky/
│   └── pre-commit
├── .vscode/
│   ├── extensions.json
│   └── settings.json
├── public/                                # static, served at root
│   ├── favicon.ico
│   └── logo/
│       ├── logo-full.svg
│       └── logo-mark.svg
├── e2e/                                   # Playwright specs
│   ├── auth.spec.ts
│   ├── employee-list.spec.ts
│   └── playwright.config.ts
├── src/
│   ├── index.html                         # Bootstrap CDN <link>, root <app-root>
│   ├── main.ts                            # bootstrapApplication(App, appConfig)
│   ├── styles.scss                        # global resets, theme import, PrimeNG overrides entry
│   ├── environments/
│   │   ├── environment.ts                 # prod defaults
│   │   ├── environment.development.ts
│   │   └── environment.staging.ts
│   ├── assets/
│   │   ├── data/                          # mock fixtures — mirrors the two live endpoints
│   │   │   ├── nonnested/                 # one file per non-nested spcKey
│   │   │   │   ├── EMP_GET_LIST.json
│   │   │   │   ├── ATT_GET_LOG.json
│   │   │   │   ├── AUTH_LOGIN_VALIDATE.json
│   │   │   │   └── …
│   │   │   └── nested/                    # one file per nested spcKey
│   │   │       ├── EMP_GET_DETAIL_NESTED.json
│   │   │       ├── AUTH_GET_SESSION_NESTED.json
│   │   │       └── …
│   │   ├── i18n/
│   │   │   └── en.json                    # reserved for future localization
│   │   └── images/
│   │       └── auth-illustration.svg
│   │
│   └── app/
│       ├── app.ts                         # root standalone shell component
│       ├── app.html
│       ├── app.scss
│       ├── app.config.ts                  # providers: router, http, animations, zoneless
│       ├── app.routes.ts                  # top-level routes (lazy children only)
│       │
│       ├── core/                          # singletons — instantiated once, app-wide
│       │   ├── auth/
│       │   │   ├── auth.service.ts        # login/logout/refresh orchestration
│       │   │   ├── auth.store.ts          # signals: currentUser, isAuthenticated, permissions
│       │   │   ├── auth.guard.ts          # functional CanActivateFn
│       │   │   ├── permission.guard.ts    # functional CanMatchFn — route-level RBAC
│       │   │   ├── token-refresh.interceptor.ts
│       │   │   └── models/
│       │   │       ├── user.model.ts
│       │   │       └── auth-response.model.ts
│       │   │
│       │   ├── api/
│       │   │   ├── api.service.ts     # the only HttpClient consumer for live calls
│       │   │   ├── mock-data-loader.service.ts   # dev-only: serves /assets/data/** (see §1.4)
│       │   │   ├── spc-registry.ts        # SPC keys (see §1.2)
│       │   │   ├── api-response.model.ts
│       │   │   └── error-code-map.ts      # errorCode -> user-facing message
│       │   │
│       │   ├── permissions/
│       │   │   ├── permission.service.ts  # signal-backed permission set + hasPermission()
│       │   │   └── permission.model.ts    # Role, Permission enums
│       │   │
│       │   ├── sync/                      # post-login "warm-up" screen (see §9)
│       │   │   ├── sync.ts / .html / .scss
│       │   │   ├── sync.service.ts        # runs registered tasks in parallel
│       │   │   ├── sync.store.ts          # signals: tasks[], isSynced, overallProgress
│       │   │   ├── sync.guard.ts          # canActivate on Shell — redirects to /sync if not synced
│       │   │   └── sync-task-registry.ts  # [{ id, label, run }] — friendly labels only
│       │   │
│       │   ├── state/
│       │   │   ├── app-shell.store.ts     # sidebar collapsed, active theme, breadcrumb trail
│       │   │   └── lookup-cache.service.ts# cached master data (departments, designations…)
│       │   │
│       │   ├── logging/
│       │   │   └── logger.service.ts
│       │   │
│       │   ├── interceptors/
│       │   │   ├── loading.interceptor.ts # drives global top-progress bar
│       │   │   └── error.interceptor.ts   # maps APIResponse.errorCode -> toast
│       │   │
│       │   └── config/
│       │       └── menu.ts                # MENU_ITEMS array (see §6)
│       │
│       ├── layout/                        # authenticated app chrome
│       │   ├── shell/
│       │   │   └── shell.ts / .html / .scss
│       │   ├── header/
│       │   │   └── header.ts / .html / .scss
│       │   ├── sidebar/
│       │   │   └── sidebar.ts / .html / .scss
│       │   ├── breadcrumb/
│       │   │   └── breadcrumb.ts / .html / .scss
│       │   ├── footer/
│       │   │   └── footer.ts / .html / .scss
│       │   └── auth-layout/
│       │       └── auth-layout.ts / .html / .scss   # centered card layout for /auth/*
│       │
│       ├── shared/                        # dumb/presentational, reused across features
│       │   ├── components/
│       │   │   ├── date-range-picker/
│       │   │   │   └── date-range-picker.ts / .html / .scss
│       │   │   ├── data-table/            # PrimeNG p-table wrapper: sort/filter/paginate/export hooks
│       │   │   │   └── data-table.ts / .html / .scss
│       │   │   ├── confirm-dialog/
│       │   │   ├── file-upload/
│       │   │   ├── status-badge/
│       │   │   ├── loading-skeleton/
│       │   │   ├── empty-state/
│       │   │   ├── page-header/           # title + breadcrumb + action buttons slot
│       │   │   ├── export-button/         # dropdown: Export to Excel / PDF
│       │   │   ├── stat-card/             # dashboard KPI tile
│       │   │   ├── avatar/
│       │   │   └── search-input/          # debounced search box
│       │   │
│       │   ├── directives/
│       │   │   ├── has-permission.directive.ts   # *appHasPermission="'employee:create'"
│       │   │   └── click-outside.directive.ts
│       │   │
│       │   ├── pipes/
│       │   │   ├── date-format.pipe.ts
│       │   │   ├── currency.pipe.ts
│       │   │   ├── initials.pipe.ts
│       │   │   └── file-size.pipe.ts
│       │   │
│       │   ├── validators/
│       │   │   └── custom-validators.ts   # cross-field, date-range, file-type validators
│       │   │
│       │   ├── utils/
│       │   │   ├── excel-export.util.ts   # ExcelJS wrapper — exportToExcel(columns, rows, opts)
│       │   │   ├── pdf-export.util.ts     # pdfmake wrapper — exportToPdf(docDefinition)
│       │   │   └── date-range.util.ts     # presets: Today, This Week, This Month, Last Quarter…
│       │   │
│       │   └── models/
│       │       ├── paginated-response.model.ts
│       │       └── dropdown-option.model.ts
│       │
│       ├── auth/                          # public routes
│       │   ├── auth.routes.ts
│       │   ├── pages/
│       │   │   ├── login/
│       │   │   │   └── login.ts / .html / .scss
│       │   │   └── forgot-password/
│       │   │       └── forgot-password.ts / .html / .scss
│       │   └── services/
│       │       └── password-reset.service.ts
│       │
│       └── features/                      # lazy-loaded, one folder per HR module
│           ├── dashboard/
│           │   ├── dashboard.routes.ts
│           │   ├── pages/
│           │   │   └── dashboard-home/
│           │   │       └── dashboard-home.ts / .html / .scss
│           │   ├── components/
│           │   │   ├── attendance-widget/
│           │   │   ├── leave-widget/
│           │   │   └── announcements-widget/
│           │   └── services/
│           │       └── dashboard.service.ts
│           │
│           ├── employees/
│           │   ├── employees.routes.ts
│           │   ├── pages/
│           │   │   ├── employee-list/
│           │   │   ├── employee-detail/      # consumes EMPLOYEE_DETAIL_360 (nested)
│           │   │   └── employee-form/
│           │   ├── components/
│           │   │   ├── employee-card/
│           │   │   └── employee-filter-bar/
│           │   ├── services/
│           │   │   └── employee.service.ts
│           │   └── models/
│           │       └── employee.model.ts
│           │
│           ├── attendance/
│           │   ├── attendance.routes.ts
│           │   ├── pages/
│           │   │   ├── attendance-log/
│           │   │   ├── attendance-calendar/
│           │   │   └── regularization-requests/
│           │   ├── components/
│           │   ├── services/
│           │   │   └── attendance.service.ts
│           │   └── models/
│           │       └── attendance.model.ts
│           │
│           ├── leave/
│           │   ├── leave.routes.ts
│           │   ├── pages/
│           │   │   ├── leave-apply/
│           │   │   ├── leave-history/
│           │   │   └── leave-approvals/         # manager/HR only, permission-gated
│           │   ├── components/
│           │   │   └── leave-balance-card/
│           │   ├── services/
│           │   │   └── leave.service.ts
│           │   └── models/
│           │       └── leave.model.ts
│           │
│           ├── payroll/
│           │   ├── payroll.routes.ts
│           │   ├── pages/
│           │   │   ├── payslips/
│           │   │   ├── salary-structure/
│           │   │   └── payroll-processing/      # HR/Finance only
│           │   ├── components/
│           │   ├── services/
│           │   │   └── payroll.service.ts
│           │   └── models/
│           │       └── payroll.model.ts
│           │
│           ├── profile/
│           │   ├── profile.routes.ts
│           │   ├── pages/
│           │   │   └── my-profile/
│           │   └── services/
│           │       └── profile.service.ts
│           │
│           └── admin/                          # role/permission/user administration
│               ├── admin.routes.ts
│               ├── pages/
│               │   ├── user-management/
│               │   ├── role-management/
│               │   └── system-settings/
│               ├── components/
│               └── services/
│                   └── admin.service.ts
│
├── theme/
│   ├── _variables.scss                # design tokens (§7)
│   ├── _mixins.scss
│   ├── _typography.scss
│   ├── primeng-preset.ts              # Aura preset override (blue/white)
│   └── bootstrap-overrides.scss       # scoped overrides for the utility classes we use
│
├── angular.json
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.spec.json
├── eslint.config.js
├── .prettierrc
├── vitest.config.ts
├── commitlint.config.js
├── .gitignore
├── README.md
├── ARCHITECTURE.md
└── AGENTS.md
```

---

## 5. State Management — Signals Only

No NgRx/NGXS/Akita. Standard pattern per feature:

1. **Store** (`*.store.ts`) — `signal()` for raw state, `computed()` for derived state,
   exposed as **readonly** signals; mutation methods are the only way to change state.
2. **Service** (`*.service.ts`) — talks to `APIService`, exposes data via Angular's
   `resource()`/`httpResource()` so components get `.value()`, `.isLoading()`, `.error()`
   signals for free, with built-in cancellation on param change.
3. **Component** — injects the service/store, reads signals directly in the template with
   the new control-flow syntax. No `async` pipe needed for signal-based resources.

```ts
// features/employees/services/employee.service.ts
@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private api = inject(APIService);

  filters = signal<EmployeeFilters>({ department: null, status: 'active' });

  list = httpResource<EmployeeListItem[]>(() =>
    this.api.callNonNested('EMPLOYEE_LIST' as SpcKey, this.filters())
  );
}
```

```ts
// core/auth/auth.store.ts
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private _user = signal<User | null>(null);
  private _permissions = signal<Set<string>>(new Set());

  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly permissions = this._permissions.asReadonly();

  setSession(user: User, permissions: string[]) {
    this._user.set(user);
    this._permissions.set(new Set(permissions));
  }

  clearSession() {
    this._user.set(null);
    this._permissions.set(new Set());
  }
}
```

Global, cross-cutting UI state (sidebar collapsed, active breadcrumb, current theme) lives
in `core/state/app-shell.store.ts` using the same pattern — never in a component.

---

## 6. Routing, Lazy Loading & the Menu

### 6.1 Routing

- Root `app.routes.ts` only ever declares **lazy** children via `loadChildren` (feature
  route files) or `loadComponent` (standalone pages like `login`).
- Every feature owns its own `<feature>.routes.ts`, itself lazily loaded — this keeps the
  main bundle to shell + auth only.
- `dashboard` is lazy too — it is the landing route after login but should not bloat the
  initial bundle; PrimeNG chart bits are deferred further via `@defer` inside the page.
- Route guards are **functional** (`CanActivateFn`, `CanMatchFn`), not class-based.
- A custom `PreloadSelectedModulesStrategy` preloads `dashboard` and the user's
  most-permissioned module (e.g. `employees` for HR roles) right after login, idle-preloads
  the rest.

```ts
// app.routes.ts
export const routes: Routes = [
  { path: 'auth', loadChildren: () => import('./auth/auth.routes').then(m => m.AUTH_ROUTES) },
  { path: 'sync', loadComponent: () => import('./core/sync/sync').then(m => m.Sync), canActivate: [authGuard] },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard, syncGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES),
      },
      {
        path: 'employees',
        canMatch: [permissionGuard('employee:view')],
        loadChildren: () => import('./features/employees/employees.routes').then(m => m.EMPLOYEE_ROUTES),
      },
      // attendance, leave, payroll, profile, admin — same pattern
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
```

### 6.2 `menu.ts` — Single Source for Navigation

`core/config/menu.ts` exports **every possible** menu item, statically, with the
permission/role metadata needed to filter it at runtime. It does **not** decide visibility
itself — that's `MenuService`'s job (in `core/state`), which cross-references this array
against `PermissionService`.

```ts
// core/config/menu.ts
export interface MenuItem {
  id: string;
  label: string;
  icon: string;             // PrimeIcons class
  route?: string;
  permission?: string;      // e.g. 'employee:view' — item hidden if user lacks it
  roles?: UserRole[];       // optional additional role restriction, ANDed with permission
  children?: MenuItem[];
  order: number;
}

export const MENU_ITEMS: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'pi pi-home', route: '/dashboard', order: 1 },
  {
    id: 'employees', label: 'Employees', icon: 'pi pi-users', route: '/employees',
    permission: 'employee:view', order: 2,
  },
  {
    id: 'attendance', label: 'Attendance', icon: 'pi pi-clock', order: 3,
    permission: 'attendance:view',
    children: [
      { id: 'attendance-log', label: 'Attendance Log', icon: 'pi pi-list', route: '/attendance/log', order: 1 },
      { id: 'regularization', label: 'Regularization', icon: 'pi pi-refresh', route: '/attendance/regularization',
        permission: 'attendance:approve', order: 2 },
    ],
  },
  {
    id: 'leave', label: 'Leave', icon: 'pi pi-calendar-minus', order: 4,
    permission: 'leave:view',
    children: [
      { id: 'leave-apply', label: 'Apply Leave', icon: 'pi pi-plus', route: '/leave/apply', order: 1 },
      { id: 'leave-history', label: 'My Leave History', icon: 'pi pi-history', route: '/leave/history', order: 2 },
      { id: 'leave-approvals', label: 'Approvals', icon: 'pi pi-check-square', route: '/leave/approvals',
        permission: 'leave:approve', order: 3 },
    ],
  },
  {
    id: 'payroll', label: 'Payroll', icon: 'pi pi-wallet', order: 5,
    permission: 'payroll:view',
    children: [
      { id: 'payslips', label: 'Payslips', icon: 'pi pi-file', route: '/payroll/payslips', order: 1 },
      { id: 'payroll-processing', label: 'Processing', icon: 'pi pi-cog', route: '/payroll/processing',
        permission: 'payroll:process', roles: ['HRAdmin', 'SuperAdmin'], order: 2 },
    ],
  },
  {
    id: 'admin', label: 'Administration', icon: 'pi pi-shield', order: 6,
    roles: ['SuperAdmin'],
    children: [
      { id: 'users', label: 'Users', icon: 'pi pi-user-edit', route: '/admin/users', order: 1 },
      { id: 'roles', label: 'Roles & Permissions', icon: 'pi pi-key', route: '/admin/roles', order: 2 },
    ],
  },
];
```

`MenuService.visibleMenu` is a `computed()` signal that filters `MENU_ITEMS` (recursively,
dropping empty parents) against `AuthStore.permissions()` and `AuthStore.user()?.roles`. The
sidebar component only ever renders `menuService.visibleMenu()`.

---

## 7. Theming — White & Blue, Professional

The palette is intentionally restrained: two blues, white, and a neutral gray scale for
text/borders, with muted semantic colors. No gradients, no glassmorphism, minimal motion —
this is an internal ops tool, not a marketing site.

```scss
// theme/_variables.scss
:root {
  // Brand blues
  --color-primary: #14539A;        // primary actions, active nav, links
  --color-primary-hover: #0F3F76;
  --color-primary-tint: #EAF2FB;   // selected row / hover background
  --color-primary-light: #DCE9F8;  // badges, chip backgrounds

  // Neutrals
  --color-surface: #FFFFFF;
  --color-surface-alt: #F7F9FC;    // page background
  --color-border: #E3E8EF;
  --color-text: #1F2937;
  --color-text-muted: #6B7280;

  // Semantic (muted, not neon)
  --color-success: #1E8E5A;
  --color-warning: #B7791F;
  --color-danger:  #C0362C;
  --color-info:    #2B6CB0;

  // Elevation
  --shadow-sm: 0 1px 2px rgba(16, 24, 40, 0.06);
  --shadow-md: 0 2px 8px rgba(16, 24, 40, 0.08);

  // Skeleton shimmer (LoadingSkeleton only — see §7 Motion)
  --skeleton-base: #EDF1F7;
  --skeleton-shimmer: #F9FBFD;

  // Radius & spacing scale (used across shared components)
  --radius-sm: 4px;
  --radius-md: 8px;
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px; --space-6: 24px;
}
```

- **Typography**: `Inter`, falling back to `"Segoe UI", system-ui, sans-serif` — a 14px base
  for dense tables (ERP density over marketing-site whitespace), 16px for forms.
- **PrimeNG**: the **Aura** preset is imported and overridden in `theme/primeng-preset.ts`
  via `definePreset()`, mapping PrimeNG's semantic tokens (`primary.color`,
  `surface.*`) onto the same CSS variables above, so PrimeNG and hand-rolled components stay
  visually identical.
- **Bootstrap CDN** utility classes are used purely for layout (`row`, `col-*`, `d-flex`,
  `gap-*`); `theme/bootstrap-overrides.scss` strips Bootstrap's own color/button/card
  opinions so it never fights PrimeNG visually.
- **Motion**: transitions are limited to 120–150ms ease-out on hover/focus states and
  panel expand/collapse. No page-transition animations, no parallax. The one deliberate
  exception is `LoadingSkeleton`, which uses a left-to-right shimmer sweep
  (`--skeleton-base` → `--skeleton-shimmer` → `--skeleton-base`, ~1.5s ease-in-out, looping)
  instead of a static block — it's the only continuous animation permitted anywhere in the
  app, and exists purely to signal active loading, not decoration.
- **Density**: tables use PrimeNG's `[size]="'small'"` by default; forms use standard size.

---

## 8. Authentication & Session Flow

1. `POST /api/nonnested` with `spcKey: AUTH_LOGIN` — credentials validated inside the
   stored procedure.
2. On success, the gateway returns the **access token in the JSON body** (~1 hour lifetime)
   and sets the **refresh token as an httpOnly, Secure, SameSite=Strict cookie** (never
   readable by JS — mitigates XSS token theft).
3. `AuthService` stores the access token **in memory only** (a private field / signal in
   `AuthStore`) — never in `localStorage`/`sessionStorage`.
4. A functional `authInterceptor` attaches `Authorization: Bearer <token>` to every request
   to our own API.
5. On a `401`, `token-refresh.interceptor.ts` calls a silent refresh endpoint (cookie sent
   automatically by the browser), queues concurrent failed requests, replays them once the
   new access token is in memory, and only redirects to `/auth/login` if refresh itself
   fails.
6. Immediately after login (or refresh-restore on app boot), `AUTH_ME` (nested SPC key) is
   called once to fetch `{ user, roles, permissions, menuFlags }` in a single hierarchical
   response — a good example of why the **nested** endpoint exists: one round trip instead
   of four.
7. The user is then routed to `/sync` (never straight to `/dashboard`) — see §9 — where the
   rest of the app's warm-up data is fetched before the Shell renders.
8. CSRF: since the refresh flow relies on a cookie, Angular's built-in
   `withXsrfConfiguration()` (double-submit cookie/header pattern) is enabled on
   `provideHttpClient()`.

---

## 9. Post-Login Sync Screen

Between a successful login (or a session restored on app boot) and the user ever seeing the
Shell/dashboard, the app runs a single **parallel warm-up pass** — every call the app is
about to need anyway (reference/lookup data, dashboard summary, the user's leave balance,
notification counts, etc.) — behind a dedicated `/sync` screen, so the first real page the
user lands on is already populated instead of showing five separate spinners.

### 9.1 Why this exists

- `AUTH_ME` (step 6 above) already delivered identity, roles, permissions, and menu flags —
  but feature pages still each need their own data. Firing those calls **on-demand, one page
  at a time** means the user watches loading states while clicking around right after login.
  Firing them **once, in parallel, up front** removes that.
- It also gives us one obvious place to show a friendly "getting things ready" screen instead
  of a blank shell.

### 9.2 How it works

- Route: top-level `/sync`, `canActivate: [authGuard]`, rendered **outside** the `Shell`
  layout (its own minimal centered layout, same branding treatment as `auth-layout`).
- `sync-task-registry.ts` is a flat list of warm-up tasks. Each task has a **user-facing
  label only** — the spcKey, the stored procedure name, and the endpoint path are never
  shown. Labels follow one of two fixed verbs: **"Fetching `<Name>`"** for data pulls,
  **"Loading `<Name>`"** for reference/lookup data.

```ts
// core/sync/sync-task-registry.ts
export interface SyncTask {
  id: string;
  label: string;              // "Fetching Employee Directory" — never a spcKey or SP name
  critical: boolean;          // true = failure blocks entry to the app
  run: () => Observable<unknown>;
}

export const SYNC_TASKS: SyncTask[] = [
  { id: 'lookups',       label: 'Loading Reference Data',      critical: true,  run: () => inject(LookupCacheService).warmUp() },
  { id: 'menu',          label: 'Loading Navigation',          critical: true,  run: () => inject(MenuService).warmUp() },
  { id: 'dashboard',     label: 'Fetching Dashboard Summary',  critical: false, run: () => inject(DashboardService).prefetchSummary() },
  { id: 'leave-balance', label: 'Fetching Leave Balance',      critical: false, run: () => inject(LeaveService).prefetchBalance() },
  { id: 'notifications', label: 'Loading Notifications',       critical: false, run: () => inject(NotificationService).prefetchCount() },
];
```

- `SyncService.run()` fires every task **concurrently** (`forkJoin`-style, not sequential),
  updating a per-task status signal (`pending → done | error`) in `sync.store.ts` that the
  `Sync` component renders as a checklist with a spinner/check per row plus an overall
  progress bar (using the same `LoadingSkeleton` shimmer treatment where a row is still
  pending — see §7).
- **Non-critical** task failures are logged via `LoggerService` and otherwise ignored — that
  page will simply fetch/retry its own data when visited. A **critical** task failing (e.g.
  reference data or navigation itself) sends the user back to `/auth/login` with an error
  toast, since the app genuinely can't render correctly without it.
- Once every task settles, `SyncStore.isSynced` flips to `true` and the user is routed to
  their original destination (or `/dashboard` by default).
- `sync.guard.ts` is a `canActivate` guard on the `Shell` route: if `SyncStore.isSynced()`
  is `false` — which is also true after a hard page refresh, since in-memory sync state
  (like the access token) doesn't survive a reload — it redirects to `/sync?returnUrl=...`
  rather than letting the user land mid-app with cold caches.
- Feature agents register their own module's warm-up task (if any) in
  `sync-task-registry.ts` the same way they append entries to `menu.ts` — see
  `AGENTS.md` §5.2.

---

## 10. Authorization (RBAC)

- **Roles** (coarse): `Employee`, `Manager`, `HRAdmin`, `SuperAdmin`.
- **Permissions** (fine-grained, `module:action`): e.g. `employee:view`, `employee:create`,
  `leave:approve`, `payroll:process`. Roles map to permission sets **server-side**; the
  client only ever receives the resolved flat permission list at login.
- Enforcement happens at three layers, all reading from the same `AuthStore.permissions()`:
  1. **Route level** — `permissionGuard('employee:create')` as `canMatch`.
  2. **Menu level** — `menu.ts` filtering (§6.2), so users never see links they can't use.
  3. **Template level** — `*appHasPermission="'employee:create'"` structural directive
     hides/disables buttons, columns, and form fields.
- The stored procedures **re-validate permission independently** — the frontend layers
  above are strictly UX; they are never the last line of defense.

---

## 11. Shared / Common Components

| Component | Notes |
|---|---|
| `DateRangePicker` | Wraps PrimeNG `p-datepicker` in range mode; exposes presets (Today, This Week, This Month, Last Quarter, Custom) used by Attendance, Leave, Payroll, and Dashboard filters |
| `DataTable` | Wraps `p-table`; standardizes server-side pagination/sort contract against `APIResponse.meta`, built-in `ExportButton` slot |
| `ExportButton` | Dropdown: "Export to Excel" / "Export to PDF", delegates to `excel-export.util.ts` / `pdf-export.util.ts` |
| `ConfirmDialog` | Wraps PrimeNG `ConfirmDialog`/`ConfirmationService` with standardized copy for delete/approve/reject actions |
| `FileUpload` | Wraps `p-fileupload`, enforces size/type via `custom-validators.ts` |
| `StatusBadge` | Renders leave/attendance/payroll status enums with consistent color mapping |
| `PageHeader` | Title + breadcrumb + right-aligned action slot, used at the top of every feature page |
| `StatCard` | Dashboard KPI tile (label, value, trend icon) |
| `LoadingSkeleton` | Table/card skeleton shown while a `resource()` `.isLoading()`; uses the shimmer sweep defined in §7 (Motion), not a static block |
| `EmptyState` | Shown when a list resource resolves to zero rows |
| `SearchInput` | Debounced (300ms) search box wired to a filter signal |

All shared components are **standalone, `OnPush` (or fully signal-driven under zoneless),
and presentational** — they receive inputs/signals and emit outputs; they never call
`APIService` directly.

---

## 12. Export Architecture (Excel / PDF)

- `shared/utils/excel-export.util.ts` wraps **ExcelJS**: takes a typed column definition +
  row data, applies header styling (brand blue header row, white text, frozen header),
  auto-widths columns, and triggers a client-side download — no server round trip needed
  since the data is already in memory from the `DataTable`.
- `shared/utils/pdf-export.util.ts` wraps **pdfmake**: used for structured documents with
  fixed layouts (payslips, offer-letter-style outputs), with a shared brand header/footer
  partial (`theme` colors, company logo from `public/logo/`) reused across every generated
  PDF.
- Both utilities are pure functions — no Angular DI needed — so they're trivially unit
  testable.

---

## 13. Cross-Cutting Concerns

- **Loading UX**: `loading.interceptor.ts` increments/decrements a `loadingCount` signal in
  `app-shell.store.ts`; the shell renders a slim top progress bar bound to it. Calls that
  shouldn't trigger the global bar (e.g. background polling) opt out via an `HttpContext`
  token.
- **Error handling**: `error.interceptor.ts` inspects `APIResponse.errorCode` and maps it
  through `error-code-map.ts` to a PrimeNG Toast message; unmapped/unexpected errors show a
  generic "Something went wrong" toast and are sent to `LoggerService`.
- **Logging**: `LoggerService` wraps `console.*` in dev and can be pointed at a remote sink
  in staging/prod via `environment.ts` without touching call sites.
- **Environment config**: `environment.ts` / `.development.ts` / `.staging.ts` hold API base
  path, the `useMockData` flag (see §1.4), other feature flags, and build-time constants
  only — no secrets (there are none to hold; auth is cookie/token based).

---

## 14. Performance

- Zoneless change detection by default.
- Every feature route lazy-loaded; `dashboard` charts and rarely-opened panels (e.g. admin
  settings tabs) wrapped in `@defer (on viewport)`.
- `DataTable` uses PrimeNG virtual scrolling for any list realistically expected to exceed
  ~500 rows (e.g. full employee directory, attendance logs).
- `lookup-cache.service.ts` caches slow-changing master data (departments, designations,
  leave types) for the session to avoid redundant non-nested calls.
- Images/logo served as SVG; no raster brand assets.

---

## 15. Accessibility

- PrimeNG components ship with ARIA support out of the box; custom shared components follow
  the same standard (labelled inputs, `aria-live` on toasts, focus trapping in dialogs).
- Color contrast: primary blue (`#14539A`) on white and white-on-primary both meet WCAG AA
  for normal text; status badge tints are chosen to keep text ≥ 4.5:1 contrast.
- All interactive elements are reachable and operable via keyboard; `DataTable` supports
  arrow-key row navigation.

---

## 16. Testing Strategy

- **Unit** (Vitest): every shared component, pipe, directive, and utility function; feature
  services tested with `APIService` mocked at the HTTP layer.
- **E2E** (Playwright): critical flows — login, apply leave, approve leave, export employee
  list, permission-based menu visibility per role.
- Coverage gate enforced in CI (see AGENTS.md for per-agent responsibility).

---

## 17. Build & Environments

- Angular's esbuild-based application builder, three configurations: `development`,
  `staging`, `production`.
- `angular.json` budgets are set per-route-chunk to catch feature bundles silently growing.
- CI pipeline (outside this repo's direct concern, referenced here for completeness): lint →
  unit tests → build (all 3 configs) → Playwright smoke suite → artifact upload.

---

## 18. Assumptions Made

- The thin API gateway itself (`/api/nonnested`, `/api/nested`) is out of scope for this
  repository; this document assumes it exists, validates permissions per `spcKey`, and
  issues/refreshes JWTs with a ~1 hour access-token lifetime.
- The gateway is not live yet: `environment.useMockData` is `true` for local development,
  and every read goes to a static fixture under `src/assets/data/` (see §1.4) instead of the
  network. This is expected to flip to `false` once the gateway ships — no feature code
  should change when it does.
- Single-tenant, single-locale (English) for v1; `assets/i18n/` scaffolding exists for
  future localization but is not wired to `@ngx-translate` yet.
- Module scope for v1 is Employee, Attendance, Leave, and Payroll (basics) per current
  decision; `features/` is structured so Recruitment, Performance, Onboarding, Assets, etc.
  can be added as sibling folders without touching existing modules.
