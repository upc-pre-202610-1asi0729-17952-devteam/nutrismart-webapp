import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { BillingRecord } from '../domain/model/billing-record.entity';
import { BillingHistoryAssembler } from './billing-history-assembler';
import { BillingHistoryResource } from './billing-history-resource';

const assembler = new BillingHistoryAssembler();

/**
 * HTTP façade for the `/billing-history` REST resource.
 *
 * All network errors are propagated as empty arrays; callers should
 * handle the empty-state scenario in the UI.
 *
 * Provided in root so a single instance is shared across the application.
 */
@Injectable({ providedIn: 'root' })
export class BillingHistoryApi {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl + environment.billingHistoryEndpointPath;

  /**
   * Fetches all billing records for a given user, sorted newest-first.
   *
   * @param userId - User identifier (string or numeric).
   * @returns Observable emitting an array of {@link BillingRecord} entities.
   */
  getHistory(userId: string): Observable<BillingRecord[]> {
    return this.http
      .get<BillingHistoryResource[]>(`${this.baseUrl}?userId=${userId}`)
      .pipe(
        map(resources =>
          resources
            .map(r => assembler.toEntityFromResource(r))
            .sort((a, b) => b.date.localeCompare(a.date)),
        ),
        catchError(() => of([])),
      );
  }
}
