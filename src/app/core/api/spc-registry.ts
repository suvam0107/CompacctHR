// src/app/core/api/spc-registry.ts

/**
 * SPC Registry — Central registry for logical Stored Procedure Call keys.
 * Raw stored procedure names should NEVER be referenced in feature code.
 */
export const SPC = {
  // Auth module
  AUTH_LOGIN:        'AUTH_LOGIN_VALIDATE',       // non-nested: validates credentials & returns access token
  AUTH_ME:           'AUTH_GET_SESSION_NESTED',   // nested: returns user session, roles, permissions, menu flags

  // Core / Lookups
  LOOKUP_GET_ALL:    'LOOKUP_GET_ALL',            // non-nested: departments, designations, leave types

  // Notifications
  NOTIF_GET_COUNT:   'NOTIF_GET_COUNT',           // non-nested: unread notifications count

  // Dashboard module
  DASH_GET_SUMMARY:  'DASH_GET_SUMMARY',          // non-nested: KPI cards & attendance overview

  // Leave module
  LEAVE_GET_BALANCE: 'LEAVE_GET_BALANCE',         // non-nested: user's leave balances
} as const;

export type SpcKey = typeof SPC[keyof typeof SPC];

