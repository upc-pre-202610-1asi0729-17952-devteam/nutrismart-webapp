import { computed, inject, Injectable, signal } from '@angular/core';
import { debounceTime, filter, firstValueFrom, map, retry, Subject, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IamStore } from '../../iam/application/iam.store';
import { DomainEventBus } from '../../shared/application/domain-event-bus';
import { MetabolicTargetSet } from '../../shared/domain/metabolic-target-set.event';
import { RestrictionsChanged } from '../../shared/domain/restrictions-changed.event';
import { MealRecorded } from '../../shared/domain/meal-recorded.event';
import { MealRemoved } from '../../shared/domain/meal-removed.event';
import { DailyGoalExceeded } from '../../shared/domain/daily-goal-exceeded.event';
import { DailyGoalMet } from '../../shared/domain/daily-goal-met.event';
import { DailyProgressUpdated } from '../../shared/domain/daily-progress-updated.event';
import { MealEntryUpdated } from '../../shared/domain/meal-entry-updated.event';
import { RestrictedItemBlocked } from '../../shared/domain/restricted-item-blocked.event';
import { MealSkipped } from '../../shared/domain/meal-skipped.event';
import { CaloricTargetAdjusted } from '../../metabolic-adaptation/domain/events/caloric-target-adjusted.event';
import { DietaryRestrictionsRegistered } from '../domain/events/dietary-restrictions-registered.event';
import { FoodSearchExecuted } from '../domain/events/food-search-executed.event';
import { DailyTargetsSet } from '../domain/events/daily-targets-set.event';
import { NetTargetUpdated } from '../domain/events/net-target-updated.event';
import { DietaryRestriction } from '../../iam/domain/model/dietary-restriction.enum';
import { MealType } from '../domain/model/meal-type.enum';
import { FoodItem } from '../domain/model/food-item.entity';
import { MealRecord } from '../domain/model/meal-record.entity';
import { DailyIntake } from '../domain/model/daily-intake.entity';
import { MacroName } from '../domain/model/macro-warning.value-object';
import { PreLogGuardrail } from '../domain/model/pre-log-guardrail.value-object';
import { GuardrailSeverity } from '../domain/model/guardrail-severity.enum';
import { GuardrailType } from '../domain/model/guardrail-type.enum';
import { NutritionApi } from '../infrastructure/nutrition-api';
import { WearableStore } from '../../metabolic-adaptation/application/wearable.store';

/**
 * Central state store for the Nutrition Tracking bounded context.
 *
 * Manages food search results, daily meal records, and caloric balance
 * using Angular Signals. All mutations are persisted via {@link NutritionApi}.
 *
 * Reacts to cross-context domain events:
 * - {@link MetabolicTargetSet}  → refreshes today's `dailyGoal`
 * - {@link CaloricTargetAdjusted} → refreshes today's `active` calories
 * - {@link RestrictionsChanged} → caches restrictions for pre-log validation
 *
 * Provided in root so a single instance is shared across the application.
 *
 * @author Mora Rivera, Joel Fernando
 */
/** Maps domain {@link MacroName} to the i18n key used in the presentation layer. */
const MACRO_I18N: Record<MacroName, string> = {
  calories:      'nutrition.calories',
  protein:       'nutrition.protein',
  carbohydrates: 'nutrition.carbohydrates',
  fats:          'nutrition.fats',
  fiber:         'nutrition.fiber',
};

@Injectable({ providedIn: 'root' })
export class NutritionStore {
  private readonly nutritionApi  = inject(NutritionApi);
  private readonly iamStore      = inject(IamStore);
  private readonly eventBus      = inject(DomainEventBus);
  private readonly wearableStore = inject(WearableStore);

  // ─── Private Signals ──────────────────────────────────────────────────────

  private readonly _foodItems          = signal<FoodItem[]>([]);
  private readonly _mealRecords        = signal<MealRecord[]>([]);
  private readonly _dailyIntakes       = signal<DailyIntake[]>([]);
  private readonly _loading            = signal<boolean>(false);
  private readonly _error              = signal<string | null>(null);
  private readonly _searchQuery        = signal<string>('');
  private readonly _userRestrictions   = signal<DietaryRestriction[]>([]);
  private readonly _goalExceededToday      = signal<boolean>(false);
  private readonly _allMealsMetToday       = signal<boolean>(false);
  private readonly _preLogGuardrails       = signal<PreLogGuardrail[]>([]);
  private readonly _restrictionsInitialized = signal<boolean>(false);
  private readonly _skippedMealsEmitted    = signal<Set<string>>(new Set());

