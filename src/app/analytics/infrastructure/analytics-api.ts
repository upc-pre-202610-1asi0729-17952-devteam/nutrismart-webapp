import { Observable } from 'rxjs';
import {
  DailyCaloriesHistory,
  MacroAnalysis,
  AdherenceHistoryEntry,
  BehavioralEvent,
  AnalyticsData,
  AnalyticsPeriod,
} from '../domain/model/analytics-models';

/**
 * Abstract API for fetching analytics data.
 *
 * Implementations will provide concrete HTTP requests to the backend.
 */
export abstract class AnalyticsApi {
  /**
   * Fetches analytics data for a weekly period for a given user.
   * @param userId The ID of the user.
   */
  abstract getWeeklyHistory(userId: number): Observable<AnalyticsData>;

  /**
   * Fetches analytics data for a monthly period for a given user.
   * @param userId The ID of the user.
   */
  abstract getMonthlyHistory(userId: number): Observable<AnalyticsData>;

  /**
   * Fetches analytics data for a quarterly period (90 days) for a given user.
   * @param userId The ID of the user.
   */
  abstract getQuarterlyHistory(userId: number): Observable<AnalyticsData>;

  /**
   * Fetches specific weekly macro analysis for a given user.
   * @param userId The ID of the user.
   */
  abstract getWeeklyMacroAnalysis(userId: number): Observable<MacroAnalysis[]>;

  /**
   * Fetches adherence history for a given user.
   * @param userId The ID of the user.
   */
  abstract getAdherenceHistory(userId: number): Observable<AdherenceHistoryEntry[]>;

  /**
   * Requests a PDF report export for a given user and date range.
   * @param userId The ID of the user.
   * @param fromDate Start date for the report (ISO format).
   * @param toDate End date for the report (ISO format).
   */
  abstract exportPdfReport(userId: number, fromDate: string, toDate: string): Observable<Blob>;
}
