import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { IamStore } from '../../../../iam/application/iam.store';
import { DietaryRestriction } from '../../../../iam/domain/model/dietary-restriction.enum';
import { NutritionStore } from '../../../application/nutrition.store';
import { MealType } from '../../../domain/model/meal-type.enum';
import { FoodItem, FoodItemProps } from '../../../domain/model/food-item.entity';
import { MealRecord, MealRecordProps } from '../../../domain/model/meal-record.entity';
import { MacronutrientDistribution } from '../../../domain/model/macronutrient-distribution.value-object';
import { DailyIntake } from '../../../domain/model/daily-intake.entity';
import { MealSectionComponent } from '../../components/meal-section/meal-section';
import { FoodSearchPanelComponent } from '../../components/food-search-panel/food-search-panel';
import { DailyBalancePanelComponent } from '../../components/daily-balance-panel/daily-balance-panel';
import {
  AddFoodDialogComponent,
  AddFoodPayload,
} from '../../components/add-food-dialog/add-food-dialog';
import { RestrictedItemDialogComponent } from '../../components/restricted-item-dialog/restricted-item-dialog';
import { MealEntryDetailComponent } from '../../components/meal-entry-detail/meal-entry-detail';

/**
 * Main Daily Log view — route `/nutrition/log`.
 *
 * Orchestrates all nutrition-tracking child components: summary bar,
 * meal sections (T19), food search panel (T18), add-food dialog (T20),
 * date navigator, and alert banners for DailyGoalExceeded / DailyGoalMet / MealSkipped (T21–T22).
 *
 * @author Mora Rivera, Joel Fernando
 */
@Component({
  selector: 'app-daily-log',
  imports: [
    MealSectionComponent,
    FoodSearchPanelComponent,
    DailyBalancePanelComponent,
    AddFoodDialogComponent,
    RestrictedItemDialogComponent,
    MealEntryDetailComponent,
    TranslatePipe,
  ],
  templateUrl: './daily-log.html',
  styleUrl: './daily-log.css',
})
export class DailyLog implements OnInit {
  private iamStore = inject(IamStore);
  private translate = inject(TranslateService);
  protected nutritionStore = inject(NutritionStore);

  /** Food selected from the search panel — drives the Add Food dialog. */
  protected selectedFood = signal<FoodItem | null>(null);

  /** Active meal type for the current hour — pre-selects the dialog picker. */
  protected targetMealType = computed((): MealType => {
    if (!this.isToday()) return MealType.LUNCH;
    const hour = new Date().getHours();
    if (hour >= 17) return MealType.DINNER;
    if (hour >= 11) return MealType.LUNCH;
    return MealType.BREAKFAST;
  });

  /** Meal types the user may log right now (time-gated for today). */
  protected availableMealTypes = computed((): MealType[] => {
    if (!this.isToday()) return [MealType.BREAKFAST, MealType.LUNCH, MealType.SNACK, MealType.DINNER];
    const hour = new Date().getHours();
    const types: MealType[] = [MealType.BREAKFAST];
    if (hour >= 11) types.push(MealType.LUNCH);
    types.push(MealType.SNACK);
    if (hour >= 17) types.push(MealType.DINNER);
    return types;
  });

  /** Food blocked due to restriction — drives the Restricted Item dialog. */
  protected blockedFood = signal<FoodItem | null>(null);

  /** Whether the food search modal is open. */
  protected showFoodSearchModal = signal(false);

  /** End hour (exclusive) of each meal window per the domain model (Swimlane 5). */
  private readonly mealWindowEnds: Partial<Record<MealType, number>> = {
    [MealType.BREAKFAST]: 10,
    [MealType.LUNCH]:     15,
    [MealType.DINNER]:    22,
  };

  /**
   * MealSkipped domain event — derived from time-window detection.
   * A meal type is skipped when its window has passed (today only)
   * and no records exist for that window.
   */
  private skippedMeals = computed(() => {
    if (!this.isToday()) return [];
    const currentHour = new Date().getHours();
    const groups = this.filteredByMealType();
    return (Object.entries(this.mealWindowEnds) as [MealType, number][])
      .filter(([type, endHour]) => currentHour >= endHour && groups[type].length === 0)
      .map(([type]) => type);
  });

  protected showGoalMetAlert = signal(false);