  private readonly _searchSubject = new Subject<string>();

  // ─── Public Read-only Signals ─────────────────────────────────────────────

  /** Food items matching the current search query. */
  readonly foodItems = this._foodItems.asReadonly();

  /** All meal records for the current day. */
  readonly mealRecords = this._mealRecords.asReadonly();

  /** All daily caloric balance records for the current user. */
  readonly dailyIntakes = this._dailyIntakes.asReadonly();

  /** Whether an async operation is in flight. */
  readonly loading = this._loading.asReadonly();

  /** Last error message, or null. */
  readonly error = this._error.asReadonly();

  /** Current search query string. */
  readonly searchQuery = this._searchQuery.asReadonly();

  /** User's active dietary restrictions, kept in sync via {@link RestrictionsChanged}. */
  readonly userRestrictions = this._userRestrictions.asReadonly();

  /** Guardrails raised by the last {@link evaluatePreLog} call. Reset on each evaluation. */
  readonly preLogGuardrails = this._preLogGuardrails.asReadonly();

  /** Whether the last evaluation produced at least one guardrail that blocks persistence. */
  readonly hasBlockingGuardrail = computed(() =>
    this._preLogGuardrails().some(g => g.isBlocking()),
  );

  // ─── Computed Signals ─────────────────────────────────────────────────────

  /** Meal records grouped by meal type. */
  readonly recordsByMealType = computed(() => {
    const records = this._mealRecords();
    return {
      [MealType.BREAKFAST]: records.filter((r) => r.mealType === MealType.BREAKFAST),
      [MealType.LUNCH]:     records.filter((r) => r.mealType === MealType.LUNCH),
      [MealType.SNACK]:     records.filter((r) => r.mealType === MealType.SNACK),
      [MealType.DINNER]:    records.filter((r) => r.mealType === MealType.DINNER),
    };
  });

