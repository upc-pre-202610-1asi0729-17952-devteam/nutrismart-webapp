import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
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

  /** Meal type where the user wants to add the selected food. */
  protected targetMealType = signal<MealType>(MealType.LUNCH);

  /** Food blocked due to restriction — drives the Restricted Item dialog. */
  protected blockedFood = signal<FoodItem | null>(null);

  /** Demo state: which meals are marked as skipped (T21). */
  private skippedMeals = signal<MealType[]>([]);

  protected showGoalMetAlert = signal(false);

  /** Currently selected date for the day navigator. */
  protected selectedDate = signal<Date>(new Date());

  /** Meal record selected for detail view. */
  protected selectedEntry = signal<MealRecord | null>(null);

  constructor() {
    effect(() => {
      if (this.allMealsLogged() && !this.isDailyGoalExceeded()) {
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

  private filteredRecords = computed(() => {
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

  private filteredTotals = computed(() =>
    this.filteredRecords().reduce(
      (acc, r) => ({
        calories: Math.round((acc.calories + r.calories) * 10) / 10,
        protein: Math.round((acc.protein + r.protein) * 10) / 10,
        carbs: Math.round((acc.carbs + r.carbs) * 10) / 10,
        fat: Math.round((acc.fat + r.fat) * 10) / 10,
        fiber: Math.round((acc.fiber + r.fiber) * 10) / 10,
        sugar: Math.round((acc.sugar + r.sugar) * 10) / 10,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 },
    ),
  );

  // ─── Computed ─────────────────────────────────────────────────────────────

  /** Whether the daily goal has been exceeded for the selected date (T22). */
  protected isDailyGoalExceeded = computed(() => {
    const intake = this.nutritionStore.dailyIntake();
    if (!intake) return false;
    return this.filteredTotals().calories > intake.dailyGoal;
  });

  /** Whether all 4 meal windows are logged for the selected date (T22). */
  protected allMealsLogged = computed(() =>
    Object.values(this.filteredByMealType()).every((arr) => arr.length > 0),
  );

  /** Kilocalories consumed beyond the daily goal (T22). */
  protected exceededBy = computed(() => {
    const intake = this.nutritionStore.dailyIntake();
    if (!intake) return 0;
    return Math.abs(this.filteredTotals().calories - intake.dailyGoal);
  });

  /** Summary bar macro descriptors. */
  protected summaryMacros = computed(() => {
    const user = this.iamStore.currentUser();
    const t = this.filteredTotals();
    const pct = (v: number, max: number) => Math.min(Math.round((v / max) * 100), 100);

    return [
      {
        label: 'nutrition.calories',
        value: t.calories,
        target: user?.dailyCalorieTarget ?? 1800,
        unit: 'kcal',
        color: '#2d9e8f',
        percent: pct(t.calories, user?.dailyCalorieTarget ?? 1800),
        over: t.calories > (user?.dailyCalorieTarget ?? 1800),
      },
      {
        label: 'nutrition.protein',
        value: t.protein,
        target: user?.proteinTarget ?? 120,
        unit: 'g',
        color: '#2d9e8f',
        percent: pct(t.protein, user?.proteinTarget ?? 120),
        over: t.protein > (user?.proteinTarget ?? 120),
      },
      {
        label: 'nutrition.carbohydrates',
        value: t.carbs,
        target: user?.carbsTarget ?? 200,
        unit: 'g',
        color: '#f59e0b',
        percent: pct(t.carbs, user?.carbsTarget ?? 200),
        over: t.carbs > (user?.carbsTarget ?? 200),
      },
      {
        label: 'nutrition.fats',
        value: t.fat,
        target: user?.fatTarget ?? 55,
        unit: 'g',
        color: '#f87171',
        percent: pct(t.fat, user?.fatTarget ?? 55),
        over: t.fat > (user?.fatTarget ?? 55),
      },
      {
        label: 'nutrition.fiber',
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
    await this.nutritionStore.fetchMealEntries();
    await this.nutritionStore.fetchDailyBalance();
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

  /** Opens the meal entry detail dialog. */
  onViewEntry(record: MealRecord): void {
    this.selectedEntry.set(record);
  }

  /** Removes a meal record and refreshes the balance. */
  async onRemoveEntry(id: number): Promise<void> {
    await this.nutritionStore.deleteMealEntry(id);
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

    await this.nutritionStore.addMealEntry(new MealRecord(props));
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

  /** Updates a meal entry's quantity and recalculates macros proportionally. */
  async onEditEntry(payload: { id: number; quantity: number }): Promise<void> {
    const original = this.nutritionStore.mealRecords().find((r) => r.id === payload.id);
    if (!original || original.quantity === 0) return;
    const ratio = payload.quantity / original.quantity;
    const updated = new MealRecord({
      id: original.id,
      foodItemId: original.foodItemId,
      foodItemName: original.foodItemName,
      foodItemNameEs: original.foodItemNameEs,
      mealType: original.mealType,
      quantity: payload.quantity,
      unit: original.unit,
      calories: Math.round(original.calories * ratio * 10) / 10,
      protein: Math.round(original.protein * ratio * 10) / 10,
      carbs: Math.round(original.carbs * ratio * 10) / 10,
      fat: Math.round(original.fat * ratio * 10) / 10,
      fiber: Math.round(original.fiber * ratio * 10) / 10,
      sugar: Math.round(original.sugar * ratio * 10) / 10,
      loggedAt: original.loggedAt,
      userId: original.userId,
    });
    await this.nutritionStore.updateMealEntry(updated);
    this.selectedEntry.set(null);
  }
}
