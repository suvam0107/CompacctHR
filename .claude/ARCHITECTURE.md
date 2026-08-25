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
| `zod` | Client-side form validation (`shared/validators/schemas/`) via `zodFormValidator` bridge and API write payload validation, ensuring strict contract enforcement against DB schemas |
[diff_block_end]
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

## 7. Theming — Sapphire Blue & White, Enterprise Modern

The palette follows the **"Enterprise Modern"** design philosophy from the Stitch design
system (project ID `13407989877844294520`): Sapphire Blue primary, clean white surfaces,
blue-tinted shadows, and a full typography scale — clarity, efficiency, and trust for HR
workflows. No gradients, no glassmorphism.

```scss
// theme/_variables.scss  (canonical token reference)
:root {
  // Brand Blues
  --color-primary:            #0F52BA;  // Sapphire Blue — primary actions, active nav
  --color-primary-hover:      #003C90;  // Deep Navy — hover
  --color-primary-active:     #001945;  // pressed state
  --color-primary-tint:       #D9E2FF;  // selected row / highlight background
  --color-primary-light:      #B0C6FF;  // badge backgrounds
  --color-primary-container:  #D9E2FF;  // container/chip backgrounds

  // Secondary (Steel Blue — supporting UI)
  --color-secondary:          #206393;
  --color-secondary-hover:    #004A75;

  // Neutrals
  --color-surface:            #FFFFFF;  // card/content (Level 1)
  --color-surface-alt:        #F7F9FB;  // page canvas (Level 0)
  --color-border:             #C3C6D5;  // outline-variant
  --color-border-subtle:      #E0E3E5;  // dividers/separators
  --color-text:               #191C1E;  // on-surface
  --color-text-muted:         #434653;  // on-surface-variant

  // Semantic
  --color-success:    #10B981;
  --color-warning:    #B7791F;
  --color-danger:     #BA1A1A;

  // Elevation (blue-tinted shadows — 3 levels)
  --shadow-sm:  0 1px 3px rgba(15, 82, 186, 0.08);  // Level 1 — cards
  --shadow-md:  0 4px 16px rgba(15, 82, 186, 0.12); // Level 2 — dropdowns/popovers
  --shadow-lg:  0 8px 32px rgba(15, 82, 186, 0.16); // Level 3 — modals/dialogs ONLY

  // Border Radius
  --radius-sm:   4px;     // inputs, tight chips
  --radius-md:   8px;     // buttons, inputs, small cards
  --radius-lg:   12px;    // large panels, dashboard widgets
  --radius-full: 9999px;  // pill badges, avatars

  // Layout
  --sidebar-width:          260px;
  --sidebar-collapsed-width: 68px;
  --header-height:           60px;

  // Typography scale (Plus Jakarta Sans)
  --fs-display:     36px;  --lh-display:     44px;  // --fw-display: 700, --ls-display: -0.02em
  --fs-headline-lg: 28px;  --lh-headline-lg: 36px;
  --fs-headline-md: 24px;  --lh-headline-md: 32px;
  --fs-headline-sm: 20px;  --lh-headline-sm: 28px;
  --fs-h4:          16px;  --lh-h4:          24px;  // fixed header sizes
  --fs-h5:          14px;  --lh-h5:          20px;
  --fs-h6:          13px;  --lh-h6:          18px;
  --fs-body-lg:     17px;  --lh-body-lg:     25px;  // forms / content pages (slightly increased)
  --fs-body-md:     15px;  --lh-body-md:     22px;  // default ERP density (slightly increased)
  --fs-label-md:    14px;  --lh-label-md:    20px;  // --ls-label-md: 0.01em
  --fs-label-sm:    13px;  --lh-label-sm:    18px;  // table headers: uppercase, --ls-label-sm: 0.05em
}
```

**Elevation model (3 tiers)**:

