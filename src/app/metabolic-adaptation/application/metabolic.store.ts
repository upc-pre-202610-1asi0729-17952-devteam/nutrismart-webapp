import { computed, inject, Injectable, signal } from '@angular/core';
import { filter, firstValueFrom } from 'rxjs';
import { DomainEventBus } from '../../shared/application/domain-event-bus';
import { MetabolicTargetSet } from '../../shared/domain/metabolic-target-set.event';
import { OnboardingCompleted } from '../../shared/domain/onboarding-completed.event';
import { ProfileUpdated } from '../../shared/domain/profile-updated.event';
import { GoalSwitched } from '../../shared/domain/goal-switched.event';
import { StagnationDetected } from '../../shared/domain/stagnation-detected.event';
import { WeightLogged } from '../../shared/domain/weight-logged.event';
import { TargetWeightSet } from '../../shared/domain/target-weight-set.event';
import { WeightGoalAchieved } from '../../shared/domain/weight-goal-achieved.event';
import { IamStore } from '../../iam/application/iam.store';
import { UserGoal } from '../../iam/domain/model/user-goal.enum';
import { MetabolicTargets } from '../../iam/domain/model/metabolic-targets.value-object';
import { MetabolicApi } from '../infrastructure/metabolic-api';
import { BodyMetric } from '../domain/model/body-metric.entity';
import { BodyComposition } from '../domain/model/body-composition.entity';
import { NutritionPlan } from '../domain/model/nutrition-plan.entity';

const STAGNATION_WINDOW_DAYS   = 14;
const MIN_GOAL_COMMITMENT_DAYS = 28;
const STALE_DAYS_THRESHOLD     = 14;

const PHYSICAL_FIELDS = new Set(['weight', 'height', 'activityLevel']);

