import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { AnalyticsApi } from './analytics-api';
import { AnalyticsRawInput, NutritionLogResource, BodyMetricResource } from './analytics-resource';

@Injectable({ providedIn: 'root' })
export class AnalyticsApiHttpService extends AnalyticsApi {
  private readonly http = inject(HttpClient);
  private readonly base = 'http://localhost:3000';

  getHistory(userId: number | string, fromDate: string): Observable<AnalyticsRawInput> {
    const uid = String(userId);
    return forkJoin({
      nutritionLogs: this.http.get<NutritionLogResource[]>(`${this.base}/nutrition-log`, {
        params: { userId: uid },
      }),
      weightEntries: this.http.get<BodyMetricResource[]>(`${this.base}/body-metrics`, {
        params: { user_id: uid },
      }),
    }).pipe(
      map(({ nutritionLogs, weightEntries }) => ({
        nutritionLogs: nutritionLogs.filter(e => e.loggedAt >= fromDate),
        weightEntries: weightEntries.filter(e => e.logged_at >= fromDate),
      })),
      retry(2),
      catchError(err => throwError(() => err)),
    );
  }

  exportPdfReport(userId: number | string, fromDate: string, toDate: string): Observable<Blob> {
    return this.http
      .post(`${this.base}/analytics/export`, { userId, fromDate, toDate }, { responseType: 'blob' })
      .pipe(
        retry(2),
        catchError(err => throwError(() => err)),
      );
  }
}
