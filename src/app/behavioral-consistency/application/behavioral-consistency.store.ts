import { computed, inject, Injectable, signal } from '@angular/core';
import { filter, firstValueFrom, Observable } from 'rxjs';
import { AdherenceStatus } from '../domain/model/adherence-status.enum';
import {
  BehavioralProgress,
  BehavioralProgressProps,
} from '../domain/model/behavioral-progress.entity';
import { EatingBehaviorPattern } from '../domain/model/eating-behavior-pattern.entity';
import { BehaviorPatternType } from '../domain/model/behavior-pattern-type.enum';
import { BehaviorPatternAnalyzed } from '../domain/events/behavior-pattern-analyzed.event';
import { AdherenceDropTrigger } from '../domain/model/adherence-drop-trigger.enum';
import { RecoveryPlan } from '../domain/model/recovery-plan.entity';
import { RecoveryPlanActivated } from '../domain/events/recovery-plan-activated.event';
import { RecoveryPlanCompleted } from '../domain/events/recovery-plan-completed.event';
import { BehavioralConsistencyApi } from '../infrastructure/behavioral-consistency-api';
import { EatingBehaviorPatternApi } from '../infrastructure/eating-behavior-pattern-api';
import { RecoveryPlanApi } from '../infrastructure/recovery-plan-api';
import { DomainEventBus } from '../../shared/application/domain-event-bus';
import { BehavioralDropDetected } from '../../shared/domain/behavioral-drop-detected.event';
import { ConsistencyRecovered } from '../../shared/domain/consistency-recovered.event';
import { NutritionalAbandonmentRisk } from '../../shared/domain/nutritional-abandonment-risk.event';
import { StreakMilestoneReached } from '../../shared/domain/streak-milestone-reached.event';
import { StrategyMismatchDetected } from '../../shared/domain/strategy-mismatch-detected.event';
import { DailyGoalMet } from '../../shared/domain/daily-goal-met.event';
import { MetabolicTargetSet } from '../../shared/domain/metabolic-target-set.event';
import { MealSkipped } from '../../shared/domain/meal-skipped.event';
import { RestrictedItemBlocked } from '../../shared/domain/restricted-item-blocked.event';

/**
 * Central state store for the Behavioral Consistency bounded context.
 *
 * Manages the current user's behavioral progress using Angular signals.
 * All mutations are persisted to the backend via {@link BehavioralConsistencyApi}.
 *
 * Provided in root so a single instance is shared across the application.
 */
@Injectable({ providedIn: 'root' })
export class BehavioralConsistencyStore {
  private behavioralConsistencyApi  = inject(BehavioralConsistencyApi);
  private eatingBehaviorPatternApi  = inject(EatingBehaviorPatternApi);
  private recoveryPlanApi           = inject(RecoveryPlanApi);
  private eventBus                  = inject(DomainEventBus);

  constructor() {
    this.subscribeToDailyGoalMet();
    this.subscribeToMetabolicTargetSet();
    this.subscribeToBehavioralDropEvents();
    this.subscribeToConsistencyRecovered();
    this.subscribeToMealSkipped();
    this.subscribeToRestrictedItemBlocked();
  }

  /** Current behavioral progress for the active user, or `null` if not loaded. */
  private _currentProgress = signal<BehavioralProgress | null>(null);

  /** Latest eating behavior pattern for the active user, or `null` if not analysed yet. */
  private _currentPattern = signal<EatingBehaviorPattern | null>(null);

  /** Active adherence recovery plan, or `null` when the user is on track. */
  private _activeRecoveryPlan = signal<RecoveryPlan | null>(null);

  /** Whether an async operation is in flight. */
  private _loading = signal<boolean>(false);

  /** Last error message from a failed async operation, or `null`. */
  private _error = signal<string | null>(null);

  // ─── Public readonly signals ───────────────────────────────────────────────

  /** Read-only signal exposing the current {@link BehavioralProgress}. */
  readonly currentProgress = this._currentProgress.asReadonly();

  /** Read-only signal exposing the latest {@link EatingBehaviorPattern}, or `null`. */
  readonly currentPattern = this._currentPattern.asReadonly();

  /** Read-only signal exposing the current active {@link RecoveryPlan}, or `null`. */
  readonly activeRecoveryPlan = this._activeRecoveryPlan.asReadonly();

  /** Read-only signal indicating whether an async operation is in progress. */
  readonly loading = this._loading.asReadonly();

  /** Read-only signal holding the most recent error message, or `null`. */
  readonly error = this._error.asReadonly();

  /** Classified pattern type, or `null` if no analysis has run yet. */
  readonly patternType = computed(() =>
    this._currentPattern()?.patternType ?? null,
  );