/**
 * Central state store for the Metabolic Adaptation bounded context.
 *
 * Owns target computation: subscribes to {@link OnboardingCompleted} and
 * {@link ProfileUpdated} (physical-field changes) to recalculate macro targets
 * via {@link MetabolicTargets}, then publishes {@link MetabolicTargetSet} so
 * IAM and NutritionTracking can sync their projections.
 *
 * Provided in root so a single instance is shared across the application.
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
  private _nutritionPlan     = signal<NutritionPlan | null>(null);
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

  /** Active nutrition plan (in-memory; recomputed on every target change). */
  readonly nutritionPlan  = this._nutritionPlan.asReadonly();

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
    Math.max(0, MIN_GOAL_COMMITMENT_DAYS - this.daysInCurrentGoal()),
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
    this.iamStore.currentUser()?.goal === UserGoal.MUSCLE_GAIN,
  );

  /** True when the user has already logged a weight entry for today. */
  readonly hasLoggedToday = computed(() => {
    const todayStr = new Date().toDateString();
    return this._metricsHistory().some(m => new Date(m.loggedAt).toDateString() === todayStr);
  });

  /**
   * True when the user has logged weight consistently over the last
   * {@link STAGNATION_WINDOW_DAYS} days but shows no progress toward their goal.
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

  /** SVG chart points derived from metricsHistory (normalised to 0–100 range). */
  readonly chartPoints = computed(() => {
    const history = this._metricsHistory();
    if (history.length < 2) return { points: '', minW: 0, maxW: 0, dates: [] as string[], targetY: 0 };

    const weights    = history.map(m => m.weightKg);
    const target     = this._currentMetric()?.targetWeightKg ?? 0;
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
        return `${x},${toY(m.weightKg)}`;
      })
      .join(' ');

    const targetY = target > 0 ? toY(target) : chartH;
    const dates   = [history[0], history[Math.floor(history.length / 2)], history[history.length - 1]]
      .map(m => m.loggedAt);

    return { points, minW, maxW, dates, targetY };
  });

  // ─── Cross-context subscriptions ──────────────────────────────────────────

  constructor() {
    this.subscribeToOnboardingCompleted();
    this.subscribeToProfileUpdated();
  }

  /**
   * Reacts to {@link OnboardingCompleted}: calculates initial targets and
   * publishes {@link MetabolicTargetSet}.
   */
  private subscribeToOnboardingCompleted(): void {
    this.eventBus.events$
      .pipe(filter((e): e is OnboardingCompleted => e instanceof OnboardingCompleted))
      .subscribe((e) => {
        const targets = MetabolicTargets.calculate(e.weight, e.height, e.activityLevel, e.goal);
        this.publishMetabolicTargetSet(e.userId, targets);
      });
  }

  /**
   * Reacts to {@link ProfileUpdated}: recalculates targets when physical
   * fields (weight, height, activityLevel) are included in the change.
   */
  private subscribeToProfileUpdated(): void {
    this.eventBus.events$
      .pipe(
        filter((e): e is ProfileUpdated => e instanceof ProfileUpdated),
        filter((e) => e.updatedFields.some(f => PHYSICAL_FIELDS.has(f))),
      )
      .subscribe(() => {
        const user      = this.iamStore.currentUser();
        if (!user) return;
        const leanMass  = this._composition()?.leanMassKg();
        const targets   = MetabolicTargets.calculate(user.weight, user.height, user.activityLevel, user.goal, leanMass);
        this.publishMetabolicTargetSet(user.id, targets);
      });
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  /**
   * Publishes {@link MetabolicTargetSet} and updates the in-memory
   * {@link NutritionPlan} signal so the UI reflects the new targets immediately.
   */
  private publishMetabolicTargetSet(userId: number, targets: MetabolicTargets): void {
    const event = new MetabolicTargetSet(
      userId,
      targets.dailyCalorieTarget,
      targets.proteinTarget,
      targets.carbsTarget,
      targets.fatTarget,
      targets.fiberTarget,
    );
    this.eventBus.publish(event);
    this._nutritionPlan.set(NutritionPlan.fromTargets(userId, targets));
  }

  /** Publishes {@link StagnationDetected} when the stagnation window is full. */
  private checkAndPublishStagnation(): void {
    if (!this.hasStagnated()) return;
    const user   = this.iamStore.currentUser();
    const metric = this._currentMetric();
    if (!user || !metric) return;
    this.eventBus.publish(
      new StagnationDetected(user.id, STAGNATION_WINDOW_DAYS, metric.weightKg, user.goal),
    );
  }

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

      this.checkAndPublishStagnation();

      const current = this._currentMetric();
      if (
        current &&
        user.goal === UserGoal.WEIGHT_LOSS &&
        current.targetWeightKg > 0 &&
        current.weightKg <= current.targetWeightKg
      ) {
        await this.setTargetWeight(current.weightKg);
        this.eventBus.publish(new WeightGoalAchieved(user.id, current.weightKg));
      }

      // Materialise the in-memory plan from the user's stored targets.
      this._nutritionPlan.set(NutritionPlan.fromTargets(user.id, {
        dailyCalorieTarget: user.dailyCalorieTarget,
        proteinTarget:      user.proteinTarget,
        carbsTarget:        user.carbsTarget,
        fatTarget:          user.fatTarget,
        fiberTarget:        user.fiberTarget,
      }));
    } catch {
      this._error.set('body_progress.error_load_failed');
    } finally {
      this._loading.set(false);
    }
  }

  async logWeight(weightKg: number): Promise<void> {
    const user = this.iamStore.currentUser();
    if (!user) return;

    const previousTarget = this._currentMetric()?.targetWeightKg ?? 0;
    const todayStr       = new Date().toDateString();
    const todayEntry     = this._metricsHistory()
      .find(m => new Date(m.loggedAt).toDateString() === todayStr);

    this._loading.set(true);
    this._error.set(null);
    try {
      let metric: BodyMetric;
      if (todayEntry) {
        metric = await firstValueFrom(this.api.updateWeight(todayEntry, weightKg));
        this._metricsHistory.update(h => h.map(m => m.id === todayEntry.id ? metric : m));
        this._stagnationHistory.update(h => h.map(m => m.id === todayEntry.id ? metric : m));
      } else {
        metric = await firstValueFrom(
          this.api.logWeight(user.id, weightKg, this._currentMetric()?.heightCm ?? user.height),
        );
        this._metricsHistory.update(h => [...h, metric]);
        this._stagnationHistory.update(h => [...h, metric]);
      }
      this._currentMetric.set(metric);
      this.iamStore.updateWeightOnly(weightKg);
      this.eventBus.publish(new WeightLogged(user.id, weightKg, metric.bmi()));
      this.checkAndPublishStagnation();

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
      const metric = await firstValueFrom(
        this.api.setTargetWeight(user.id, targetWeightKg, goalStartedAt),
        { defaultValue: null },
      );
      if (!metric) return;
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
      this.recalculateForGoal(user.goal, comp.leanMassKg());
    } catch {
      this._error.set('body_progress.error_save_failed');
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Orchestrates a goal change: persists the new goal to IAM, sets the
   * initial target weight for WEIGHT_LOSS goals, recalculates targets, and
   * publishes {@link GoalSwitched} and {@link MetabolicTargetSet}.
   *
   * @param goal - The goal the user confirmed.
   */
  async switchGoal(goal: UserGoal): Promise<void> {
    const user = this.iamStore.currentUser();
    if (!user) return;
    this.iamStore.changeGoal(goal);
    await this.applyInitialTarget(goal);
    const updated = this.iamStore.currentUser()!;
    const targets = MetabolicTargets.calculate(updated.weight, updated.height, updated.activityLevel, goal);
    this.publishMetabolicTargetSet(updated.id, targets);
    this.eventBus.publish(new GoalSwitched(updated.id, goal));
  }

  /**
   * Recalculates macro targets for the given goal using the current user's
   * physical data and publishes {@link MetabolicTargetSet}.
   *
   * Uses Katch-McArdle when `leanMassKg` is supplied; falls back to
   * Mifflin-St Jeor otherwise.
   *
   * Used during onboarding when the goal or body composition changes.
   */
  recalculateForGoal(goal: UserGoal, leanMassKg?: number): void {
    const user = this.iamStore.currentUser();
    if (!user) return;
    const targets = MetabolicTargets.calculate(user.weight, user.height, user.activityLevel, goal, leanMassKg);
    this.publishMetabolicTargetSet(user.id, targets);
  }

  async applyInitialTarget(goal: UserGoal): Promise<void> {
    if (goal === UserGoal.MUSCLE_GAIN) return;
    const user = this.iamStore.currentUser();
    if (!user?.height) return;
    const h      = user.height / 100;
    const target = Math.round(24.9 * h * h * 10) / 10;
    await this.setTargetWeight(target);
  }

  async updateWeight(metric: BodyMetric, newWeightKg: number): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      const updated = await firstValueFrom(this.api.updateWeight(metric, newWeightKg));
      this._metricsHistory.update(h => h.map(m => m.id === metric.id ? updated : m));
      this._stagnationHistory.update(h => h.map(m => m.id === metric.id ? updated : m));
      if (this._currentMetric()?.id === metric.id) {
        this._currentMetric.set(updated);
      }
    } catch {
      this._error.set('body_progress.error_save_failed');
    } finally {
      this._loading.set(false);
    }
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
