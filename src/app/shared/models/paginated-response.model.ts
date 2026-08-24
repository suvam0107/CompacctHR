// src/app/shared/models/paginated-response.model.ts

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface TableSortMeta {
  field: string;
  order: 1 | -1; // 1 = asc, -1 = desc
}

export interface TableFilterMeta {
  [key: string]: unknown;
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}
