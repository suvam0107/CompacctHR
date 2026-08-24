# STATE.md — CompacctHR Project State & Progress

This document tracks the current progress, completed milestones, active contracts, and next backlog items for the CompacctHR frontend application.

---

## 1. Project Overview & Current Milestone

- **Project:** CompacctHR (Enterprise Human Resource Management System)
- **Current Milestone:** **Milestone 4 — Core Refactoring, Dynamic Headers, Notifications & Table Export Overhaul Completed**
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
| **Exports** | `exceljs` & `pdfmake` | Custom auto-width Excel exports & landscape PDF with company logo header |

---

## 3. Directory & Module Status

```
src/app/
├── core/
│   ├── api/                  [COMPLETED] APIService, MockDataLoaderService (with query filtering), spc-registry
│   ├── auth/                 [COMPLETED] AuthService (direct /dashboard navigation & prefetching), AuthStore, authGuard
│   ├── interceptors/         [COMPLETED] loadingInterceptor, errorInterceptor
│   ├── logging/              [COMPLETED] LoggerService (log, debug, info, warn, error)
│   └── state/                [COMPLETED] AppShellStore, LookupCacheService, MenuService, NotificationService
├── layout/
│   ├── auth-layout/          [COMPLETED] Split hero branding + form outlet layout
│   ├── shell/                [COMPLETED] NavigationEnd router listener for dynamic breadcrumbs & titles
│   ├── header/               [COMPLETED] Top navbar with dynamic title, notification bell link
│   ├── sidebar/              [COMPLETED] Collapsible blue sidebar, accordion navigation
│   ├── breadcrumb/           [COMPLETED] Dynamic route breadcrumbs with active route mapping
│   └── footer/               [COMPLETED] Enterprise copyright footer
├── auth/
│   ├── auth.routes.ts        [COMPLETED] /auth/login route (removed /forgot-password)
│   └── pages/login/          [COMPLETED] Reactive form login with validation & signal state
├── shared/
│   ├── components/           [COMPLETED] DataTable (with #dt global filter & export), ExportButton, SearchInput, PageHeader (no subtitle), LoadingSkeleton, StatusBadge, EmptyState
│   ├── utils/                [COMPLETED] excel-export.util (auto column width), pdf-export.util (landscape layout, logo header, copyright footer)
│   ├── directives/           [COMPLETED] HasPermissionDirective
│   ├── pipes/                [COMPLETED] InitialsPipe, DateFormatPipe, CurrencyPipe
│   └── validators/           [COMPLETED] Zod schemas & zodFormValidator bridge with inline error message support
└── features/
    ├── dashboard/            [COMPLETED] DashboardHome, AttendanceWidget, LeaveWidget, AnnouncementsWidget
    ├── employees/            [COMPLETED] EmployeeList, EmployeeDetail, EmployeeForm (PAN, IFSC, Bank, Emergency Contact)
    ├── attendance/           [COMPLETED] AttendanceLog, AttendanceCalendar, RegularizationRequests (with Toast feedback)
    ├── leave/                [COMPLETED] LeaveApply, LeaveHistory, LeaveApprovals (with Toast feedback & reactive state update)
    ├── payroll/              [COMPLETED] Payslips, SalaryStructure, PayrollProcessing (with Toast feedback)
    ├── profile/              [COMPLETED] MyProfile (PAN, IFSC, Bank details)
    ├── admin/                [COMPLETED] UserManagement, RoleManagement, SystemSettings
    └── notifications/        [COMPLETED] Notifications page with Unread/Important filter pills & mark as read
```

---

## 4. Active SPC Keys & Mock Fixtures

| SPC Key | Endpoint | Purpose | Status |
|---|---|---|---|
| `AUTH_LOGIN_VALIDATE` | `POST /api/nonnested` | Validate credentials & issue JWT | Active |
| `AUTH_GET_SESSION_NESTED` | `POST /api/nested` | User profile, roles & permissions | Active |
| `LOOKUP_GET_ALL` | `POST /api/nonnested` | Departments, designations, leave types | Active |
| `NOTIF_GET_COUNT` | `POST /api/nonnested` | Unread notification badge count | Active |
| `NOTIF_GET_LIST` | `POST /api/nonnested` | List of system alerts & notifications | Active |
| `DASH_GET_SUMMARY` | `POST /api/nonnested` | Dashboard KPI stats & announcements | Active |
| `EMP_GET_LIST` | `POST /api/nonnested` | Employee directory table data | Active |
| `LEAVE_GET_BALANCE` | `POST /api/nonnested` | Leave balance metrics | Active |

---

## 5. Verification & Test Suite Status

- **Unit Tests:** `18 / 18` passing across 5 test suites (`app.spec.ts`, `login.spec.ts`, `menu.service.spec.ts`, `initials.pipe.spec.ts`, `date-format.pipe.spec.ts`)
- **TypeScript Typecheck:** `npx tsc --noEmit` exits with **0 errors**.
- **Production Build:** Verified clean bundle compilation.