| Level | Usage | Token |
|---|---|---|
| 0 — Canvas | Page background | `--color-surface-alt` (no shadow) |
| 1 — Content | Cards, stat-cards, panels | `--shadow-sm` (blue-tinted) |
| 2 — Floating | Dropdowns, tooltips | `--shadow-md` |
| 3 — Overlay | **Dialogs/modals only** | `--shadow-lg` |

- **Typography**: `Plus Jakarta Sans` (300–800 weights), 15px ERP density base; 17px for form/content
  pages. Utility classes `.text-display` → `.text-label-sm` in `_typography.scss` map
  the scale. Table headers use `label-sm` (13px, 600w, uppercase, 0.05em spacing).
- **PrimeNG**: the **Aura** preset is overridden in `theme/primeng-preset.ts` via
  `definePreset()` mapping primary `#0F52BA` and a 9-stop surface scale matching the
  Stitch palette, so PrimeNG and hand-rolled components render identically.
- **Bootstrap CDN** utility classes are used purely for layout (`row`, `col-*`, `d-flex`,
  `gap-*`); `theme/bootstrap-overrides.scss` overrides Bootstrap cards/table/button
  opinions and adds `.card-lg`, `.status-badge`, and button press-in using the mixin
  system in `_mixins.scss`.
- **Mixins** (`theme/_mixins.scss`): `card-base`, `card-large`, `input-focus-ring`,
  `badge-pill` — use these instead of writing raw CSS for those patterns.
- **Sidebar active state**: 4px vertical Sapphire Blue bar on the left edge of the active
  `nav-link` via CSS `::before` pseudo-element (see `layout/sidebar/sidebar.scss`).
- **Motion**: transitions are limited to 120–150ms ease-out on hover/focus states and
  panel expand/collapse. No page-transition animations, no parallax. The one deliberate
  exception is `LoadingSkeleton`, which uses a left-to-right shimmer sweep
  (`--skeleton-base` → `--skeleton-shimmer` → `--skeleton-base`, ~1.5s ease-in-out,
  looping) instead of a static block — it's the only continuous animation permitted
  anywhere in the app, and exists purely to signal active loading, not decoration.
- **Density**: tables use PrimeNG's `[size]="'small'"` by default with a 44px row height;
  forms use standard size.

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
7. Immediately after login (or refresh-restore on app boot), `AUTH_ME` (nested SPC key) is
   called once to fetch `{ user, roles, permissions, menuFlags }` in a single hierarchical
   response, and background warm-up services populate lookup caches asynchronously while routing directly to `/dashboard`.
8. CSRF: since the refresh flow relies on a cookie, Angular's built-in
   `withXsrfConfiguration()` (double-submit cookie/header pattern) is enabled on
   `provideHttpClient()`.

---

## 9. Dynamic Navigation & Page Header Architecture

### 9.1 Dynamic Route Header & Breadcrumbs

- The app shell listens to router `NavigationEnd` events to calculate the active menu hierarchy and current page title from `MENU_ITEMS`.
- `AppShellStore.breadcrumbs` signal is updated automatically on navigation, providing instant dynamic title & breadcrumb updates across all views.
- `PageHeader` standardizes single-line page titles across every module (subtitles are omitted across all pages for consistent ERP density).

### 9.2 Notification System Architecture

- Full notifications module located at `features/notifications/` (`/notifications`).
- Supports filtering (All, Unread, Important), marking items as read, "Mark All as Read", and direct navigation from the top shell notification bell badge.

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

---

## 19. Database Master Table Alignment & Zod Schema Architecture

### 19.1 Master Table Schema Alignment (`HR.xlsx`)

The application's mock fixtures and frontend models strictly align with the core database master tables defined in `HR.xlsx`:

