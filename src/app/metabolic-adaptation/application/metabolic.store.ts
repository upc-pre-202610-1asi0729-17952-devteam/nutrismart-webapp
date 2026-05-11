import { computed, inject, Injectable, signal } from '@angular/core';
import { MetabolicApi } from '../infrastructure/metabolic-api';
import { BodyMetric } from '../domain/model/body-metric.entity';
import { BodyComposition } from '../domain/model/body-composition.entity';
import { IamStore } from '../../iam/application/iam.store';
import { UserGoal } from '../../iam/domain/model/user-goal.enum';

/**
 * Central state store for the Metabolic Adaptation bounded context.
 *
 * Manages the current body metric snapshot, weight-entry history,
 * body composition, and target weight using Angular Signals. All write
 * operations delegate to {@link MetabolicApi} mock methods and update
 * signals reactively.
 *
 * Provided in root so a single instance is shared across the application.
 *
 * @author Espinoza Cruz, Angela Milagros
 */
@Injectable({ providedIn: 'root' })
export class MetabolicStore {
  private api      = inject(MetabolicApi);
  private iamStore = inject(IamStore);

  // ─── Private Signals ──────────────────────────────────────────────────────

  private _currentMetric  = signal<BodyMetric | null>(null);
  private _metricsHistory = signal<BodyMetric[]>([]);
  private _composition    = signal<BodyComposition | null>(null);
  private _selectedDays   = signal<7 | 30 | 90>(7);
  private _loading        = signal<boolean>(false);
  private _error          = signal<string | null>(null);

  /**
   * Session goal set directly by {@link GoalSelectionScreen} before navigation.
   *
   * IamStore.changeGoal() mutates the User object in place and then calls
   * signal.set() with the SAME reference. Angular signals use Object.is()
   * equality, so same-reference sets do NOT notify computed subscribers —
   * isMuscleGain() would always return the stale cached value.
   *
   * This signal holds a fresh primitive value (UserGoal string) so Angular
   * always detects the change and re-evaluates isMuscleGain() correctly.
   */
  private _sessionGoal = signal<UserGoal | null>(null);

  // ─── Public Read-only Signals ─────────────────────────────────────────────

  /** Current weight/height/BMI/BMR/TDEE metric snapshot. */
  readonly currentMetric  = this._currentMetric.asReadonly();

  /** Weight entries for the selected date range (used by the chart). */
  readonly metricsHistory = this._metricsHistory.asReadonly();

  /** Most recent body composition measurement. */
  readonly composition    = this._composition.asReadonly();

  /** Currently selected date range (7, 30, or 90 days). */
  readonly selectedDays   = this._selectedDays.asReadonly();

  /** Whether an async operation is in flight. */
  readonly loading        = this._loading.asReadonly();

  /** Last error message, or null. */
  readonly error          = this._error.asReadonly();

  // ─── Computed Signals ─────────────────────────────────────────────────────

  /** True when the last weight entry is older than 14 days (no-data banner). */
  readonly isStale = computed(() => this._currentMetric()?.isStale(14) ?? false);

  /**
   * True when the user has logged weight in the current history window but the
   * trend shows no progress toward their goal (StagnationDetected domain event).
   *
   * Requires ≥ 3 entries so a single outlier doesn't trigger a false alarm.
   * Only active when isStale() is false (user IS logging but not progressing).
   */
  readonly hasStagnated = computed(() => {
    const history = this._metricsHistory();
    if (history.length < 3) return false;
    const first = history[0].weightKg;
    const last  = history[history.length - 1].weightKg;
    return this.isMuscleGain() ? last <= first : last >= first;
  });

  /**
   * Whether the current session targets MUSCLE_GAIN.
   *
   * Reads _sessionGoal first (set by GoalSelectionScreen via a fresh primitive
   * signal), falling back to iamStore when no session override is active.
   * This two-tier approach is required because IamStore.changeGoal() mutates
   * its User object in place, preventing Angular's same-reference signal
   * equality check from ever notifying this computed.
   */
  readonly isMuscleGain = computed(() => {
    const session = this._sessionGoal();
    if (session !== null) return session === UserGoal.MUSCLE_GAIN;
    return this.iamStore.currentUser()?.goal === UserGoal.MUSCLE_GAIN;
  });

  /** Last 3 entries from metricsHistory for the Log History table. */
  readonly recentHistory = computed(() => {
    const history = [...this._metricsHistory()].reverse().slice(0, 3);
    return history.map((m, i, arr) => ({
      metric: m,
      delta: i < arr.length - 1
        ? Math.round((m.weightKg - arr[i + 1].weightKg) * 10) / 10
        : 0,
    }));
  });

  /** SVG chart points derived from metricsHistory (normalised to 0-100 range). */
  readonly chartPoints = computed(() => {
    const history = this._metricsHistory();
    if (history.length < 2) return { points: '', minW: 0, maxW: 0, dates: [] as string[], targetY: 0 };

    const weights = history.map(m => m.weightKg);
    const rawMin  = Math.min(...weights);
    const rawMax  = Math.max(...weights);
    const range   = rawMax - rawMin;
    const pad     = Math.max(range * 0.025, 0.5);
    const minW    = rawMin - pad;
    const maxW    = rawMax + pad;
    const chartH  = 120;
    const chartW  = 560;

    const toY = (w: number) =>
      Math.round(chartH - ((w - minW) / (maxW - minW)) * chartH);

    const points = history
      .map((m, i) => {
        const x = Math.round((i / (history.length - 1)) * chartW);
        const y = toY(m.weightKg);
        return `${x},${y}`;
      })
      .join(' ');

    const target  = this._currentMetric()?.targetWeightKg ?? 0;
    const targetY = target > 0 ? toY(target) : chartH;

    // Return raw ISO dates — the component formats them using the current UI locale.
    const dates = [history[0], history[Math.floor(history.length / 2)], history[history.length - 1]]
      .map(m => m.loggedAt);

    return { points, minW, maxW, dates, targetY };
  });

