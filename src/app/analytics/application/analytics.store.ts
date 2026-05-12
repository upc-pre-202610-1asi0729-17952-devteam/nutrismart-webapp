import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { AnalyticsApi } from '../infrastructure/analytics-api';
import { AnalyticsAssembler } from '../infrastructure/analytics-assembler';
import { AnalyticsData, AnalyticsPeriod } from '../domain/model/analytics-models';
import { IamStore } from '../../iam/application/iam.store';
import { SubscriptionPlan } from '../../iam/domain/model/subscription-plan.enum';

@Injectable({ providedIn: 'root' })
export class AnalyticsStore {
  private readonly analyticsApi        = inject(AnalyticsApi);
  private readonly analyticsAssembler  = inject(AnalyticsAssembler);
  private readonly iamStore            = inject(IamStore);

  private readonly _currentAnalyticsData  = signal<AnalyticsData | null>(null);
  private readonly _loading               = signal<boolean>(false);
  private readonly _error                 = signal<string | null>(null);
  private readonly _selectedPeriod        = signal<AnalyticsPeriod>('7_DAYS');
  private readonly _exportPdfModalOpen    = signal<boolean>(false);

  readonly currentAnalyticsData  = this._currentAnalyticsData.asReadonly();
  readonly loading               = this._loading.asReadonly();
  readonly error                 = this._error.asReadonly();
  readonly selectedPeriod        = this._selectedPeriod.asReadonly();
  readonly exportPdfModalOpen    = this._exportPdfModalOpen.asReadonly();

  readonly averageCalorieIntake  = computed(() => this._currentAnalyticsData()?.averageCalorieIntake ?? 0);
  readonly averageProteinIntake  = computed(() => this._currentAnalyticsData()?.averageProteinIntake ?? 0);
  readonly currentStreak         = computed(() => this._currentAnalyticsData()?.currentStreak ?? 0);
  readonly weightChange          = computed(() => this._currentAnalyticsData()?.weightChange ?? 0);
  readonly weightChangeDirection = computed(() => this._currentAnalyticsData()?.weightChangeDirection ?? 'none');
  readonly weightChangeStatus    = computed(() => this._currentAnalyticsData()?.weightChangeStatus ?? 'neutral');
  readonly dailyCaloriesHistory  = computed(() => this._currentAnalyticsData()?.dailyCaloriesHistory ?? []);
  readonly macroAnalysis         = computed(() => this._currentAnalyticsData()?.macroAnalysis ?? []);
  readonly daysWithCompleteLog   = computed(() => this._currentAnalyticsData()?.daysWithCompleteLog ?? []);
  readonly weightEvolution       = computed(() => this._currentAnalyticsData()?.weightEvolution ?? []);
  readonly goalWeight            = computed(() => this._currentAnalyticsData()?.goalWeight);
  readonly adherenceHistory      = computed(() => this._currentAnalyticsData()?.adherenceHistory ?? []);
  readonly behavioralEvents      = computed(() => this._currentAnalyticsData()?.behavioralEvents ?? []);
  readonly proteinCompliance     = computed(() => this._currentAnalyticsData()?.proteinCompliance);

  /** True when the current user holds a Premium subscription. */
  readonly isPremiumUser = computed(
    () => this.iamStore.currentUser()?.plan === SubscriptionPlan.PREMIUM,
  );

  /**
   * Loads and assembles analytics data for the given period.
   * Updates loading, error, and analytics state signals.
   * @param period - The analytics period to load.
   */
  loadAnalyticsData(period: AnalyticsPeriod): Observable<AnalyticsData | undefined> {
    const user = this.iamStore.currentUser();
    if (!user?.id) {
      this._error.set('analytics.error_load');
      return throwError(() => new Error('User not authenticated.'));
    }

    this._loading.set(true);
    this._error.set(null);
    this._selectedPeriod.set(period);

    const days     = period === '7_DAYS' ? 7 : period === '30_DAYS' ? 30 : 90;
    const fromDate = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];

    const targets = {
      dailyCalorieTarget: user.dailyCalorieTarget ?? 2000,
      proteinTarget:      user.proteinTarget      ?? 150,
      carbsTarget:        user.carbsTarget        ?? 250,
      fatTarget:          user.fatTarget          ?? 65,
      fiberTarget:        user.fiberTarget        ?? 25,
    };

    return this.analyticsApi.getHistory(user.id, fromDate).pipe(
      map(raw => {
        const hasData = raw.nutritionLogs.length > 0 || raw.weightEntries.length > 0;
        return hasData
          ? this.analyticsAssembler.assembleAnalyticsData(
              raw,
              period,
              user.goal as 'WEIGHT_LOSS' | 'MUSCLE_GAIN',
              targets,
            )
          : undefined;
      }),
      tap(assembled => {
        this._currentAnalyticsData.set(assembled ?? null);
        this._loading.set(false);
      }),
      catchError(err => {
        this._loading.set(false);
        this._error.set('analytics.error_load');
        return throwError(() => err);
      }),
    );
  }

  /**
   * Requests a PDF report export for the given date range.
   * @param fromDate - Report start date (YYYY-MM-DD).
   * @param toDate - Report end date (YYYY-MM-DD).
   */
  exportReport(fromDate: string, toDate: string): Observable<Blob> {
    const userId = this.iamStore.currentUser()?.id;
    if (!userId) {
      this._error.set('analytics.error_load');
      return throwError(() => new Error('User not authenticated.'));
    }

    this._loading.set(true);
    this._error.set(null);

    return this.analyticsApi.exportPdfReport(userId, fromDate, toDate).pipe(
      tap(() => this._loading.set(false)),
      catchError(err => {
        this._loading.set(false);
        this._error.set('analytics.error_load');
        return throwError(() => err);
      }),
    );
  }

  /** Opens the PDF export modal. */
  openExportPdfModal(): void {
    this._exportPdfModalOpen.set(true);
  }

  /** Closes the PDF export modal. */
  closeExportPdfModal(): void {
    this._exportPdfModalOpen.set(false);
  }

  /** Resets all analytics state to its initial values. */
  clear(): void {
    this._currentAnalyticsData.set(null);
    this._error.set(null);
    this._loading.set(false);
    this._selectedPeriod.set('7_DAYS');
    this._exportPdfModalOpen.set(false);
  }
}
