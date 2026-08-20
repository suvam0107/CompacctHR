# STATE.md — CompacctHR Project State & Progress

This document tracks the current progress, completed milestones, active contracts, and next backlog items for the CompacctHR frontend application.

---

## 1. Project Overview & Current Milestone

- **Project:** CompacctHR (Enterprise Human Resource Management System)
- **Current Milestone:** **Milestone 2 — Post-Login Sync Layer, Authenticated Shell, & Dashboard Completed**
- **Mode:** Development with Mock Data (`environment.useMockData = true`)

---

## 2. Tech Stack & Version Locks

| Technology | Active Version | Notes |
|---|---|---|
| **Angular** | `21.2.21` | Standalone-only, Zoneless Change Detection (`provideZonelessChangeDetection()`) |
| **PrimeNG** | `21.1.9` | Customized Aura preset via `@primeuix/themes` (`theme/primeng-preset.ts`) |
| **TypeScript** | `~5.9.3` | Strict mode enabled |
| **Styling** | SCSS + CSS Variables | Design tokens in `theme/_variables.scss`, Bootstrap 5.3.3 (CSS CDN only) |
| **Testing** | Vitest (`v4.1.11`) | Native Angular unit test builder |
| **Icons** | PrimeIcons (`^8.0.0`) | Primary glyph library |

---

## 3. Directory & Module Status

```
src/app/
├── core/
│   ├── api/                  [COMPLETED] APIService, MockDataLoaderService, spc-registry, error-code-map
│   ├── auth/                 [COMPLETED] AuthService, AuthStore (Signals), authGuard, auth models
│   ├── interceptors/         [COMPLETED] loadingInterceptor, errorInterceptor
│   ├── logging/              [COMPLETED] LoggerService (log, debug, info, warn, error)
│   ├── state/                [COMPLETED] AppShellStore, LookupCacheService, MenuService, NotificationService
│   └── sync/                 [COMPLETED] Sync component, sync.service, sync.store, sync.guard, sync-task-registry
├── layout/
│   ├── auth-layout/          [COMPLETED] Split hero branding + form outlet layout
│   ├── shell/                [COMPLETED] Authenticated app shell layout (independent scrolling, global progress bar)
│   ├── header/               [COMPLETED] Top navbar (blue brand theme, user profile menu & notifications badge)
│   ├── sidebar/              [COMPLETED] Collapsible blue sidebar, CSS grid submenu accordion, perfect icon centering
│   ├── breadcrumb/           [COMPLETED] Dynamic route breadcrumbs with light contrast on blue header
│   └── footer/               [COMPLETED] Enterprise copyright footer
├── auth/
│   ├── auth.routes.ts        [COMPLETED] /auth/login and /auth/forgot-password routes
│   ├── pages/login/          [COMPLETED] Reactive form login with validation & signal state
│   ├── pages/forgot-password/[COMPLETED] Password recovery stub
│   └── services/             [COMPLETED] PasswordResetService stub
├── shared/
│   ├── components/           [COMPLETED] StatCard, LoadingSkeleton (shimmer animation), PageHeader, StatusBadge, EmptyState
│   ├── directives/           [COMPLETED] HasPermissionDirective
│   └── pipes/                [COMPLETED] InitialsPipe, DateFormatPipe
└── features/
    ├── dashboard/            [COMPLETED] DashboardHome, AttendanceWidget, LeaveWidget, AnnouncementsWidget, DashboardService, LeaveService
    ├── employees/            [PENDING]
    ├── attendance/           [PENDING]
    ├── leave/                [PENDING]
    ├── payroll/              [PENDING]
    ├── profile/              [PENDING]
    └── admin/                [PENDING]
```

---

## 4. Active SPC Keys & Mock Fixtures

| SPC Key | Endpoint | Purpose | Mock Fixture Location | Status |
|---|---|---|---|---|
| `AUTH_LOGIN_VALIDATE` | `POST /api/nonnested` | Validate user credentials and return JWT access token | `src/assets/data/nonnested/AUTH_LOGIN_VALIDATE.json` & `public/assets/data/nonnested/AUTH_LOGIN_VALIDATE.json` | Active |
| `AUTH_GET_SESSION_NESTED` | `POST /api/nested` | Retrieve user profile, roles, permissions, and menu flags | `src/assets/data/nested/AUTH_GET_SESSION_NESTED.json` & `public/assets/data/nested/AUTH_GET_SESSION_NESTED.json` | Active |
| `LOOKUP_GET_ALL` | `POST /api/nonnested` | Master lookup data (departments, designations, leave types) | `src/assets/data/nonnested/LOOKUP_GET_ALL.json` & `public/assets/data/nonnested/LOOKUP_GET_ALL.json` | Active |
| `NOTIF_GET_COUNT` | `POST /api/nonnested` | Unread notifications count | `src/assets/data/nonnested/NOTIF_GET_COUNT.json` & `public/assets/data/nonnested/NOTIF_GET_COUNT.json` | Active |
| `DASH_GET_SUMMARY` | `POST /api/nonnested` | Dashboard KPI stats, attendance summary, announcements | `src/assets/data/nonnested/DASH_GET_SUMMARY.json` & `public/assets/data/nonnested/DASH_GET_SUMMARY.json` | Active |
| `LEAVE_GET_BALANCE` | `POST /api/nonnested` | Employee leave balances (CL, SL, EL) | `src/assets/data/nonnested/LEAVE_GET_BALANCE.json` & `public/assets/data/nonnested/LEAVE_GET_BALANCE.json` | Active |

---

## 5. Verification & Test Suite Status

- **Unit Tests:** `22 / 22` passing across 6 test suites
  - `src/app/app.spec.ts` (1 test)
  - `src/app/auth/pages/login/login.spec.ts` (7 tests)
  - `src/app/core/sync/sync.store.spec.ts` (4 tests)
  - `src/app/core/state/menu.service.spec.ts` (3 tests)
  - `src/app/shared/pipes/initials.pipe.spec.ts` (4 tests)
  - `src/app/shared/pipes/date-format.pipe.spec.ts` (3 tests)
- **Production Build:** Success (`ng build` exits code 0)
- **SCSS Theme Token Compliance:** Zero hardcoded hex colors in application code (all use design tokens from `theme/_variables.scss`).

---

## 6. Next Steps & Feature Backlog

1. **Employees Module (`features/employees/`)**
   - Employee Directory list with `DataTable`, server-side pagination, search, column sorting, Excel export.
   - 360-degree employee detail view consuming `EMP_GET_DETAIL_NESTED`.
   - Employee create / edit forms with reactive validation.
2. **Attendance Module (`features/attendance/`)**
   - Daily punch log with date filters.
   - Monthly attendance calendar overview.
   - Regularization request submission and approval workflow.
3. **Leave Module (`features/leave/`)**
   - Leave application form with balance check.
   - My leave history table.
   - Manager leave approvals workflow (`*appHasPermission="'leave:approve'"`).
4. **Payroll Module (`features/payroll/`)**
   - Monthly payslips list and PDF generation via `pdfmake`.
   - Salary structure view.
   - Payroll processing batch workflow.