  // ─── Actions ──────────────────────────────────────────────────────────────

  /**
   * Loads the initial metric snapshot and default 7-day history.
   *
   * @returns Promise that resolves once all data is loaded.
   */
  async initialise(): Promise<void> {
    const user = this.iamStore.currentUser();
    if (!user) return;
    this._loading.set(true);
    this._error.set(null);

    await new Promise<void>(resolve => {
      this.api.getMetabolicTargets(user.id).subscribe(metric => {
        this._currentMetric.set(metric);
        resolve();
      });
    });

    await new Promise<void>(resolve => {
      this.api.getMetricsHistory(user.id, 7).subscribe(history => {
        this._metricsHistory.set(history);
        resolve();
      });
    });

    if (this.isMuscleGain()) {
      this._composition.set(new BodyComposition({
        id: 1, userId: user.id,
        waistCm: 82, neckCm: 37,
        heightCm: user.height, weightKg: user.weight,
        measuredAt: new Date().toISOString(),
        previousBodyFatPercent: 13.0,
      }));
    }

    this._loading.set(false);
  }

  /**
   * Records a new weight entry and updates the current metric reactively.
   *
   * Triggers BodyMetricLogged domain event implicitly via signal update.
   *
   * @param weightKg - New weight in kilograms.
   * @returns Promise that resolves when the entry is saved.
   */
  async logWeight(weightKg: number): Promise<void> {
    const user = this.iamStore.currentUser();
    if (!user) return;
    this._loading.set(true);
    await new Promise<void>(resolve => {
      this.api.logWeight(user.id, weightKg, this._currentMetric()?.heightCm ?? user.height)
        .subscribe(metric => {
          this._currentMetric.set(metric);
          this._metricsHistory.update(h => [...h, metric]);
          this._loading.set(false);
          resolve();
        });
    });
  }

  /**
   * Updates the user's height and triggers BMI recalculation via signal update.
   *
   * @param heightCm - New height in centimetres.
   * @returns Promise that resolves when the update is complete.
   */
  async updateHeight(heightCm: number): Promise<void> {
    const user = this.iamStore.currentUser();
    if (!user) return;
    this._loading.set(true);
    await new Promise<void>(resolve => {
      this.api.updateHeight(user.id, heightCm, this._currentMetric()?.weightKg ?? user.weight)
        .subscribe(metric => {
          this._currentMetric.set(metric);
          this._loading.set(false);
          resolve();
        });
    });
  }

  /**
   * Sets the target weight and updates the projected achievement date.
   *
   * @param targetWeightKg - Target weight in kilograms.
   * @returns Promise that resolves when the target is saved.
   */
  async setTargetWeight(targetWeightKg: number): Promise<void> {
    const user = this.iamStore.currentUser();
    if (!user) return;
    this._loading.set(true);
    await new Promise<void>(resolve => {
      this.api.setTargetWeight(user.id, targetWeightKg).subscribe(metric => {
        // Create a new BodyMetric instance so Angular signals detect the reference
        // change and re-evaluate all dependent computeds (formattedProjectedDate, etc.).
        this._currentMetric.update(current => {
          if (!current) return metric;
          return new BodyMetric({
            id:                       current.id,
            userId:                   current.userId,
            weightKg:                 current.weightKg,
            heightCm:                 current.heightCm,
            loggedAt:                 current.loggedAt,
            targetWeightKg:           metric.targetWeightKg,
            projectedAchievementDate: metric.projectedAchievementDate,
          });
        });
        this._loading.set(false);
        resolve();
      });
    });
  }

  /**
   * Reloads the weight history for the given date range and updates the chart.
   *
   * @param days - Date range in days: 7, 30, or 90.
   * @returns Promise that resolves when history is loaded.
   */
  async loadHistory(days: 7 | 30 | 90): Promise<void> {
    const user = this.iamStore.currentUser();
    if (!user) return;
    this._selectedDays.set(days);
    this._loading.set(true);
    await new Promise<void>(resolve => {
      this.api.getMetricsHistory(user.id, days).subscribe(history => {
        this._metricsHistory.set(history);
        this._loading.set(false);
        resolve();
      });
    });
  }

  /**
   * Updates body composition measurements and recalculates body fat %.
   *
   * @param waistCm - Waist circumference in centimetres.
   * @param neckCm  - Neck circumference in centimetres.
   * @returns Promise that resolves when composition is updated.
   */
  async updateBodyComposition(waistCm: number, neckCm: number): Promise<void> {
    const user   = this.iamStore.currentUser();
    const metric = this._currentMetric();
    if (!user || !metric) return;
    this._loading.set(true);
    await new Promise<void>(resolve => {
      this.api.updateBodyComposition(
        user.id, waistCm, neckCm, metric.weightKg, metric.heightCm,
      ).subscribe(comp => {
        this._composition.set(comp);
        this._loading.set(false);
        resolve();
      });
    });
  }

  /**
   * Stores the goal chosen on {@link GoalSelectionScreen} so that
   * {@link isMuscleGain} reacts immediately, bypassing the IamStore
   * same-reference signal issue.
   *
   * Call this BEFORE navigating to /body-progress/progress so that
   * {@link initialise} sees the correct goal when the view mounts.
   *
   * @param goal - The goal the user selected.
   */
  setSessionGoal(goal: UserGoal): void {
    this._sessionGoal.set(goal);
  }
}