  /** Whether the current pattern shows positive momentum. */
  readonly isPatternImproving = computed(() =>
    this._currentPattern()?.isImproving() ?? false,
  );

  /** Whether the current pattern is in active decline. */
  readonly isPatternDeclining = computed(() =>
    this._currentPattern()?.isDeclining() ?? false,
  );

  /** Current behavioral adherence status, or `null` if progress is not loaded. */
  readonly adherenceStatus = computed(() =>
    this._currentProgress()?.adherenceStatus ?? null
  );

  /** Current streak, or 0 if progress is not loaded. */
  readonly streak = computed(() =>
    this._currentProgress()?.streak ?? 0
  );

  /** Current consecutive misses, or 0 if progress is not loaded. */
  readonly consecutiveMisses = computed(() =>
    this._currentProgress()?.consecutiveMisses ?? 0
  );

  /** Weekly completion flags, or an empty array if progress is not loaded. */
  readonly weekDots = computed(() =>
    this._currentProgress()?.weekDots ?? []
  );

  /** Number of completed days in the current weekly view. */
  readonly completedDaysThisWeek = computed(() =>
    this._currentProgress()?.completedDaysThisWeek ?? 0
  );

  /** Weekly completion rate from 0 to 100. */
  readonly weeklyCompletionRate = computed(() =>
    this._currentProgress()?.weeklyCompletionRate ?? 0
  );

  /** Whether the user is currently on track. */
  readonly isOnTrack = computed(() =>
    this._currentProgress()?.isOnTrack() ?? false
  );

  /** Whether the user needs behavioral re-engagement. */
  readonly needsReEngagement = computed(() =>
    this._currentProgress()?.needsReEngagement() ?? false
  );

  /** Compact summary of the current behavioral progress. */
  readonly behavioralSummary = computed(() =>
    this._currentProgress()?.behavioralSummary() ?? 'No behavioral progress loaded'
  );

  // ─── Loading / initialization ──────────────────────────────────────────────

  /**
   * Loads the behavioral progress for a user, creating an initial record
   * if no progress exists yet.
   *
   * Useful for newly registered users that do not have `/behavioral-progress`
   * data in the backend.
   *
   * @param userId - Numeric identifier of the user.
   * @returns Observable emitting the existing or newly created progress.
   */
  ensureProgressForUser(userId: number): Observable<BehavioralProgress> {
    this._loading.set(true);
    this._error.set(null);

    return new Observable<BehavioralProgress>(observer => {
      this.behavioralConsistencyApi.getBehavioralProgressByUserId(userId).subscribe({
        next: existing => {
          if (existing) {
            this._currentProgress.set(existing);
            this._loading.set(false);
            observer.next(existing);
            observer.complete();
            return;
          }

          const initialProgress = this.createInitialProgress(userId);

          this.behavioralConsistencyApi.createBehavioralProgress(initialProgress).subscribe({
            next: created => {
              this._currentProgress.set(created);
              this._loading.set(false);
              observer.next(created);
              observer.complete();
            },
            error: err => {
              this._loading.set(false);
              this._error.set(err.message);
              observer.error(err);
            },
          });
        },
        error: err => {
          this._loading.set(false);
          this._error.set(err.message);
          observer.error(err);
        },
      });
    });
  }

  /**
   * Clears the currently loaded behavioral progress from memory.
   *
   * Does not delete anything from the backend.
   */
  clear(): void {
    this._currentProgress.set(null);
    this._error.set(null);
    this._loading.set(false);
  }

  // ─── Behavioral mutations ─────────────────────────────────────────────────

  /**
   * Marks today's behavioral goal as completed and persists the change.
   *
   * @param date - Goal completion date in ISO format. Defaults to today.
   */
  markGoalMet(date: string = this.todayIsoDate()): void {
    const progress = this._currentProgress();
    if (!progress) return;

    if (progress.lastGoalMetDate === date) return;

    const prevStreak    = progress.streak;
    const wasDegraded   = progress.adherenceStatus !== AdherenceStatus.ON_TRACK;
    const prevMilestone = progress.nextStreakMilestone;

    progress.markGoalMet(date);
    this._currentProgress.set(progress);
    this.persist();

    if (wasDegraded && progress.isOnTrack()) {
      this.eventBus.publish(new ConsistencyRecovered(progress.userId));
    }

    if (progress.streak >= prevMilestone && prevStreak < prevMilestone) {
      const milestone = this.clampMilestone(prevMilestone);
      this.eventBus.publish(new StreakMilestoneReached(progress.userId, progress.streak, milestone));
    }

    void this.analyzePattern(progress.userId);
  }

