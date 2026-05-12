import { Observable } from 'rxjs';
import { AnalyticsData } from '../domain/model/analytics-models';

export abstract class AnalyticsApi {
  abstract getWeeklyHistory(userId: string): Observable<AnalyticsData>;
  abstract getMonthlyHistory(userId: string): Observable<AnalyticsData>;
  abstract getQuarterlyHistory(userId: string): Observable<AnalyticsData>;
  abstract exportPdfReport(userId: string, fromDate: string, toDate: string): Observable<Blob>;
}
