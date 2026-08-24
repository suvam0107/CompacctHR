// src/app/core/api/spc-registry.ts

/**
 * SPC Registry — Central registry for logical Stored Procedure Call keys.
 * Raw stored procedure names should NEVER be referenced in feature code.
 */
export const SPC = {
  // Auth module
  AUTH_LOGIN:                  'AUTH_LOGIN_VALIDATE',       // non-nested: validates credentials & returns access token
  AUTH_ME:                     'AUTH_GET_SESSION_NESTED',   // nested: returns user session, roles, permissions, menu flags

  // Core / Lookups
  LOOKUP_GET_ALL:              'LOOKUP_GET_ALL',            // non-nested: departments, designations, leave types, attendance types, holidays, hr years
  HOLIDAY_GET_LIST:            'HOLIDAY_GET_LIST',          // non-nested: company holidays list
  HR_YEAR_GET_LIST:            'HR_YEAR_GET_LIST',          // non-nested: HR financial transaction years list
  ATTEN_TYPE_GET_LIST:         'ATTEN_TYPE_GET_LIST',       // non-nested: attendance types master list

  // Notifications
  NOTIF_GET_COUNT:             'NOTIF_GET_COUNT',           // non-nested: unread notifications count

  // Dashboard module
  DASH_GET_SUMMARY:            'DASH_GET_SUMMARY',          // non-nested: KPI cards & attendance overview

  // Employees module
  EMP_GET_LIST:                'EMP_GET_LIST',                 // non-nested: paginated list
  EMP_GET_DETAIL:              'EMP_GET_DETAIL_NESTED',        // nested: 360 view
  EMP_CREATE:                  'EMP_CREATE',                   // non-nested: write
  EMP_UPDATE:                  'EMP_UPDATE',                   // non-nested: write
  EMP_GET_DROPDOWN:            'EMP_GET_DROPDOWN',             // non-nested: flat list for dropdowns

  // Attendance module
  ATT_GET_LOG:                 'ATT_GET_LOG',                  // non-nested: paginated attendance log
  ATT_GET_CALENDAR:            'ATT_GET_CALENDAR',             // non-nested: calendar month view
  ATT_GET_REGULARIZATION_LIST: 'ATT_GET_REGULARIZATION_LIST',  // non-nested: regularization requests
  ATT_SUBMIT_REGULARIZATION:   'ATT_SUBMIT_REGULARIZATION',    // non-nested: write

  // Leave module
  LEAVE_GET_BALANCE:           'LEAVE_GET_BALANCE',            // non-nested: user leave balances
  LEAVE_GET_HISTORY:           'LEAVE_GET_HISTORY',            // non-nested: paginated history
  LEAVE_GET_APPROVALS:         'LEAVE_GET_APPROVALS',          // non-nested: pending approvals
  LEAVE_APPLY:                 'LEAVE_APPLY',                  // non-nested: write
  LEAVE_APPROVE:               'LEAVE_APPROVE',                // non-nested: write
  LEAVE_REJECT:                'LEAVE_REJECT',                 // non-nested: write

  // Payroll module
  PAY_GET_PAYSLIPS:            'PAY_GET_PAYSLIPS',             // non-nested: paginated payslips
  PAY_GET_PAYSLIP_DETAIL:      'PAY_GET_PAYSLIP_DETAIL_NESTED', // nested: payslip breakdown
  PAY_GET_SALARY_STRUCTURE:    'PAY_GET_SALARY_STRUCTURE_NESTED', // nested: salary structure
  PAY_RUN_PAYROLL:             'PAY_RUN_PAYROLL',              // non-nested: write

  // Profile module
  PROFILE_GET_MY:              'PROFILE_GET_MY_NESTED',        // nested: own profile 360 view
  PROFILE_UPDATE_MY:           'PROFILE_UPDATE_MY',            // non-nested: write

  // Admin module
  ADMIN_GET_USERS:             'ADMIN_GET_USERS',              // non-nested: paginated users
  ADMIN_GET_ROLES:             'ADMIN_GET_ROLES',              // non-nested: role definitions
  ADMIN_ASSIGN_ROLE:           'ADMIN_ASSIGN_ROLE',            // non-nested: write
} as const;

export type SpcKey = typeof SPC[keyof typeof SPC];