  markGoalMissed(): void {
    const progress = this._currentProgress();
    if (!progress) return;

    progress.markGoalMissed();
    this._currentProgress.set(progress);
    this.persist();

    if (progress.consecutiveMisses >= 7) {
      this.eventBus.publish(new NutritionalAbandonmentRisk(progress.userId, progress.consecutiveMisses));
    } else if (progress.consecutiveMisses >= 3) {
      this.eventBus.publish(new BehavioralDropDetected(progress.userId, progress.consecutiveMisses));
    }

    void this.analyzePattern(progress.userId);
  }

  /**
   * Manually sets the adherence status and persists the change.
   *
   * Prefer using `markGoalMet`, `markGoalMissed`, or
   * `recalculateAdherenceStatus` when possible.
   *
   * @param status - New adherence status.
   */
  setAdherenceStatus(status: AdherenceStatus): void {
    const progress = this._currentProgress();
    if (!progress) return;

    progress.adherenceStatus = status;
    this._currentProgress.set(progress);
    this.persist();
  }

  // ─── Pattern analysis ─────────────────────────────────────────────────────

  /**
   * Derives and persists an {@link EatingBehaviorPattern} from the current progress.
   *
   * Runs an upsert: fetches the existing pattern for the user and updates it,
   * or creates a new record when none exists. Publishes {@link BehaviorPatternAnalyzed}
   * on success so downstream contexts can adapt their strategy.
   *
   * @param userId - Numeric identifier of the user being analysed.
   */
  async analyzePattern(userId: number): Promise<void> {
    const progress = this._currentProgress();
    if (!progress || progress.userId !== userId) return;

    const pattern = EatingBehaviorPattern.fromProgress(userId, progress);

    try {
      const existing = await firstValueFrom(this.eatingBehaviorPatternApi.getByUserId(userId));
      let persisted: EatingBehaviorPattern;

      if (existing) {
        pattern.id = existing.id;
        persisted = await firstValueFrom(this.eatingBehaviorPatternApi.update(pattern));
      } else {
        persisted = await firstValueFrom(this.eatingBehaviorPatternApi.create(pattern));
      }

      this._currentPattern.set(persisted);
      this.eventBus.publish(
        new BehaviorPatternAnalyzed(userId, persisted.patternType, persisted.analyzedAt),
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Pattern analysis failed.';
      this._error.set(message);
    }
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  /**
   * Persists the current behavioral progress to the API via a full PUT replacement.
   */
  private persist(): void {
    const progress = this._currentProgress();
    if (!progress) return;

    this._loading.set(true);
    this._error.set(null);

    this.behavioralConsistencyApi.updateBehavioralProgress(progress).subscribe({
      next: updated => {
        this._currentProgress.set(updated);
        this._loading.set(false);
      },
      error: err => {
        this._loading.set(false);
        this._error.set(err.message);
      },
    });
  }

  /**
   * Creates a default behavioral progress entity for a new user.
   *
   * @param userId - Numeric identifier of the user.
   * @returns Initial {@link BehavioralProgress} entity.
   */
  private createInitialProgress(userId: number): BehavioralProgress {
    const props: BehavioralProgressProps = {
      id: Date.now(),
      userId,
      adherenceStatus: AdherenceStatus.ON_TRACK,
      streak: 0,
      consecutiveMisses: 0,
      lastGoalMetDate: '',
      weekDots: [false, false, false, false, false, false, false],
    };

    return new BehavioralProgress(props);
  }

  /**
   * Returns today's date in ISO `YYYY-MM-DD` format.
   *
   * @returns Current date string.
   */
  private todayIsoDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  /** Clamps an arbitrary milestone value to the nearest allowed literal. */
  private clampMilestone(value: number): 7 | 14 | 21 | 30 {
    if (value <= 7)  return 7;
    if (value <= 14) return 14;
    if (value <= 21) return 21;
    return 30;
  }

  // ─── Recovery plan ────────────────────────────────────────────────────────

  /**
   * Loads the active recovery plan for the given user from the backend.
   *
   * Should be called during session initialisation alongside
   * {@link ensureProgressForUser}.
   *
   * @param userId - Numeric identifier of the user.
   */
  loadRecoveryPlan(userId: number): void {
    this.recoveryPlanApi.getActiveByUserId(userId).subscribe({
      next: plan => this._activeRecoveryPlan.set(plan ?? null),
    });
  }

  /**
   * Creates and persists a new recovery plan triggered by a drop event.
   *
   * If an active plan already exists for the user, no new plan is created.
   *
   * @param userId  - Target user.
   * @param trigger - Drop event type that initiated the plan.
   */
  private async activateRecoveryPlan(userId: number, trigger: AdherenceDropTrigger): Promise<void> {
    if (this._activeRecoveryPlan()?.isActive()) return;

    const plan = RecoveryPlan.create(userId, trigger);

    try {
      const persisted = await firstValueFrom(this.recoveryPlanApi.create(plan));
      this._activeRecoveryPlan.set(persisted);
      this.eventBus.publish(new RecoveryPlanActivated(userId, persisted.id, trigger));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Recovery plan activation failed.';
      this._error.set(message);
    }
  }

  /**
   * Completes the current active recovery plan when consistency is recovered.
   *
   * @param userId - Target user.
   */
  private async completeRecoveryPlan(userId: number): Promise<void> {
    const plan = this._activeRecoveryPlan();
    if (!plan || !plan.isActive() || plan.userId !== userId) return;

    plan.complete();
    this._activeRecoveryPlan.set(plan);

    try {
      const updated = await firstValueFrom(this.recoveryPlanApi.update(plan));
      this._activeRecoveryPlan.set(updated);
      this.eventBus.publish(new RecoveryPlanCompleted(userId, updated.id));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Recovery plan completion failed.';
      this._error.set(message);
    }
  }

  /** Reacts to DailyGoalMet events published by Nutrition Tracking. */
  private subscribeToDailyGoalMet(): void {
    this.eventBus.events$
      .pipe(filter(e => e instanceof DailyGoalMet))
      .subscribe((e) => {
        const event = e as DailyGoalMet;
        const progress = this._currentProgress();
        if (progress?.userId === event.userId) {
          this.markGoalMet(event.date);
        }
      });
  }

  /** Reacts to MetabolicTargetSet events; publishes StrategyMismatchDetected when targets are aggressive. */
  private subscribeToMetabolicTargetSet(): void {
    this.eventBus.events$
      .pipe(filter(e => e instanceof MetabolicTargetSet))
      .subscribe((e) => {
        const event    = e as MetabolicTargetSet;
        const progress = this._currentProgress();
        if (!progress || progress.userId !== event.userId) return;

        const lowAdherence     = progress.weeklyCompletionRate < 50;
        const aggressiveTarget = event.dailyCalorieTarget > 2000;
        if (lowAdherence && aggressiveTarget) {
          this.eventBus.publish(
            new StrategyMismatchDetected(event.userId, progress.weeklyCompletionRate, event.dailyCalorieTarget),
          );
        }
      });
  }

  /** Activates a recovery plan when a behavioral drop or abandonment risk is detected. */
  private subscribeToBehavioralDropEvents(): void {
    this.eventBus.events$
      .pipe(filter(e => e instanceof BehavioralDropDetected || e instanceof NutritionalAbandonmentRisk || e instanceof StrategyMismatchDetected))
      .subscribe((e) => {
        let userId:  number;
        let trigger: AdherenceDropTrigger;

        if (e instanceof StrategyMismatchDetected) {
          userId  = e.userId;
          trigger = AdherenceDropTrigger.STRATEGY_MISMATCH;
        } else if (e instanceof NutritionalAbandonmentRisk) {
          userId  = e.userId;
          trigger = AdherenceDropTrigger.NUTRITIONAL_ABANDONMENT;
        } else {
          const drop = e as BehavioralDropDetected;
          userId  = drop.userId;
          trigger = AdherenceDropTrigger.BEHAVIORAL_DROP;
        }

        void this.activateRecoveryPlan(userId, trigger);
      });
  }

  /** Completes the active recovery plan when consistency is fully recovered. */
  private subscribeToConsistencyRecovered(): void {
    this.eventBus.events$
      .pipe(filter(e => e instanceof ConsistencyRecovered))
      .subscribe((e) => {
        const event = e as ConsistencyRecovered;
        void this.completeRecoveryPlan(event.userId);
      });
  }

  /** Registers a skipped meal window as a behavioral miss. */
  private subscribeToMealSkipped(): void {
    this.eventBus.events$
      .pipe(filter(e => e instanceof MealSkipped))
      .subscribe((e) => {
        const event    = e as MealSkipped;
        const progress = this._currentProgress();
        if (progress?.userId === event.userId) {
          this.markGoalMissed();
        }
      });
  }

  /** Tracks a blocked restricted-item attempt as an informational deviation. */
  private subscribeToRestrictedItemBlocked(): void {
    this.eventBus.events$
      .pipe(filter(e => e instanceof RestrictedItemBlocked))
      .subscribe((e) => {
        const event    = e as RestrictedItemBlocked;
        const progress = this._currentProgress();
        if (progress?.userId === event.userId) {
          void this.analyzePattern(event.userId);
        }
      });
  }
}
