// src/app/core/api/error-code-map.ts

export const ERROR_CODE_MAP: Record<string, string> = {
  AUTH_INVALID_CREDENTIALS: 'Invalid username or password.',
  AUTH_ACCOUNT_LOCKED: 'Your account has been locked. Please contact your administrator.',
  AUTH_SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  NETWORK_ERROR: 'Unable to connect to the server. Please check your network connection.',

  // Employees module
  EMP_NOT_FOUND: 'Employee record not found.',
  EMP_DUPLICATE_EMAIL: 'An employee with this email already exists.',

  // Attendance module
  ATT_ALREADY_REGULARIZED: 'This attendance entry has already been regularized.',
  ATT_FUTURE_DATE: 'Regularization cannot be submitted for a future date.',

  // Leave module
  LEAVE_INSUFFICIENT_BALANCE: 'Insufficient leave balance for the selected leave type.',
  LEAVE_OVERLAP: 'Selected dates overlap with an existing leave request.',
  LEAVE_PENDING_EXISTS: 'A pending leave request already exists for these dates.',

  // Payroll module
  PAY_PAYROLL_ALREADY_PROCESSED: 'Payroll has already been processed for this period.',
  PAY_INVALID_PAY_PERIOD: 'Invalid payroll period selected.',

  UNKNOWN: 'Something went wrong. Please try again.'
};

export function getErrorMessage(errorCode?: string): string {
  if (!errorCode) {
    return ERROR_CODE_MAP['UNKNOWN'];
  }
  return ERROR_CODE_MAP[errorCode] ?? ERROR_CODE_MAP['UNKNOWN'];
}