  /** Currently selected date for the day navigator. */
  protected selectedDate = signal<Date>(new Date());

  /** Meal record selected for detail view. */
  protected selectedEntry = signal<MealRecord | null>(null);

  constructor() {
    effect(() => {
      const calories = this.filteredTotals().calories;
      const goal = this.dailyGoalTarget();
      const withinRange = calories >= goal * 0.9 && !this.isDailyGoalExceeded();
      if (this.allMealsLogged() && withinRange) {
        this.showGoalMetAlert.set(true);
        setTimeout(() => this.showGoalMetAlert.set(false), 4000);
      }
    });
  }

  // ─── Date Navigator Computeds ─────────────────────────────────────────────

  /** True when the selected date is today. */
  protected isToday = computed(() => {
    const today = new Date();
    return this.selectedDate().toDateString() === today.toDateString();
  });

  /** True when the selected date is on or before the user's account creation date. */
  protected isAtAccountStart = computed(() => {
    const user = this.iamStore.currentUser();
    if (!user?.createdAt) return false;
    const created = new Date(user.createdAt);
    const createdDay = new Date(created.getFullYear(), created.getMonth(), created.getDate());
    const sel = this.selectedDate();
    const selDay = new Date(sel.getFullYear(), sel.getMonth(), sel.getDate());
    return selDay <= createdDay;
  });