| DB Master Table | Primary Key | Key Frontend Entity & SPC Mapping |
|---|---|---|
| `ur_mst_user` | `user_id` (bigint), `user_hash` (varchar) | `User` interface (`userHash`), `AUTH_LOGIN`, `AUTH_ME` |
| `mst_employee` | `emp_id` (bigint), `emp_code` (varchar) | `EmployeeListItem`, `EmployeeDetail360`, `EMP_GET_LIST`, `EMP_GET_DETAIL_NESTED` |
| `mst_salary` | `txn_id` (int), `emp_id` (int) | `EmployeeSalaryInfo`, `SalaryStructureNested`, `PAY_GET_SALARY_STRUCTURE_NESTED` |
| `mst_hr_atten_type` | `atten_type_id` (bigint) | `LookupAttendanceType`, `AttendanceLogItem`, `LOOKUP_GET_ALL`, `ATT_GET_LOG` |
| `mst_holiday` | `holiday_id` (int) | `LookupHoliday`, `LOOKUP_GET_ALL`, `HOLIDAY_GET_LIST` |
| `mst_hr_txn_year` | `hr_year_id` (int) | `LookupHrYear`, `LOOKUP_GET_ALL`, `HR_YEAR_GET_LIST` |

### 19.2 Zod Client-Side Form Validation Architecture

Client-side validation is enforced using **Zod schemas** coupled to Angular's reactive form system via a bridge utility:

- **Schema definitions**: Located in `src/app/shared/validators/schemas/` (`auth.schema.ts`, `employee.schema.ts`, `leave.schema.ts`, `attendance.schema.ts`, `salary.schema.ts`, `profile.schema.ts`).
- **Angular Bridge**: `zodFormValidator(schema)` in `src/app/shared/validators/zod-form.validator.ts` converts any Zod schema into an Angular `ValidatorFn`, populating form control errors with Zod error messages (`zodError`).
- **Validation Rules**:
  - `userName`: minimum length 5
  - `password`: minimum length 8
  - `mobileNumber` / `emergencyContact`: Indian 10-digit format (`/^[6-9]\d{9}$/`)
  - `panNo`: Standard Indian PAN regex (`/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/`)
  - `ifscCode`: Standard Indian IFSC regex (`/^[A-Z]{4}0[A-Z0-9]{6}$/`)

---

## 20. Auto-Update & Deployment Recovery Engine Architecture

To ensure seamless long-session ERP stability and prevent stale client bundle failures across deployments, CompacctHR incorporates an automated version tracking and lazy chunk recovery system:

### 20.1 Version Build Automation (`version.json`)
- **Prebuild Hook**: `scripts/generate-version.js` runs automatically on `prestart` and `prebuild` npm tasks.
- **Output Artifact**: `public/version.json` containing `{ version, commitHash, buildTime }`.

### 20.2 Background Polling & Signal State (`VersionUpdateService`)
- **Location**: `src/app/core/version/version-update.service.ts`.
- **State Management**: Uses Angular Signals (`currentVersion`, `latestVersion`, `updateAvailable`, `showBanner`).
- **Polling Loop**: Periodically requests `/version.json?t=<timestamp>` every 15 minutes and on router navigation (throttled).
- **Silent Fetching**: Employs `SKIP_LOADING_INDICATOR` `HttpContext` token on `HttpClient.get()` calls to ensure background version checks do not trigger the global top loading indicator (`loadingInterceptor`).

### 20.3 Deployment Recovery (`ChunkErrorHandler`)
- **Location**: `src/app/core/version/chunk-error.handler.ts`.
- **ErrorHandler Registration**: Provided via `app.config.ts`.
- **Chunk Recovery**: Intercepts uncaught `ChunkLoadError` exceptions (thrown when a user attempts to load a lazy-loaded route chunk that was replaced/removed during a server deployment) and automatically triggers a version check and cache reload rather than allowing the SPA to fail silently.

### 20.4 Notification UX & Footer Integration
- **Floating Banner**: `VersionUpdateBanner` rendered at root layout shell when `showBanner()` is `true`, offering **Update Now** and **Later** (1-hour snooze) controls adhering to Sapphire Blue tokens (`ARCHITECTURE.md`).
- **Footer Indicator**: `Footer` component dynamically displays current version and Git commit hash, rendering an interactive **Update Available (vX.X.X)** badge when a newer version is available on the server.


