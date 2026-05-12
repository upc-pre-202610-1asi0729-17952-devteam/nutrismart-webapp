import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';
import { AnalyticsApi } from './analytics-api';
import { AnalyticsData } from '../domain/model/analytics-models';

@Injectable({ providedIn: 'root' })
export class AnalyticsApiHttpService extends AnalyticsApi {
  private readonly http = inject(HttpClient);
  private readonly base = 'http://localhost:3000';

  getWeeklyHistory(userId: number | string): Observable<AnalyticsData> {
    return this.fetchByPeriod(userId, '7_DAYS');
  }

  getMonthlyHistory(userId: number | string): Observable<AnalyticsData> {
    return this.fetchByPeriod(userId, '30_DAYS');
  }

  getQuarterlyHistory(userId: number | string): Observable<AnalyticsData> {
    return this.fetchByPeriod(userId, '90_DAYS');
  }

  exportPdfReport(userId: number | string, fromDate: string, toDate: string): Observable<Blob> {
    return this.http
      .post(`${this.base}/analytics/export`, { userId, fromDate, toDate }, { responseType: 'blob' })
      .pipe(
        retry(2),
        catchError(err => throwError(() => err)),
      );
  }

  private fetchByPeriod(userId: number | string, period: string): Observable<AnalyticsData> {
    return this.http
      .get<AnalyticsData[]>(`${this.base}/analytics`, { params: { userId, period } })
      .pipe(
        map(results => {
          if (!results || results.length === 0) throw new Error('analytics.error_load');
          return results[0];
        }),
        catchError(err => throwError(() => err)),
      );
  }
}
