import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { IamStore } from '../../../../iam/application/iam.store';
import { DietaryRestriction } from '../../../../iam/domain/model/dietary-restriction.enum';
import { NutritionStore } from '../../../application/nutrition.store';
import { MealType } from '../../../domain/model/meal-type.enum';
import { FoodItem } from '../../../domain/model/food-item.entity';
import { MealRecord, MealRecordProps } from '../../../domain/model/meal-record.entity';
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
 * and alert banners for DailyGoalExceeded / DailyGoalMet / MealSkipped (T21–T22).
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
  ],
  templateUrl: './daily-log.html',
  styleUrl: './daily-log.css',
})
export class DailyLog implements OnInit {
  private iamStore = inject(IamStore);
  protected nutritionStore = inject(NutritionStore);

  /** Food selected from the search panel — drives the Add Food dialog. */
  protected selectedFood = signal<FoodItem | null>(null);

  /** Meal type where the user wants to add the selected food. */
  protected targetMealType = signal<MealType>(MealType.LUNCH);

  /** Food blocked due to restriction — drives the Restricted Item dialog. */
  protected blockedFood = signal<FoodItem | null>(null);

  /** Demo state: which meals are marked as skipped (T21). */
  private skippedMeals = signal<MealType[]>([]);

  protected showGoalMetAlert = signal(true);

  constructor() {
    effect(() => {
      if (this.nutritionStore.allMealsLogged() && !this.nutritionStore.isDailyGoalExceeded()) {
        this.showGoalMetAlert.set(true);
        setTimeout(() => this.showGoalMetAlert.set(false), 4000);
      }
    });
  }

  /** Meal record selected for detail view. */
  protected selectedEntry = signal<MealRecord | null>(null);

  protected toastMessage = signal<{ text: string; type: string } | null>(null);

  // ─── Computed ─────────────────────────────────────────────────────────────

  /** Whether the daily goal has been exceeded (T22). */
  protected isDailyGoalExceeded = this.nutritionStore.isDailyGoalExceeded;

  /** Whether all 4 meal windows are logged (T22). */
  protected allMealsLogged = this.nutritionStore.allMealsLogged;

  /** Kilocalories consumed beyond the daily goal (T22). */
  protected exceededBy = computed(() => {
    const intake = this.nutritionStore.dailyIntake();
    if (!intake) return 0;
    return Math.abs(this.nutritionStore.dailyTotals().calories - intake.dailyGoal);
  });

  /** Summary bar macro descriptors. */
  protected summaryMacros = computed(() => {
    const user = this.iamStore.currentUser();
    const t = this.nutritionStore.dailyTotals();
    const pct = (v: number, max: number) => Math.min(Math.round((v / max) * 100), 100);

    return [
      {
        label: 'Calories',
        value: t.calories,
        target: user?.dailyCalorieTarget ?? 1800,
        unit: 'kcal',
        color: '#2d9e8f',
        percent: pct(t.calories, user?.dailyCalorieTarget ?? 1800),
        over: t.calories > (user?.dailyCalorieTarget ?? 1800),
      },
      {
        label: 'Protein',
        value: t.protein,
        target: user?.proteinTarget ?? 120,
        unit: 'g',
        color: '#2d9e8f',
        percent: pct(t.protein, user?.proteinTarget ?? 120),
        over: t.protein > (user?.proteinTarget ?? 120),
      },
      {
        label: 'Carbohydrates',
        value: t.carbs,
        target: user?.carbsTarget ?? 200,
        unit: 'g',
        color: '#f59e0b',
        percent: pct(t.carbs, user?.carbsTarget ?? 200),
        over: t.carbs > (user?.carbsTarget ?? 200),
      },
      {
        label: 'Fats',
        value: t.fat,
        target: user?.fatTarget ?? 55,
        unit: 'g',
        color: '#f87171',
        percent: pct(t.fat, user?.fatTarget ?? 55),
        over: t.fat > (user?.fatTarget ?? 55),
      },
      {
        label: 'Fiber',
        value: t.fiber,
        target: user?.fiberTarget ?? 25,
        unit: 'g',
        color: '#a3e635',
        percent: pct(t.fiber, user?.fiberTarget ?? 25),
        over: t.fiber > (user?.fiberTarget ?? 25),
      },
    ];
  });

  /** Meal section descriptors used by the template. */
  protected mealSections = computed(() => {
    const groups = this.nutritionStore.recordsByMealType();
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

  /** Opens the meal entry detail dialog. */
  onViewEntry(record: MealRecord): void {
    this.selectedEntry.set(record);
  }

  showToast(text: string, type: string): void {
    this.toastMessage.set({ text, type });
    setTimeout(() => this.toastMessage.set(null), 3000);
  }

  async ngOnInit(): Promise<void> {
    await this.nutritionStore.fetchMealEntries();
    await this.nutritionStore.fetchDailyBalance();
    setTimeout(() => this.showGoalMetAlert.set(false), 4000);
  }

  // ─── Event Handlers ───────────────────────────────────────────────────────

  /** Removes a meal record and refreshes the balance. */
  async onRemoveEntry(id: number): Promise<void> {
    await this.nutritionStore.deleteMealEntry(id);
    this.showToast('Entry removed from daily log.', 'danger');
  }

  /** Opens the add food panel pre-selecting a meal type. */
  onAddFoodToMeal(mealType: MealType): void {
    this.targetMealType.set(mealType);
    setTimeout(() => {
      const input = document.querySelector('app-food-search-panel input') as HTMLInputElement;
      input?.focus();
    }, 100);
  }

  /**
   * Called when the user selects a food from the search panel.
   * Opens the blocked dialog if restricted, otherwise the add dialog.
   */
  onFoodSelected(food: FoodItem): void {
    const user = this.iamStore.currentUser();
    if (!user) return;
    if (food.isRestrictedFor(user.restrictions as DietaryRestriction[])) {
      this.blockedFood.set(food);
    } else {
      this.selectedFood.set(food);
    }
  }

  /** Persists the confirmed meal entry (MealRecorded event). */
  async onConfirmAdd(payload: AddFoodPayload): Promise<void> {
    const user = this.iamStore.currentUser();
    if (!user) return;

    const props: MealRecordProps = {
      id: 0,
      foodItemId: payload.food.id,
      foodItemName: payload.food.name,
      mealType: payload.mealType,
      quantity: payload.quantity,
      unit: payload.food.servingUnit,
      calories: payload.nutrients.calories,
      protein: payload.nutrients.protein,
      carbs: payload.nutrients.carbs,
      fat: payload.nutrients.fat,
      fiber: payload.nutrients.fiber,
      sugar: payload.nutrients.sugar,
      loggedAt: new Date().toISOString(),
      userId: user.id,
    };

    await this.nutritionStore.addMealEntry(new MealRecord(props));
    this.selectedFood.set(null);
    this.nutritionStore.clearSearch();
    this.showToast('Food added to your daily log.', 'success');
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
}
