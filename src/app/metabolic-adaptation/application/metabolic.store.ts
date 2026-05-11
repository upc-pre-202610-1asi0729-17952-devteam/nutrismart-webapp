import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MetabolicApi } from '../infrastructure/metabolic-api';
import { BodyMetric } from '../domain/model/body-metric.entity';
import { BodyComposition } from '../domain/model/body-composition.entity';
import { IamStore } from '../../iam/application/iam.store';
import { UserGoal } from '../../iam/domain/model/user-goal.enum';
import { DomainEventBus } from '../../shared/application/domain-event-bus';
import { WeightLogged } from '../../shared/domain/weight-logged.event';
import { TargetWeightSet } from '../../shared/domain/target-weight-set.event';
import { GoalSwitched } from '../../shared/domain/goal-switched.event';
import { WeightGoalAchieved } from '../../shared/domain/weight-goal-achieved.event';

const STALE_DAYS_THRESHOLD     = 14;
const STAGNATION_WINDOW_DAYS   = 14;
const MIN_GOAL_COMMITMENT_DAYS = 28;

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
  private eventBus = inject(DomainEventBus);

  // ─── Private Signals ──────────────────────────────────────────────────────

  private _currentMetric     = signal<BodyMetric | null>(null);
  private _metricsHistory    = signal<BodyMetric[]>([]);
  private _stagnationHistory = signal<BodyMetric[]>([]);
  private _allHistory        = signal<BodyMetric[]>([]);
  private _composition       = signal<BodyComposition | null>(null);
  private _selectedDays      = signal<7 | 30 | 90>(7);
  private _loading           = signal<boolean>(false);
  private _error             = signal<string | null>(null);

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

  /** All weight entries for the current goal cycle, newest first. */
  readonly allHistory     = this._allHistory.asReadonly();

  // ─── Goal Lock Computeds ──────────────────────────────────────────────────

  /** Days elapsed since the user started the current goal. */
  readonly daysInCurrentGoal = computed(() => {
    const started = this.iamStore.currentUser()?.goalStartedAt;
    if (!started) return MIN_GOAL_COMMITMENT_DAYS;
    const diffMs = Date.now() - new Date(started).getTime();
    return Math.floor(diffMs / 86_400_000);
  });

  /** Days remaining until the commitment lock expires. */
  readonly daysUntilUnlock = computed(() =>
    Math.max(0, MIN_GOAL_COMMITMENT_DAYS - this.daysInCurrentGoal())
  );

  /** True while the user is still inside the 28-day commitment window. */
  readonly isGoalLocked = computed(() => this.daysUntilUnlock() > 0);

  /** ISO date (YYYY-MM-DD) when the current goal commitment expires. */
  readonly unlockDate = computed(() => {
    const started = this.iamStore.currentUser()?.goalStartedAt;
    if (!started) return '';
    const d = new Date(started);
    d.setDate(d.getDate() + MIN_GOAL_COMMITMENT_DAYS);
    return d.toISOString().slice(0, 10);
  });

  // ─── Computed Signals ─────────────────────────────────────────────────────

  readonly isStale = computed(() => this._currentMetric()?.isStale(STALE_DAYS_THRESHOLD) ?? false);

  /** True when the user targets MUSCLE_GAIN. */
  readonly isMuscleGain = computed(() =>
    this.iamStore.currentUser()?.goal === UserGoal.MUSCLE_GAIN
  );

  /**
   * True when the user has logged weight consistently over the last
   * {@link STAGNATION_WINDOW_DAYS} days but shows no progress toward their goal.
   * Requires ≥ 3 entries so a single outlier doesn't trigger a false alarm.
   */
  readonly hasStagnated = computed(() => {
    const history = this._stagnationHistory();
    if (history.length < 3) return false;
    return !history[history.length - 1].isProgressingToward(this.isMuscleGain(), history[0].weightKg);
  });

  /** Last 3 entries from metricsHistory for the Log History table. */
  readonly recentHistory = computed(() => {
    const history = [...this._metricsHistory()].reverse().slice(0, 3);
    return history.map((m, i, arr) => ({
      metric: m,
      delta:  i < arr.length - 1 ? m.calculateDelta(arr[i + 1]) : 0,
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
    const goalStartedAt = user.goalStartedAt || undefined;
    this._loading.set(true);
    this._error.set(null);
    try {
      const metric = await firstValueFrom(this.api.getMetabolicTargets(user.id, goalStartedAt));
      this._currentMetric.set(metric);
      const [history, stagnationHistory] = await Promise.all([
        firstValueFrom(this.api.getMetricsHistory(user.id, 7, goalStartedAt)),
        firstValueFrom(this.api.getMetricsHistory(user.id, STAGNATION_WINDOW_DAYS, goalStartedAt)),
      ]);
      this._metricsHistory.set(history);
      this._stagnationHistory.set(stagnationHistory);
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

    // Capture target before overwriting _currentMetric with the new entry
    // (logWeight API returns a metric without target — target lives on previous snapshot).
    const previousTarget = this._currentMetric()?.targetWeightKg ?? 0;

    this._loading.set(true);
    this._error.set(null);
    try {
      const metric = await firstValueFrom(
        this.api.logWeight(user.id, weightKg, this._currentMetric()?.heightCm ?? user.height),
      );
      this._currentMetric.set(metric);
      this._metricsHistory.update(h => [...h, metric]);
      this.eventBus.publish(new WeightLogged(user.id, weightKg, metric.bmi()));

      // Auto-maintenance: when the user reaches or drops below their WEIGHT_LOSS
      // target, reset the target to their current weight (maintenance mode) and
      // recalculate the projected date to today.
      if (
        user.goal === UserGoal.WEIGHT_LOSS &&
        previousTarget > 0 &&
        weightKg <= previousTarget
      ) {
        await this.setTargetWeight(weightKg);
        this.eventBus.publish(new WeightGoalAchieved(user.id, weightKg));
      }
    } catch {
      this._error.set('body_progress.error_save_failed');
    } finally {
      this._loading.set(false);
    }
  }

  async setTargetWeight(targetWeightKg: number): Promise<void> {
    const user = this.iamStore.currentUser();
    if (!user) return;
    const goalStartedAt = user.goalStartedAt || undefined;
    this._loading.set(true);
    this._error.set(null);
    try {
      // defaultValue: null handles the EMPTY case when no current metric exists yet.
      const metric = await firstValueFrom(
        this.api.setTargetWeight(user.id, targetWeightKg, goalStartedAt),
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
      this.eventBus.publish(new TargetWeightSet(user.id, targetWeightKg, metric.projectedAchievementDate));
    } catch {
      this._error.set('body_progress.error_save_failed');
    } finally {
      this._loading.set(false);
    }
  }

  async loadHistory(days: 7 | 30 | 90): Promise<void> {
    const user = this.iamStore.currentUser();
    if (!user) return;
    const goalStartedAt = user.goalStartedAt || undefined;
    this._selectedDays.set(days);
    this._loading.set(true);
    this._error.set(null);
    try {
      const history = await firstValueFrom(this.api.getMetricsHistory(user.id, days, goalStartedAt));
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
  /**
   * Orchestrates a goal change: persists the new goal to IAM, sets the
   * initial target weight for WEIGHT_LOSS goals, and publishes {@link GoalSwitched}.
   */
  async switchGoal(goal: UserGoal): Promise<void> {
    const user = this.iamStore.currentUser();
    if (!user) return;
    this.iamStore.changeGoal(goal);
    await this.applyInitialTarget(goal);
    this.eventBus.publish(new GoalSwitched(user.id, goal));
  }

  async applyInitialTarget(goal: UserGoal): Promise<void> {
    if (goal === UserGoal.MUSCLE_GAIN) return;
    const user = this.iamStore.currentUser();
    if (!user?.height) return;
    const h      = user.height / 100;
    const target = Math.round(24.9 * h * h * 10) / 10;
    await this.setTargetWeight(target);
  }

  async loadAllHistory(): Promise<void> {
    const user = this.iamStore.currentUser();
    if (!user) return;
    const goalStartedAt = user.goalStartedAt || undefined;
    this._loading.set(true);
    this._error.set(null);
    try {
      const all = await firstValueFrom(this.api.getAllMetricsHistory(user.id, goalStartedAt));
      this._allHistory.set(all);
    } catch {
      this._error.set('body_progress.error_load_failed');
    } finally {
      this._loading.set(false);
    }
  }

}