  /** True when entries for the selected date can still be edited (within 7 days). */
  protected isEditable = computed(() => {
    const today = new Date();
    const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const sel = this.selectedDate();
    const selDay = new Date(sel.getFullYear(), sel.getMonth(), sel.getDate());
    const diffDays = (todayDay.getTime() - selDay.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays < 7;
  });

  private readonly activeLang = toSignal(
    this.translate.onLangChange.pipe(map((e) => e.lang)),
    { initialValue: this.translate.currentLang ?? 'en' },
  );

  /** Formatted label for the date navigator pill — reactive to language changes. */
  protected formattedDate = computed(() => {
    const lang = this.activeLang();
    if (this.isToday()) return this.translate.instant('nutrition.date_today');
    return new Intl.DateTimeFormat(lang === 'es' ? 'es-ES' : 'en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(this.selectedDate());
  });

  // ─── Filtered Records ─────────────────────────────────────────────────────

  protected filteredRecords = computed(() => {
    const selectedDateStr = this.selectedDate().toDateString();
    return this.nutritionStore.mealRecords().filter(
      (r) => new Date(r.loggedAt).toDateString() === selectedDateStr,
    );
  });

  private filteredByMealType = computed(() => {
    const records = this.filteredRecords();
    return {
      [MealType.BREAKFAST]: records.filter((r) => r.mealType === MealType.BREAKFAST),
      [MealType.LUNCH]: records.filter((r) => r.mealType === MealType.LUNCH),
      [MealType.SNACK]: records.filter((r) => r.mealType === MealType.SNACK),
      [MealType.DINNER]: records.filter((r) => r.mealType === MealType.DINNER),
    };
  });

  protected filteredTotals = computed(() =>
    this.filteredRecords().reduce(
      (acc, r) => acc.add(r.macros),
      MacronutrientDistribution.zero(),
    )
  );

  // ─── Computed ─────────────────────────────────────────────────────────────

  /** DailyIntake record for the selected date, null when no backend record exists. */
  private readonly selectedDailyIntake = computed(() =>
    this.nutritionStore.getDailyIntakeFor(this.selectedDate())
  );

  /** Active (burned) calories for the selected date — 0 when no record exists. */
  protected readonly selectedActive = computed(() => this.selectedDailyIntake()?.active ?? 0);

  /**
   * Always-non-null DailyIntake for the selected date.
   * Uses the real record when available; builds a synthetic one from the user profile otherwise.
   */
  private readonly effectiveDailyIntake = computed(() =>
    this.selectedDailyIntake() ?? new DailyIntake({
      id: 0,
      userId: this.iamStore.currentUser()?.id ?? 0,
      date: this.selectedDate().toISOString().slice(0, 10),
      dailyGoal: this.iamStore.currentUser()?.dailyCalorieTarget ?? 1800,
      consumed: 0,
      active: 0,
    })
  );

  /** Daily calorie goal for the selected date, falling back to user profile then 1800. */
  protected dailyGoalTarget = computed(() =>
    this.selectedDailyIntake()?.dailyGoal ?? this.iamStore.currentUser()?.dailyCalorieTarget ?? 1800
  );

  /** Whether the daily goal has been exceeded for the selected date (T22). */
  protected isDailyGoalExceeded = computed(() =>
    this.filteredTotals().calories > this.dailyGoalTarget()
  );

  /** Whether all 4 meal windows are logged for the selected date (T22). */
  protected allMealsLogged = computed(() =>
    Object.values(this.filteredByMealType()).every((arr) => arr.length > 0),
  );

  /** Kilocalories consumed beyond the daily goal (T22). */
  protected exceededBy = computed(() =>
    Math.abs(this.filteredTotals().calories - this.dailyGoalTarget())
  );

  /** Summary bar macro descriptors. */
  protected summaryMacros = computed(() => {
    const user = this.iamStore.currentUser();
    const t    = this.filteredTotals();
    const pct  = (v: number, max: number) => Math.min(Math.round((v / max) * 100), 100);
    const targets = {
      protein: user?.proteinTarget ?? 120,
      carbs:   user?.carbsTarget   ?? 200,
      fat:     user?.fatTarget     ?? 55,
      fiber:   user?.fiberTarget   ?? 25,
    };
    const valid = this.effectiveDailyIntake().validateMacronutrients(t, targets);

    return [
      {
        label:   'nutrition.calories',
        value:   t.calories,
        target:  this.dailyGoalTarget(),
        unit:    'kcal',
        color:   '#2d9e8f',
        percent: pct(t.calories, this.dailyGoalTarget()),
        over:    !valid.calories,
      },
      {
        label:   'nutrition.protein',
        value:   t.protein,
        target:  targets.protein,
        unit:    'g',
        color:   '#2d9e8f',
        percent: pct(t.protein, targets.protein),
        over:    !valid.protein,
      },
      {
        label:   'nutrition.carbohydrates',
        value:   t.carbs,
        target:  targets.carbs,
        unit:    'g',
        color:   '#f59e0b',
        percent: pct(t.carbs, targets.carbs),
        over:    !valid.carbs,
      },
      {
        label:   'nutrition.fats',
        value:   t.fat,
        target:  targets.fat,
        unit:    'g',
        color:   '#f87171',
        percent: pct(t.fat, targets.fat),
        over:    !valid.fat,
      },
      {
        label:   'nutrition.fiber',
        value:   t.fiber,
        target:  targets.fiber,
        unit:    'g',
        color:   '#a3e635',
        percent: pct(t.fiber, targets.fiber),
        over:    !valid.fiber,
      },
    ];
  });

  /** Meal section descriptors used by the template. */
  protected mealSections = computed(() => {
    const groups = this.filteredByMealType();
    const skipped = this.skippedMeals();
    return [
      {
        type: MealType.BREAKFAST,
        color: '#f59e0b',
        records: groups[MealType.BREAKFAST],
        skipped: skipped.includes(MealType.BREAKFAST),
      },
      {
        type: MealType.LUNCH,
        color: '#2d9e8f',
        records: groups[MealType.LUNCH],
        skipped: skipped.includes(MealType.LUNCH),
      },
      {
        type: MealType.SNACK,
        color: '#a78bfa',
        records: groups[MealType.SNACK],
        skipped: skipped.includes(MealType.SNACK),
      },
      {
        type: MealType.DINNER,
        color: '#9ca3af',
        records: groups[MealType.DINNER],
        skipped: skipped.includes(MealType.DINNER),
      },
    ];
  });

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  async ngOnInit(): Promise<void> {
    await this.nutritionStore.loadMealHistory();
    await this.nutritionStore.loadDailyBalance();
    this._preloadRecipeFromState();
  }

  private _preloadRecipeFromState(): void {
    const state = history.state as { fromRecipe?: { id: number; name: string; calories: number; protein: number; carbs: number; fat: number } };
    if (!state?.fromRecipe) return;
    const r = state.fromRecipe;
    const props: FoodItemProps = {
      id:               r.id,
      name:             r.name,
      source:           'pantry',
      servingSize:      100,
      servingUnit:      'g',
      caloriesPer100g:  r.calories,
      proteinPer100g:   r.protein,
      carbsPer100g:     r.carbs,
      fatPer100g:       r.fat,
      fiberPer100g:     0,
      sugarPer100g:     0,
      restrictions:     [],
    };
    this.onFoodSelected(new FoodItem(props));
  }

  // ─── Date Navigation ──────────────────────────────────────────────────────

  goToPreviousDay(): void {
    if (this.isAtAccountStart()) return;
    const d = new Date(this.selectedDate());
    d.setDate(d.getDate() - 1);
    this.selectedDate.set(d);
  }

  goToNextDay(): void {
    if (this.isToday()) return;
    const d = new Date(this.selectedDate());
    d.setDate(d.getDate() + 1);
    this.selectedDate.set(d);
  }

  // ─── Event Handlers ───────────────────────────────────────────────────────

  /** Opens the food search modal. */
  openFoodSearch(): void {
    this.showFoodSearchModal.set(true);
    this.nutritionStore.clearSearch();
  }

  /** Closes the food search modal. */
  closeFoodSearch(): void {
    this.showFoodSearchModal.set(false);
    this.nutritionStore.clearSearch();
  }

  /** Opens the meal entry detail dialog. */
  onViewEntry(record: MealRecord): void {
    this.selectedEntry.set(record);
  }

  /** Handles MealRemoved intent — delegates to the store. */
  async onMealRemoved(id: number): Promise<void> {
    await this.nutritionStore.removeMeal(id);
  }

  /**
   * Called when the user selects a food from the search panel.
   * Opens the blocked dialog if restricted, otherwise the add dialog.
   */
  onFoodSelected(food: FoodItem): void {
    const user = this.iamStore.currentUser();
    if (!user) return;
    this.showFoodSearchModal.set(false);
    if (food.isRestrictedFor(user.restrictions as DietaryRestriction[])) {
      this.blockedFood.set(food);
    } else {
      this.selectedFood.set(food);
    }
  }

  /** Handles MealRecorded event — persists the confirmed entry. */
  async onMealRecorded(payload: AddFoodPayload): Promise<void> {
    const user = this.iamStore.currentUser();
    if (!user) return;

    const logDate = this.isToday()
      ? new Date()
      : new Date(
          this.selectedDate().getFullYear(),
          this.selectedDate().getMonth(),
          this.selectedDate().getDate(),
          12, 0, 0,
        );

    const props: MealRecordProps = {
      id: 0,
      foodItemId: payload.food.id,
      foodItemName: payload.food.name,
      foodItemNameEs: payload.food.nameEs,
      mealType: payload.mealType,
      quantity: payload.quantity,
      unit: payload.food.servingUnit,
      calories: payload.nutrients.calories,
      protein: payload.nutrients.protein,
      carbs: payload.nutrients.carbs,
      fat: payload.nutrients.fat,
      fiber: payload.nutrients.fiber,
      sugar: payload.nutrients.sugar,
      loggedAt: logDate.toISOString(),
      userId: user.id,
    };

    await this.nutritionStore.recordMeal(new MealRecord(props));
    this.selectedFood.set(null);
    this.nutritionStore.clearSearch();
  }

  /** Cancels the add food dialog. */
  onCancelAdd(): void {
    this.selectedFood.set(null);
  }

  /** Closes the restricted item blocked dialog. */
  onCloseBlocked(): void {
    this.blockedFood.set(null);
    this.nutritionStore.clearSearch();
  }

  /** Handles PortionAdjusted intent — recalculates macros proportionally. */
  async onPortionAdjusted(payload: { id: number; quantity: number }): Promise<void> {
    const original = this.nutritionStore.mealRecords().find((r) => r.id === payload.id);
    if (!original || original.quantity === 0) return;
    const scaled = original.macros.scale(payload.quantity / original.quantity);
    const updated = new MealRecord({
      id: original.id,
      foodItemId: original.foodItemId,
      foodItemName: original.foodItemName,
      foodItemNameEs: original.foodItemNameEs,
      mealType: original.mealType,
      quantity: payload.quantity,
      unit: original.unit,
      calories: scaled.calories,
      protein:  scaled.protein,
      carbs:    scaled.carbs,
      fat:      scaled.fat,
      fiber:    scaled.fiber,
      sugar:    scaled.sugar,
      loggedAt: original.loggedAt,
      userId:   original.userId,
    });
    await this.nutritionStore.adjustPortion(updated);
    this.selectedEntry.set(null);
  }
}