  /** Aggregated totals from today's meal records only. */
  readonly dailyTotals = computed(() =>
    this._mealRecords().filter(r => r.isFromToday).reduce(
      (acc, r) => ({
        calories: Math.round((acc.calories + r.calories) * 10) / 10,
        protein:  Math.round((acc.protein  + r.protein)  * 10) / 10,
        carbs:    Math.round((acc.carbs    + r.carbs)    * 10) / 10,
        fat:      Math.round((acc.fat      + r.fat)      * 10) / 10,
        fiber:    Math.round((acc.fiber    + r.fiber)    * 10) / 10,
        sugar:    Math.round((acc.sugar    + r.sugar)    * 10) / 10,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 },
    ),
  );

  /** Whether today's consumed calories exceed today's daily goal. */
  readonly isDailyGoalExceeded = computed(() => {
    const intake = this.getDailyIntakeFor(new Date());
    if (!intake) return false;
    return this.dailyTotals().calories > intake.dailyGoal;
  });

  /** Whether all 4 meal windows have at least one entry. */
  readonly allMealsLogged = computed(() => {
    const groups = this.recordsByMealType();
    return Object.values(groups).every((arr) => arr.length > 0);
  });

  /**
   * Macro warnings for today derived from domain logic in {@link DailyIntake.checkWarnings}.
   *
   * Returns i18n keys ready for the presentation layer — the mapping from
   * {@link MacroName} to key lives here in the application layer, not in the domain.
   */
  readonly todayMacroWarnings = computed((): { approaching: string[]; exceeded: string[] } => {
    const user = this.iamStore.currentUser();
    if (!user) return { approaching: [], exceeded: [] };
    const totals  = this.dailyTotals();
    const today   = new Date().toISOString().slice(0, 10);
    const intake  = this.getDailyIntakeFor(new Date()) ?? new DailyIntake({
      id: 0, userId: user.id,
      date: today,
      dailyGoal: user.dailyCalorieTarget ?? 1800,
      consumed: 0, active: 0,
    });
    const targets = {
      protein: user.proteinTarget ?? 120,
      carbs:   user.carbsTarget   ?? 200,
      fat:     user.fatTarget     ?? 55,
      fiber:   user.fiberTarget   ?? 25,
    };
    const warnings = intake.checkWarnings(totals, targets);
    return {
      approaching: warnings.filter(w => w.isApproaching).map(w => MACRO_I18N[w.macro]),
      exceeded:    warnings.filter(w => w.isExceeded).map(w => MACRO_I18N[w.macro]),
    };
  });

  /** Active calories burned today, falling back to wearable data when no DB intake record exists. */
  readonly todayActiveCalories = computed(() => {
    const intake = this.getDailyIntakeFor(new Date());
    return intake ? intake.active : this.wearableStore.netCalorieAdjustment();
  });

  constructor() {
    this._searchSubject
      .pipe(
        debounceTime(400),
        switchMap((query) => {
          if (query.trim().length < 2) {
            this._foodItems.set([]);
            return [];
          }
          this._loading.set(true);
          return this.nutritionApi.searchFoods(query).pipe(
            map(items => ({ query, items })),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe({
        next: ({ query, items }) => {
          this._foodItems.set(items);
          this._loading.set(false);
          const user = this.iamStore.currentUser();
          if (user) {
            this.eventBus.publish(new FoodSearchExecuted(user.id, query, items.length));
          }
        },
        error: () => {
          this._error.set('Failed to search foods.');
          this._loading.set(false);
        },
      });

    this.subscribeToMetabolicTargetSet();
    this.subscribeToCaloricTargetAdjusted();
    this.subscribeToRestrictionsChanged();
  }

  // ─── Event Subscriptions ──────────────────────────────────────────────────

  private subscribeToMetabolicTargetSet(): void {
    this.eventBus.events$.pipe(
      filter((e): e is MetabolicTargetSet => e.eventType === 'MetabolicTargetSet'),
    ).subscribe(e => {
      const today = new Date().toISOString().slice(0, 10);
      this._dailyIntakes.update(intakes => intakes.map(i => {
        if (i.userId === e.userId && i.date === today) {
          i.updateGoal(e.dailyCalorieTarget);
        }
        return i;
      }));
      this.eventBus.publish(new DailyTargetsSet(
        e.userId, e.dailyCalorieTarget, e.proteinTarget, e.carbsTarget, e.fatTarget,
      ));
    });
  }

  private subscribeToCaloricTargetAdjusted(): void {
    this.eventBus.events$.pipe(
      filter((e): e is CaloricTargetAdjusted => e.eventType === 'CaloricTargetAdjusted'),
    ).subscribe(e => {
      const today = new Date().toISOString().slice(0, 10);
      this._dailyIntakes.update(intakes => intakes.map(i => {
        if (i.userId === e.userId && i.date === today) {
          i.updateActive(i.active + e.activeCaloriesAdded);
        }
        return i;
      }));
      const intake = this.getDailyIntakeFor(new Date());
      if (intake) {
        this.eventBus.publish(new NetTargetUpdated(
          e.userId, intake.dailyGoal + intake.active, e.activeCaloriesAdded,
        ));
      }
    });
  }

  private subscribeToRestrictionsChanged(): void {
    this.eventBus.events$.pipe(
      filter((e): e is RestrictionsChanged => e.eventType === 'RestrictionsChanged'),
    ).subscribe(e => {
      const user = this.iamStore.currentUser();
      if (user && e.userId === user.id) {
        this._userRestrictions.set(e.restrictions);
      }
    });
  }

  // ─── Actions ──────────────────────────────────────────────────────────────

  /**
   * Triggers a debounced food search.
   *
   * @param query - Partial food name typed by the user.
   */
  searchFoods(query: string): void {
    this._searchQuery.set(query);
    this._searchSubject.next(query);
  }

  /** Clears the food search results and query. */
  clearSearch(): void {
    this._searchQuery.set('');
    this._foodItems.set([]);
  }

  /**
   * Loads all meal records for the currently authenticated user.
   *
   * @returns Promise that resolves when loading is complete.
   */
  async loadMealHistory(): Promise<void> {
    const user = this.iamStore.currentUser();
    if (!user) return;
    this._loading.set(true);
    this._error.set(null);
    try {
      const records = await firstValueFrom(this.nutritionApi.getMealEntries(user.id));
      this._mealRecords.set(records.filter(r => r.userId === user.id));

      if (!this._restrictionsInitialized()) {
        const restrictions = this._userRestrictions().length > 0
          ? this._userRestrictions()
          : (user.restrictions ?? []);
        this._userRestrictions.set(restrictions);
        if (restrictions.length > 0) {
          this.eventBus.publish(new DietaryRestrictionsRegistered(user.id, restrictions));
        }
        this._restrictionsInitialized.set(true);
      }

      this.checkMealWindows();
    } catch {
      this._error.set('Failed to load meal entries.');
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Evaluates pre-log guardrails for a meal before it is persisted.
   *
   * Always call this before {@link recordMeal} to populate {@link preLogGuardrails}
   * and {@link hasBlockingGuardrail}. Can also be called proactively (e.g. when
   * the user selects a food item) to surface feedback before they confirm.
   *
   * @param record   - The meal record being evaluated.
   * @param foodItem - The food item selected; required for restriction checking.
   * @returns The evaluated guardrails (also stored in {@link preLogGuardrails}).
   */
  evaluatePreLog(record: MealRecord, foodItem?: FoodItem): PreLogGuardrail[] {
    const user       = this.iamStore.currentUser();
    const guardrails: PreLogGuardrail[] = [];

    const intake = this.getDailyIntakeFor(new Date());
    if (intake) {
      const calorieGuardrail = intake.evaluateCalorieOverage(
        record.calories,
        this.dailyTotals().calories,
      );
      if (calorieGuardrail) guardrails.push(calorieGuardrail);
    }

    if (user && foodItem) {
      const violations = foodItem.conflictingRestrictions(this._userRestrictions());
      for (const violation of violations) {
        guardrails.push(new PreLogGuardrail({
          type:              GuardrailType.RESTRICTION_CONFLICT,
          severity:          GuardrailSeverity.BLOCK,
          messageKey:        'nutrition.guardrail.restriction_conflict',
          recommendationKey: 'nutrition.guardrail.restriction_conflict_rec',
          params:            { restriction: violation },
        }));
      }
    }

    this._preLogGuardrails.set(guardrails);
    return guardrails;
  }

  /**
   * Evaluates pre-log guardrails, then persists the meal if none are blocking.
   *
   * Replaces the legacy inline restriction check with the unified
   * {@link evaluatePreLog} flow. Publishes {@link MealRecorded} on success,
   * and detects whether {@link DailyGoalExceeded} or {@link DailyGoalMet} should fire.
   *
   * @param record   - The {@link MealRecord} entity to save.
   * @param foodItem - Optional food item used for restriction and calorie validation.
   * @returns Promise that resolves when the record is saved.
   */
  async recordMeal(record: MealRecord, foodItem?: FoodItem): Promise<void> {
    const user       = this.iamStore.currentUser();
    const guardrails = this.evaluatePreLog(record, foodItem);
    const blocker    = guardrails.find(g => g.isBlocking());
    if (blocker) {
      this._error.set(blocker.messageKey);
      if (user && foodItem) {
        const restriction = blocker.params?.['restriction'] as string | undefined;
        this.eventBus.publish(new RestrictedItemBlocked(
          user.id,
          foodItem.name,
          restriction ?? blocker.type,
          new Date().toISOString().slice(0, 10),
        ));
      }
      return;
    }
    this._loading.set(true);
    this._error.set(null);
    try {
      const created = await firstValueFrom(
        this.nutritionApi.createMealEntry(record).pipe(retry(2)),
      );
      this._mealRecords.update(prev => [...prev, created]);
      if (user) {
        this.eventBus.publish(new MealRecorded(user.id, record.mealType, record.calories, 'manual'));
        this.checkAndPublishDailyGoalEvents(user.id);
      }
    } catch {
      this._error.set('Failed to add meal entry.');
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Updates an existing meal record and synchronises local state.
   *
   * @param record - The updated {@link MealRecord} entity.
   * @returns Promise that resolves when the update is complete.
   */
  async adjustPortion(record: MealRecord): Promise<void> {
    const user = this.iamStore.currentUser();
    this._loading.set(true);
    this._error.set(null);
    try {
      const updated = await firstValueFrom(
        this.nutritionApi.updateMealEntry(record).pipe(retry(2)),
      );
      this._mealRecords.update(prev => prev.map(r => r.id === updated.id ? updated : r));
      if (user) {
        this.eventBus.publish(new MealEntryUpdated(user.id, updated.id, updated.mealType, updated.calories));
        this.checkAndPublishDailyGoalEvents(user.id);
      }
    } catch {
      this._error.set('Failed to update meal entry.');
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Deletes a meal record and removes it from local state.
   *
   * Publishes {@link MealRemoved} on success.
   *
   * @param id - Numeric ID of the record to delete.
   * @returns Promise that resolves when deletion is complete.
   */
  async removeMeal(id: number): Promise<void> {
    const user   = this.iamStore.currentUser();
    const record = this._mealRecords().find(r => r.id === id);
    this._loading.set(true);
    this._error.set(null);
    try {
      await firstValueFrom(this.nutritionApi.deleteMealEntry(id).pipe(retry(2)));
      this._mealRecords.update(prev => prev.filter(r => r.id !== id));
      if (user && record) {
        this.eventBus.publish(new MealRemoved(user.id, record.mealType));
      }
    } catch {
      this._error.set('Failed to delete meal entry.');
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Loads the daily caloric balance records for the current user.
   *
   * @returns Promise that resolves when loading is complete.
   */
  async loadDailyBalance(): Promise<void> {
    const user = this.iamStore.currentUser();
    if (!user) return;
    this._loading.set(true);
    this._error.set(null);
    try {
      const [balances] = await Promise.all([
        firstValueFrom(this.nutritionApi.getDailyBalance()),
        this.wearableStore.load(),
      ]);
      const userBalances = balances.filter(b => b.userId === user.id);
      const today       = new Date().toISOString().slice(0, 10);
      const todayActive = this.wearableStore.netCalorieAdjustment();
      this._dailyIntakes.set(userBalances.map(b => {
        if (b.date === today) b.updateActive(todayActive);
        return b;
      }));
    } catch {
      this._error.set('Failed to load daily balance.');
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Returns the {@link DailyIntake} record for the given date, or null if none exists.
   *
   * @param date - The calendar day to look up.
   */
  getDailyIntakeFor(date: Date): DailyIntake | null {
    const dateStr = date.toISOString().slice(0, 10);
    return this._dailyIntakes().find((b) => b.date === dateStr) ?? null;
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  /**
   * Checks which meal windows have closed without a log and emits {@link MealSkipped}.
   * A Set signal deduplicates emissions so each meal type fires at most once per day.
   */
  private checkMealWindows(): void {
    const user = this.iamStore.currentUser();
    if (!user) return;

    const now   = new Date();
    const today = now.toISOString().slice(0, 10);
    const hour  = now.getHours();

    const windows = [
      { mealType: MealType.BREAKFAST, closesAt: 10, windowEnd: `${today}T10:00:00` },
      { mealType: MealType.LUNCH,     closesAt: 15, windowEnd: `${today}T15:00:00` },
      { mealType: MealType.DINNER,    closesAt: 22, windowEnd: `${today}T22:00:00` },
    ];

    const emitted = new Set(this._skippedMealsEmitted());
    const groups  = this.recordsByMealType();

    for (const { mealType, closesAt, windowEnd } of windows) {
      if (hour < closesAt) continue;
      const key = `${mealType}-${today}`;
      if (emitted.has(key)) continue;
      if (groups[mealType].length > 0) continue;

      this.eventBus.publish(new MealSkipped(user.id, mealType, windowEnd, today));
      emitted.add(key);
    }

    this._skippedMealsEmitted.set(emitted);
  }

  /**
   * Evaluates post-meal conditions and publishes {@link DailyGoalExceeded}
   * or {@link DailyGoalMet} at most once per session day.
   */
  private checkAndPublishDailyGoalEvents(userId: number): void {
    const today  = new Date().toISOString().slice(0, 10);
    const intake = this.getDailyIntakeFor(new Date());
    if (!intake) return;

    if (intake.exceeded && !this._goalExceededToday()) {
      this._goalExceededToday.set(true);
      this.eventBus.publish(new DailyGoalExceeded(userId, intake.netCalories, today));
      return;
    }

    if (!intake.exceeded) {
      const totals       = this.dailyTotals();
      const adherencePct = intake.dailyGoal > 0
        ? Math.round((totals.calories / intake.dailyGoal) * 100)
        : 0;
      this.eventBus.publish(new DailyProgressUpdated(userId, intake.remaining, adherencePct, today));
    }

    if (this.allMealsLogged() && !this._allMealsMetToday()) {
      this._allMealsMetToday.set(true);
      const totals       = this.dailyTotals();
      const adherencePct = intake.dailyGoal > 0
        ? Math.round((totals.calories / intake.dailyGoal) * 100)
        : 0;
      this.eventBus.publish(new DailyGoalMet(userId, today, totals.calories, adherencePct));
    }
  }
}
