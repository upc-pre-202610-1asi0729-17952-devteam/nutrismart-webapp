import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable, throwError } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AnalyticsApi } from './analytics-api';
import { AnalyticsRawInput, BodyMetricResource, NutritionLogResource } from './analytics-resource';

@Injectable({ providedIn: 'root' })
export class AnalyticsApiHttpService extends AnalyticsApi {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  /**
   * Fetches nutrition logs and body metrics for the given user since {@link fromDate}.
   * @param userId - Authenticated user identifier.
   * @param fromDate - ISO date string (YYYY-MM-DD) marking the start of the period.
   */
  override getHistory(userId: number | string, fromDate: string): Observable<AnalyticsRawInput> {
    const uid = String(userId);
    return forkJoin({
      nutritionLogs: this.http.get<NutritionLogResource[]>(
        `${this.base}${environment.nutritionLogEndpointPath}`,
        { params: { userId: uid } },
      ),
      weightEntries: this.http.get<BodyMetricResource[]>(
        `${this.base}${environment.bodyMetricsEndpointPath}`,
        { params: { userId: uid } },
      ),
    }).pipe(
      map(({ nutritionLogs, weightEntries }) => ({
        nutritionLogs: nutritionLogs.filter(e => e.loggedAt >= fromDate),
        weightEntries: weightEntries.filter(e => e.loggedAt >= fromDate),
      })),
      retry(2),
      catchError(err => throwError(() => err)),
    );
  }

  /**
   * Requests a PDF report blob for the given user and date range.
   * @param userId - Authenticated user identifier.
   * @param fromDate - Report start date (YYYY-MM-DD).
   * @param toDate - Report end date (YYYY-MM-DD).
   */
  override exportPdfReport(
    userId: number | string,
    fromDate: string,
    toDate: string,
  ): Observable<Blob> {
    return this.http
      .post(
        `${this.base}${environment.analyticsEndpointPath}/export`,
        { userId, fromDate, toDate },
        { responseType: 'blob' },
      )
      .pipe(
        retry(2),
        catchError(err => throwError(() => err)),
      );
  }
}
