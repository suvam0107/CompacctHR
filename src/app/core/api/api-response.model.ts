// src/app/core/api/api-response.model.ts

export interface RequestMeta {
  page?: number;
  pageSize?: number;
  sort?: { field: string; direction: 'asc' | 'desc' }[];
}

export interface APIRequest<TParams = Record<string, unknown>> {
  spcKey: string;        // logical key, NEVER the raw SP name
  params: TParams;
  meta?: RequestMeta;
}

export interface APIResponse<T> {
  success: boolean;
  data: T;
  errorCode?: string;     // maps to core/api/error-code-map.ts
  message?: string;
  totalCount?: number;    // for paginated non-nested calls
}
