import { Observable } from 'rxjs';
import { AnalyticsData } from '../domain/model/analytics-models';

export abstract class AnalyticsApi {
  abstract getWeeklyHistory(userId: number | string): Observable<AnalyticsData | null>;
  abstract getMonthlyHistory(userId: number | string): Observable<AnalyticsData | null>;
  abstract getQuarterlyHistory(userId: number | string): Observable<AnalyticsData | null>;
  abstract exportPdfReport(userId: number | string, fromDate: string, toDate: string): Observable<Blob>;
}
