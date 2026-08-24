// src/app/core/api/api.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { APIResponse, RequestMeta } from './api-response.model';
import { MockDataLoaderService } from './mock-data-loader.service';
import { SpcKey } from './spc-registry';

@Injectable({ providedIn: 'root' })
export class APIService {
  private http = inject(HttpClient);
  private mock = inject(MockDataLoaderService);

  callNonNested<T>(
    spcKey: SpcKey,
    params: Record<string, unknown> = {},
    meta?: RequestMeta
  ): Observable<APIResponse<T>> {
    if (environment.useMockData) {
      return this.mock.loadNonNested<T>(spcKey, params);
    }
    return this.http.post<APIResponse<T>>(`${environment.apiBase}/nonnested`, { spcKey, params, meta });
  }

  callNested<T>(
    spcKey: SpcKey,
    params: Record<string, unknown> = {}
  ): Observable<APIResponse<T>> {
    if (environment.useMockData) {
      return this.mock.loadNested<T>(spcKey);
    }
    return this.http.post<APIResponse<T>>(`${environment.apiBase}/nested`, { spcKey, params });
  }
}
