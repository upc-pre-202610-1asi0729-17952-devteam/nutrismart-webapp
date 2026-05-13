import { Observable } from 'rxjs';
import { AnalyticsRawInput } from './analytics-resource';

export abstract class AnalyticsApi {
  abstract getHistory(userId: number | string, fromDate: string): Observable<AnalyticsRawInput>;
  abstract exportPdfReport(userId: number | string, fromDate: string, toDate: string): Observable<Blob>;
}
