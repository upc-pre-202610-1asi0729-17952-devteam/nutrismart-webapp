import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MetabolicApi } from '../infrastructure/metabolic-api';
import { BodyMetric } from '../domain/model/body-metric.entity';
import { BodyComposition } from '../domain/model/body-composition.entity';
import { IamStore } from '../../iam/application/iam.store';
import { UserGoal } from '../../iam/domain/model/user-goal.enum';

const STALE_DAYS_THRESHOLD = 14;

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

  readonly isStale = computed(() => this._currentMetric()?.isStale(STALE_DAYS_THRESHOLD) ?? false);

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
    const target  = this._currentMetric()?.targetWeightKg ?? 0;

    // Include the goal weight in the Y scale so the reference line always
    // stays within the chart area even when the target is far from current weight.
    const allWeights = target > 0 ? [...weights, target] : weights;
    const rawMin     = Math.min(...allWeights);
    const rawMax     = Math.max(...allWeights);
    const range      = rawMax - rawMin;
    const pad        = Math.max(range * 0.025, 0.5);
    const minW       = rawMin - pad;
    const maxW       = rawMax + pad;
    const chartH     = 120;
    const chartW     = 780;

    const toY = (w: number) =>
      Math.round(chartH - ((w - minW) / (maxW - minW)) * chartH);

    const points = history
      .map((m, i) => {
        const x = Math.round((i / (history.length - 1)) * chartW);
        const y = toY(m.weightKg);
        return `${x},${y}`;
      })
      .join(' ');

    const targetY = target > 0 ? toY(target) : chartH;

    // Return raw ISO dates — the component formats them using the current UI locale.
    const dates = [history[0], history[Math.floor(history.length / 2)], history[history.length - 1]]
      .map(m => m.loggedAt);

    return { points, minW, maxW, dates, targetY };
  });

  // ─── Actions ──────────────────────────────────────────────────────────────

  async initialise(): Promise<void> {
    const user = this.iamStore.currentUser();
    if (!user) return;
    this._loading.set(true);
    this._error.set(null);
    try {
      const metric = await firstValueFrom(this.api.getMetabolicTargets(user.id));
      this._currentMetric.set(metric);
      const history = await firstValueFrom(this.api.getMetricsHistory(user.id, 7));
      this._metricsHistory.set(history);
      if (this.isMuscleGain()) {
        const comp = await firstValueFrom(this.api.getComposition(user.id));
        this._composition.set(comp);
      }
    } catch {
      this._error.set('body_progress.error_load_failed');
    } finally {
      this._loading.set(false);
    }
  }

  async logWeight(weightKg: number): Promise<void> {
    const user = this.iamStore.currentUser();
    if (!user) return;
    this._loading.set(true);
    this._error.set(null);
    try {
      const metric = await firstValueFrom(
        this.api.logWeight(user.id, weightKg, this._currentMetric()?.heightCm ?? user.height),
      );
      this._currentMetric.set(metric);
      this._metricsHistory.update(h => [...h, metric]);
    } catch {
      this._error.set('body_progress.error_save_failed');
    } finally {
      this._loading.set(false);
    }
  }

  async updateHeight(heightCm: number): Promise<void> {
    const user = this.iamStore.currentUser();
    if (!user) return;
    this._loading.set(true);
    this._error.set(null);
    try {
      const metric = await firstValueFrom(
        this.api.updateHeight(user.id, heightCm, this._currentMetric()?.weightKg ?? user.weight),
      );
      this._currentMetric.set(metric);
    } catch {
      this._error.set('body_progress.error_save_failed');
    } finally {
      this._loading.set(false);
    }
  }

  async setTargetWeight(targetWeightKg: number): Promise<void> {
    const user = this.iamStore.currentUser();
    if (!user) return;
    this._loading.set(true);
    this._error.set(null);
    try {
      // defaultValue: null handles the EMPTY case when no current metric exists yet.
      const metric = await firstValueFrom(
        this.api.setTargetWeight(user.id, targetWeightKg),
        { defaultValue: null },
      );
      if (!metric) return;
      // New instance forces Angular signal equality check to detect the change
      // and re-evaluate dependents (formattedProjectedDate, chartPoints, etc.).
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
    } catch {
      this._error.set('body_progress.error_save_failed');
    } finally {
      this._loading.set(false);
    }
  }

  async loadHistory(days: 7 | 30 | 90): Promise<void> {
    const user = this.iamStore.currentUser();
    if (!user) return;
    this._selectedDays.set(days);
    this._loading.set(true);
    this._error.set(null);
    try {
      const history = await firstValueFrom(this.api.getMetricsHistory(user.id, days));
      this._metricsHistory.set(history);
    } catch {
      this._error.set('body_progress.error_load_failed');
    } finally {
      this._loading.set(false);
    }
  }

  async setComposition(waistCm?: number, overrideBodyFatPercent?: number): Promise<void> {
    const user   = this.iamStore.currentUser();
    const metric = this._currentMetric();
    if (!user) return;
    const weightKg = metric?.weightKg ?? user.weight;
    const heightCm = metric?.heightCm ?? user.height;
    this._loading.set(true);
    this._error.set(null);
    try {
      const comp = await firstValueFrom(
        this.api.setComposition(user.id, weightKg, heightCm, waistCm, overrideBodyFatPercent),
      );
      this._composition.set(comp);
    } catch {
      this._error.set('body_progress.error_save_failed');
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Auto-calculates and persists the initial target weight when the user sets
   * or changes their goal on {@link GoalSelectionScreen}.
   *
   * - WEIGHT_LOSS: target = weight at BMI 24.9 (top of the WHO normal range),
   *   computed from the user's stored height.
   * - MUSCLE_GAIN: no target weight concept applies — skipped entirely.
   *
   * Always overwrites any previous target so that switching goals produces a
   * fresh, contextually meaningful suggestion the user can then override inline.
   *
   * @param goal - The goal the user confirmed.
   */
  async applyInitialTarget(goal: UserGoal): Promise<void> {
    if (goal === UserGoal.MUSCLE_GAIN) return;
    const user = this.iamStore.currentUser();
    if (!user?.height) return;
    const h      = user.height / 100;
    const target = Math.round(24.9 * h * h * 10) / 10;
    await this.setTargetWeight(target);
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
