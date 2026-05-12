import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AnalyticsApi } from '../infrastructure/analytics-api';
import { AnalyticsAssembler } from '../infrastructure/analytics-assembler';
import { AnalyticsData, AnalyticsPeriod } from '../domain/model/analytics-models';
import { IamStore } from '../../iam/application/iam.store';

@Injectable({ providedIn: 'root' })
export class AnalyticsStore {
  private readonly analyticsApi = inject(AnalyticsApi);
  private readonly analyticsAssembler = inject(AnalyticsAssembler);
  private readonly iamStore = inject(IamStore);

  private readonly _currentAnalyticsData = signal<AnalyticsData | null>(null);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _selectedPeriod = signal<AnalyticsPeriod>('7_DAYS');

  readonly currentAnalyticsData = this._currentAnalyticsData.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly selectedPeriod = this._selectedPeriod.asReadonly();

  readonly averageCalorieIntake = computed(() => this._currentAnalyticsData()?.averageCalorieIntake ?? 0);
  readonly averageProteinIntake = computed(() => this._currentAnalyticsData()?.averageProteinIntake ?? 0);
  readonly currentStreak = computed(() => this._currentAnalyticsData()?.currentStreak ?? 0);
  readonly weightChange = computed(() => this._currentAnalyticsData()?.weightChange ?? 0);
  readonly weightChangeDirection = computed(() => this._currentAnalyticsData()?.weightChangeDirection ?? 'none');
  readonly weightChangeStatus = computed(() => this._currentAnalyticsData()?.weightChangeStatus ?? 'neutral');
  readonly dailyCaloriesHistory = computed(() => this._currentAnalyticsData()?.dailyCaloriesHistory ?? []);
  readonly macroAnalysis = computed(() => this._currentAnalyticsData()?.macroAnalysis ?? []);
  readonly daysWithCompleteLog = computed(() => this._currentAnalyticsData()?.daysWithCompleteLog ?? []);
  readonly weightEvolution = computed(() => this._currentAnalyticsData()?.weightEvolution ?? []);
  readonly goalWeight = computed(() => this._currentAnalyticsData()?.goalWeight);
  readonly adherenceHistory = computed(() => this._currentAnalyticsData()?.adherenceHistory ?? []);
  readonly behavioralEvents = computed(() => this._currentAnalyticsData()?.behavioralEvents ?? []);
  readonly proteinCompliance = computed(() => this._currentAnalyticsData()?.proteinCompliance);

  loadAnalyticsData(period: AnalyticsPeriod): Observable<AnalyticsData | undefined> {
    const user = this.iamStore.currentUser();
    if (!user?.id) {
      this._error.set('analytics.error_load');
      return throwError(() => new Error('User not authenticated.'));
    }

    this._loading.set(true);
    this._error.set(null);
    this._selectedPeriod.set(period);

    const userIdStr = String(user.id);
    let apiCall: Observable<any>;
    switch (period) {
      case '7_DAYS':  apiCall = this.analyticsApi.getWeeklyHistory(userIdStr);    break;
      case '30_DAYS': apiCall = this.analyticsApi.getMonthlyHistory(userIdStr);   break;
      case '90_DAYS': apiCall = this.analyticsApi.getQuarterlyHistory(userIdStr); break;
      default: return throwError(() => new Error('Invalid analytics period.'));
    }

    return apiCall.pipe(
      tap(rawData => {
        const assembled = this.analyticsAssembler.assembleAnalyticsData(
          rawData,
          period,
          user.goal as 'WEIGHT_LOSS' | 'MUSCLE_GAIN',
        );
        this._currentAnalyticsData.set(assembled);
        this._loading.set(false);
      }),
      catchError(err => {
        this._loading.set(false);
        this._error.set('analytics.error_load');
        return throwError(() => err);
      }),
    );
  }

  exportReport(fromDate: string, toDate: string): Observable<Blob> {
    const userId = this.iamStore.currentUser()?.id;
    if (!userId) {
      this._error.set('analytics.error_load');
      return throwError(() => new Error('User not authenticated.'));
    }

    this._loading.set(true);
    this._error.set(null);

    return this.analyticsApi.exportPdfReport(String(userId), fromDate, toDate).pipe(
      tap(() => this._loading.set(false)),
      catchError(err => {
        this._loading.set(false);
        this._error.set('analytics.error_load');
        return throwError(() => err);
      }),
    );
  }

  clear(): void {
    this._currentAnalyticsData.set(null);
    this._error.set(null);
    this._loading.set(false);
    this._selectedPeriod.set('7_DAYS');
  }
}
