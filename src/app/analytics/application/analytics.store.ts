import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, switchMap } from 'rxjs/operators';
import { AnalyticsApi } from '../infrastructure/analytics-api';
import { AnalyticsAssembler } from '../infrastructure/analytics-assembler';
import { AnalyticsData, AnalyticsPeriod, AdherenceHistoryEntry, BehavioralEvent, DailyCaloriesHistory, MacroAnalysis } from '../domain/model/analytics-models';
import { IamStore } from '../../iam/application/iam.store';

/**
 * Central state store for the Analytics bounded context.
 *
 * Manages the current user's analytics data using Angular signals.
 * All data fetching is done via {@link AnalyticsApi} and assembled by {@link AnalyticsAssembler}.
 *
 * Provided in root so a single instance is shared across the application.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsStore {
  /** API façade for HTTP operations on analytics resources. */
  private analyticsApi = inject(AnalyticsApi);

  /** Assembler for converting raw API data to domain models. */
  private analyticsAssembler = inject(AnalyticsAssembler);

  /** IAM store exposing the authenticated user. */
  private iamStore = inject(IamStore);

  /** Current analytics data for the active user, or `null` if not loaded. */
  private _currentAnalyticsData = signal<AnalyticsData | null>(null);

  /** Whether an async operation is in flight. */
  private _loading = signal<boolean>(false);

  /** Last error message from a failed async operation, or `null`. */
  private _error = signal<string | null>(null);

  /** Currently selected period for analytics data. */
  private _selectedPeriod = signal<AnalyticsPeriod>('7_DAYS');

  // ─── Public readonly signals ───────────────────────────────────────────────

  /** Read-only signal exposing the current {@link AnalyticsData}. */
  readonly currentAnalyticsData = this._currentAnalyticsData.asReadonly();

  /** Read-only signal indicating whether an async operation is in progress. */
  readonly loading = this._loading.asReadonly();

  /** Read-only signal holding the most recent error message, or `null`. */
  readonly error = this._error.asReadonly();

  /** Read-only signal for the currently selected analytics period. */
  readonly selectedPeriod = this._selectedPeriod.asReadonly();

  // Computed signals for various parts of AnalyticsData
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

  // ─── Loading / initialization ──────────────────────────────────────────────

  /**
   * Loads analytics data for a specific period for the current user.
   *
   * @param period The desired analytics period ('7_DAYS', '30_DAYS', '90_DAYS').
   * @returns Observable emitting the loaded AnalyticsData or `undefined` if not found.
   */
  loadAnalyticsData(period: AnalyticsPeriod): Observable<AnalyticsData | undefined> {
    const userId = this.iamStore.currentUser()?.id;
    if (!userId) {
      this._error.set('User not authenticated.');
      return throwError(() => new Error('User not authenticated.'));
    }

    this._loading.set(true);
    this._error.set(null);
    this._selectedPeriod.set(period);

    let apiCall: Observable<any>;
    switch (period) {
      case '7_DAYS':
        apiCall = this.analyticsApi.getWeeklyHistory(userId);
        break;
      case '30_DAYS':
        apiCall = this.analyticsApi.getMonthlyHistory(userId);
        break;
      case '90_DAYS':
        apiCall = this.analyticsApi.getQuarterlyHistory(userId); // Corregido: Usar getQuarterlyHistory
        break;
      default:
        return throwError(() => new Error('Invalid analytics period.'));
    }

    return apiCall.pipe(
      tap(rawData => {
        const assembledData = this.analyticsAssembler.assembleAnalyticsData(rawData, period);
        this._currentAnalyticsData.set(assembledData);
        this._loading.set(false);
      }),
      catchError(err => {
        this._loading.set(false);
        this._error.set(err.message);
        return throwError(() => err);
      })
    );
  }

  /**
   * Requests a PDF report export for the current user.
   *
   * @param fromDate Start date for the report (ISO format).
   * @param toDate End date for the report (ISO format).
   * @returns Observable emitting a Blob representing the PDF file.
   */
  exportReport(fromDate: string, toDate: string): Observable<Blob> {
    const userId = this.iamStore.currentUser()?.id;
    if (!userId) {
      this._error.set('User not authenticated.');
      return throwError(() => new Error('User not authenticated.'));
    }

    this._loading.set(true);
    this._error.set(null);

    return this.analyticsApi.exportPdfReport(userId, fromDate, toDate).pipe(
      tap(() => this._loading.set(false)),
      catchError(err => {
        this._loading.set(false);
        this._error.set(err.message);
        return throwError(() => err);
      })
    );
  }

  /**
   * Clears the currently loaded analytics data from memory.
   */
  clear(): void {
    this._currentAnalyticsData.set(null);
    this._error.set(null);
    this._loading.set(false);
    this._selectedPeriod.set('7_DAYS');
  }

  /**
   * Loads local preview data without calling the backend.
   *
   * Useful while developing the Analytics UI independently
   * from authentication and API availability.
   *
   * @param period The desired analytics period ('7_DAYS', '30_DAYS', '90_DAYS').
   * @param goalType The user's goal type ('WEIGHT_LOSS', 'MUSCLE_GAIN').
   */
  loadPreviewData(period: AnalyticsPeriod, goalType: 'WEIGHT_LOSS' | 'MUSCLE_GAIN' = 'WEIGHT_LOSS'): void {
    this._loading.set(true);
    this._error.set(null);
    this._selectedPeriod.set(period);

    let mockData: AnalyticsData;

    const today = new Date();
    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    const generateDailyCaloriesHistory = (days: number, goal: number): DailyCaloriesHistory[] => {
      const history: DailyCaloriesHistory[] = [];
      const now = new Date();
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        const calories = Math.floor(Math.random() * 600) + 1400; // Between 1400 and 2000
        history.push({ date: formatDate(date), calories, goal });
      }
      return history;
    };

    const generateWeightEvolution = (days: number, startWeight: number, trend: 'down' | 'up'): { date: string; weight: number }[] => {
      const evolution: { date: string; weight: number }[] = [];
      let currentWeight = startWeight;
      const now = new Date();
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        evolution.push({ date: formatDate(date), weight: parseFloat(currentWeight.toFixed(1)) });
        if (trend === 'down') {
          currentWeight -= (Math.random() * 0.2 + 0.1); // Lose 0.1 to 0.3 kg
        } else {
          currentWeight += (Math.random() * 0.2 + 0.1); // Gain 0.1 to 0.3 kg
        }
      }
      return evolution;
    };

    const generateAdherenceHistory = (days: number): AdherenceHistoryEntry[] => {
      const history: AdherenceHistoryEntry[] = [];
      const statuses: ('ON_TRACK' | 'AT_RISK' | 'DROPPED' | 'RECOVERED')[] = ['ON_TRACK', 'AT_RISK', 'DROPPED'];
      const now = new Date();
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        history.push({ date: formatDate(date), status: statuses[Math.floor(Math.random() * statuses.length)] });
      }
      return history;
    };

    const generateBehavioralEvents = (): BehavioralEvent[] => {
      const events: BehavioralEvent[] = [];
      const now = new Date();
      const eventDates = [new Date(now), new Date(now)];
      eventDates[0].setDate(now.getDate() - 15);
      eventDates[1].setDate(now.getDate() - 12);

      events.push({ date: formatDate(eventDates[0]), description: 'BehavioralDropDetected' });
      events.push({ date: formatDate(eventDates[1]), description: 'ConsistencyRecovered' });
      return events;
    };


    // Base data for WEIGHT_LOSS
    let avgCalorieIntake = 1698;
    let avgProteinIntake = 107;
    let currentStreak = 5;
    let weightChange = -0.4;
    let weightChangeDirection: 'up' | 'down' | 'none' = 'down';
    let weightChangeStatus: 'positive' | 'negative' | 'neutral' = 'positive'; // For WEIGHT_LOSS, down is positive
    let goalWeight = 64;
    let proteinCompliance: string | undefined = undefined;
    let macroAnalysis: MacroAnalysis[] = [
      { name: 'Protein', consumed: 107, target: 120, colorClass: 'text-orange-500' },
      { name: 'Carbohydrates', consumed: 172, target: 200, colorClass: 'text-teal-500' },
      { name: 'Fat', consumed: 46, target: 55, colorClass: 'text-teal-500' },
      { name: 'Fiber', consumed: 21, target: 25, colorClass: 'text-teal-500' },
    ];

    if (goalType === 'MUSCLE_GAIN') {
      avgCalorieIntake = 2500;
      avgProteinIntake = 145;
      weightChange = 0.3;
      weightChangeDirection = 'up';
      weightChangeStatus = 'positive'; // For MUSCLE_GAIN, up is positive
      goalWeight = 70;
      proteinCompliance = '6/7 days above target';
      macroAnalysis = [
        { name: 'Protein', consumed: 145, target: 120, colorClass: 'text-green-500', isAboveTarget: true },
        { name: 'Carbohydrates', consumed: 250, target: 220, colorClass: 'text-teal-500' },
        { name: 'Fat', consumed: 70, target: 60, colorClass: 'text-teal-500' },
        { name: 'Fiber', consumed: 30, target: 25, colorClass: 'text-teal-500' },
      ];
    }


    switch (period) {
      case '7_DAYS':
        // Reset today for each case to ensure consistent date generation
        const today7 = new Date();
        mockData = {
          period: '7_DAYS',
          averageCalorieIntake: avgCalorieIntake,
          averageProteinIntake: avgProteinIntake,
          currentStreak: currentStreak,
          weightChange: weightChange,
          weightChangeDirection: weightChangeDirection,
          weightChangeStatus: weightChangeStatus,
          dailyCaloriesHistory: [
            { date: formatDate(new Date(today7.setDate(today7.getDate() - 6))), calories: 1820, goal: 1800 },
            { date: formatDate(new Date(today7.setDate(today7.getDate() + 1))), calories: 1650, goal: 1800 },
            { date: formatDate(new Date(today7.setDate(today7.getDate() + 1))), calories: 1900, goal: 1800 },
            { date: formatDate(new Date(today7.setDate(today7.getDate() + 1))), calories: 1780, goal: 1800 },
            { date: formatDate(new Date(today7.setDate(today7.getDate() + 1))), calories: 1340, goal: 1800 },
            { date: formatDate(new Date(today7.setDate(today7.getDate() + 1))), calories: 0, goal: 1800 }, // No data
            { date: formatDate(new Date(today7.setDate(today7.getDate() + 1))), calories: 0, goal: 1800 }, // No data
          ],
          macroAnalysis: macroAnalysis,
          daysWithCompleteLog: [true, true, true, true, true, false, false],
          weightEvolution: generateWeightEvolution(7, goalType === 'WEIGHT_LOSS' ? 67 : 68, goalType === 'WEIGHT_LOSS' ? 'down' : 'up'),
          goalWeight: goalWeight,
          proteinCompliance: proteinCompliance,
        };
        break;

      case '30_DAYS':
        mockData = {
          period: '30_DAYS',
          averageCalorieIntake: avgCalorieIntake - 50, // Slightly different for 30 days
          averageProteinIntake: avgProteinIntake + 5,
          currentStreak: currentStreak + 2,
          weightChange: weightChange * 2,
          weightChangeDirection: weightChangeDirection,
          weightChangeStatus: weightChangeStatus,
          dailyCaloriesHistory: generateDailyCaloriesHistory(30, 1800),
          macroAnalysis: macroAnalysis,
          daysWithCompleteLog: Array(30).fill(true).map((_, i) => i < 25), // Most days complete
          weightEvolution: generateWeightEvolution(30, goalType === 'WEIGHT_LOSS' ? 69 : 65, goalType === 'WEIGHT_LOSS' ? 'down' : 'up'),
          goalWeight: goalWeight,
          adherenceHistory: generateAdherenceHistory(30),
          behavioralEvents: generateBehavioralEvents(),
          proteinCompliance: proteinCompliance,
        };
        break;

      case '90_DAYS':
        mockData = {
          period: '90_DAYS',
          averageCalorieIntake: avgCalorieIntake - 20,
          averageProteinIntake: avgProteinIntake + 2,
          currentStreak: currentStreak + 5,
          weightChange: weightChange * 3,
          weightChangeDirection: weightChangeDirection,
          weightChangeStatus: weightChangeStatus,
          dailyCaloriesHistory: generateDailyCaloriesHistory(90, 1800), // More data points
          macroAnalysis: macroAnalysis,
          daysWithCompleteLog: Array(90).fill(true).map((_, i) => i < 80),
          weightEvolution: generateWeightEvolution(90, goalType === 'WEIGHT_LOSS' ? 72 : 62, goalType === 'WEIGHT_LOSS' ? 'down' : 'up'),
          goalWeight: goalWeight,
          adherenceHistory: generateAdherenceHistory(90),
          behavioralEvents: generateBehavioralEvents(),
          proteinCompliance: proteinCompliance,
        };
        break;

      default:
        console.error('Invalid analytics period for preview data.');
        this._loading.set(false);
        return;
    }

    this._currentAnalyticsData.set(mockData);
    this._loading.set(false);
  }
}
