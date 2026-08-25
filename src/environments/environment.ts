// src/environments/environment.ts
export const environment = {
  production: true,
  useMockData: true, // Default to true while backend is in development
  apiBase: '/api',
  loggingSinkUrl: null as string | null,
  appVersion: '1.0.0',
  versionCheckIntervalMs: 15 * 60 * 1000 // 15 minutes
};
