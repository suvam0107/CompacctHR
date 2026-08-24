// src/app/core/api/mock-data-loader.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { APIResponse } from './api-response.model';
import { SpcKey } from './spc-registry';

@Injectable({ providedIn: 'root' })
export class MockDataLoaderService {
  private http = inject(HttpClient);

  loadNonNested<T>(spcKey: SpcKey, params: Record<string, unknown> = {}): Observable<APIResponse<T>> {
    return this.http.get<APIResponse<T>>(`assets/data/nonnested/${spcKey}.json`).pipe(
      map(res => {
        if (!res.success || !Array.isArray(res.data) || Object.keys(params).length === 0) {
          return res;
        }

        let items = [...(res.data as Record<string, unknown>[])];

        const search = typeof params['search'] === 'string' ? params['search'].trim().toLowerCase() : '';
        const deptId = params['departmentId'];
        const desigId = params['designationId'];
        const status = typeof params['status'] === 'string' ? params['status'].toLowerCase() : '';

        if (search) {
          items = items.filter(item => {
            return Object.values(item).some(val =>
              val !== null && val !== undefined && String(val).toLowerCase().includes(search)
            );
          });
        }

        if (deptId) {
          items = items.filter(item => item['departmentId'] === deptId || item['deptId'] === deptId);
        }

        if (desigId) {
          items = items.filter(item => item['designationId'] === desigId || item['desigId'] === desigId);
        }

        if (status) {
          items = items.filter(item => String(item['status'] || '').toLowerCase() === status);
        }

        const startDate = typeof params['startDate'] === 'string' ? params['startDate'] : (typeof params['fromDate'] === 'string' ? params['fromDate'] : '');
        const endDate = typeof params['endDate'] === 'string' ? params['endDate'] : (typeof params['toDate'] === 'string' ? params['toDate'] : '');

        if (startDate || endDate) {
          items = items.filter(item => {
            const itemDateStr = String(item['date'] || item['appliedOn'] || item['joinDate'] || item['createdOn'] || '').slice(0, 10);
            if (!itemDateStr) return true;
            if (startDate && itemDateStr < startDate) return false;
            if (endDate && itemDateStr > endDate) return false;
            return true;
          });
        }

        return {
          ...res,
          data: items as unknown as T,
          totalCount: items.length
        };
      })
    );
  }

  loadNested<T>(spcKey: SpcKey): Observable<APIResponse<T>> {
    return this.http.get<APIResponse<T>>(`assets/data/nested/${spcKey}.json`);
  }
}
