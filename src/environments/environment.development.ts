// src/environments/environment.development.ts
export const environment = {
  production: false,
  useMockData: true,
  apiBase: '/api',
  loggingSinkUrl: null as string | null,
  appVersion: '1.0.0',
  versionCheckIntervalMs: 15 * 60 * 1000 // 15 minutes
};
