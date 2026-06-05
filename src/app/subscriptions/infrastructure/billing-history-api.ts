import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, of, retry } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment.development';
import { BillingRecord } from '../domain/model/billing-record.entity';
import { BillingHistoryAssembler } from './billing-history-assembler';
import { BillingHistoryResource } from './billing-history-resource';

const assembler = new BillingHistoryAssembler();

/** Payload for creating a new billing record (id is server-assigned). */
export type NewBillingRecord = Omit<BillingHistoryResource, 'id'>;

/**
 * HTTP façade for the `/billing-history` REST resource.
 *
 * Network errors on reads are swallowed (returns empty array);
 * writes use {@link retry} and surface failures to the caller.
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

  /**
   * Persists a new billing record and returns the created entity.
   *
   * @param data - Record data without `id` (assigned by the server).
   * @returns Observable emitting the created {@link BillingRecord}.
   */
  createRecord(data: NewBillingRecord): Observable<BillingRecord> {
    return this.http
      .post<BillingHistoryResource>(this.baseUrl, data)
      .pipe(
        retry(2),
        map(r => assembler.toEntityFromResource(r)),
      );
  }
}
