// src/app/core/api/mock-data-loader.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APIResponse } from './api-response.model';
import { SpcKey } from './spc-registry';

@Injectable({ providedIn: 'root' })
export class MockDataLoaderService {
  private http = inject(HttpClient);

  loadNonNested<T>(spcKey: SpcKey): Observable<APIResponse<T>> {
    return this.http.get<APIResponse<T>>(`assets/data/nonnested/${spcKey}.json`);
  }

  loadNested<T>(spcKey: SpcKey): Observable<APIResponse<T>> {
    return this.http.get<APIResponse<T>>(`assets/data/nested/${spcKey}.json`);
  }
}
