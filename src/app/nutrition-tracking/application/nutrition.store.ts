import { computed, inject, Injectable, signal } from '@angular/core';
import { debounceTime, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IamStore } from '../../iam/application/iam.store';
import { MealType } from '../domain/model/meal-type.enum';
import { FoodItem } from '../domain/model/food-item.entity';
import { MealRecord } from '../domain/model/meal-record.entity';
import { DailyIntake } from '../domain/model/daily-intake.entity';
import { NutritionApi } from '../infrastructure/nutrition-api';

/**
 * Central state store for the Nutrition Tracking bounded context.
 *
 * Manages food search results, daily meal records, and caloric balance
 * using Angular Signals. All mutations are persisted via {@link NutritionApi}.
 *
 * Provided in root so a single instance is shared across the application.
 *
 * @author Mora Rivera, Joel Fernando
 */
@Injectable({ providedIn: 'root' })
export class NutritionStore {
  private nutritionApi = inject(NutritionApi);
  private iamStore = inject(IamStore);

  // ─── Private Signals ──────────────────────────────────────────────────────

  private _allFoods    = signal<FoodItem[]>([]);
  private _foodItems   = signal<FoodItem[]>([]);
  private _mealRecords = signal<MealRecord[]>([]);
  private _dailyIntake = signal<DailyIntake | null>(null);
  private _loading     = signal<boolean>(false);
  private _error       = signal<string | null>(null);
  private _searchQuery = signal<string>('');

  /** Subject for debounced food search. */
  private _searchSubject = new Subject<string>();

  // ─── Public Read-only Signals ─────────────────────────────────────────────

  /** Food items matching the current search query. */
  readonly foodItems = this._foodItems.asReadonly();

  /** All meal records for the current day. */
  readonly mealRecords = this._mealRecords.asReadonly();

  /** Daily caloric balance entity. */
  readonly dailyIntake = this._dailyIntake.asReadonly();

  /** Whether an async operation is in flight. */
  readonly loading = this._loading.asReadonly();

  /** Last error message, or null. */
  readonly error = this._error.asReadonly();

  /** Current search query string. */
  readonly searchQuery = this._searchQuery.asReadonly();

  // ─── Computed Signals ─────────────────────────────────────────────────────

  /** Meal records grouped by meal type. */
  readonly recordsByMealType = computed(() => {
    const records = this._mealRecords();
    return {
      [MealType.BREAKFAST]: records.filter((r) => r.mealType === MealType.BREAKFAST),
      [MealType.LUNCH]: records.filter((r) => r.mealType === MealType.LUNCH),
      [MealType.SNACK]: records.filter((r) => r.mealType === MealType.SNACK),
      [MealType.DINNER]: records.filter((r) => r.mealType === MealType.DINNER),
    };
  });

  /** Aggregated daily totals from all meal records. */
  readonly dailyTotals = computed(() =>
    this._mealRecords().reduce(
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

  /** Whether consumed calories exceed the daily goal (DailyGoalExceeded event). */
  readonly isDailyGoalExceeded = computed(() => {
    const intake = this._dailyIntake();
    if (!intake) return false;
    return this.dailyTotals().calories > intake.dailyGoal;
  });

  /** Whether all 4 meal windows have at least one entry (DailyGoalMet check). */
  readonly allMealsLogged = computed(() => {
    const groups = this.recordsByMealType();
    return Object.values(groups).every((arr) => arr.length > 0);
  });

  constructor() {
    // Debounced local search pipeline — filters _allFoods in memory (no HTTP per keystroke)
    this._searchSubject
      .pipe(debounceTime(300), takeUntilDestroyed())
      .subscribe((query) => {
        const q = query.trim().toLowerCase();
        if (q.length < 2) {
          this._foodItems.set([]);
          this._loading.set(false);
          return;
        }
        this._foodItems.set(
          this._allFoods().filter(
            (f) =>
              f.name.toLowerCase().includes(q) ||
              (f.nameEs && f.nameEs.toLowerCase().includes(q)),
          ),
        );
        this._loading.set(false);
      });
  }

  // ─── Actions ──────────────────────────────────────────────────────────────

  /**
   * Triggers a debounced food search.
   *
   * @param query - Partial food name typed by the user.
   */
  /**
   * Loads all food items from the server once and caches them locally.
   * Must be called before any search is performed.
   */
  async loadAllFoods(): Promise<void> {
    if (this._allFoods().length > 0) return;
    return new Promise((resolve) => {
      this.nutritionApi.getAllFoods().subscribe({
        next: (foods) => { this._allFoods.set(foods); resolve(); },
        error: () => { this._error.set('Failed to load food catalog.'); resolve(); },
      });
    });
  }

  searchFoods(query: string): void {
    this._searchQuery.set(query);
    this._loading.set(query.trim().length >= 2);
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
  async fetchMealEntries(): Promise<void> {
    const user = this.iamStore.currentUser();
    if (!user) return;
    this._loading.set(true);
    this._error.set(null);
    return new Promise((resolve) => {
      this.nutritionApi.getMealEntries(user.id).subscribe({
        next: (records) => {
          const userId = String(user.id);
          this._mealRecords.set(records.filter((r) => String(r.userId) === userId));
          this._loading.set(false);
          resolve();
        },
        error: () => {
          this._error.set('Failed to load meal entries.');
          this._loading.set(false);
          resolve();
        },
      });
    });
  }

  /**
   * Persists a new meal record and updates local state.
   *
   * Emits the MealRecorded domain event on success.
   *
   * @param record - The {@link MealRecord} entity to save.
   * @returns Promise that resolves when the record is saved.
   */
  async addMealEntry(record: MealRecord): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    return new Promise((resolve, reject) => {
      this.nutritionApi.createMealEntry(record).subscribe({
        next: (created) => {
          this._mealRecords.update((prev) => [...prev, created]);
          this._loading.set(false);
          resolve();
        },
        error: () => {
          this._error.set('Failed to add meal entry.');
          this._loading.set(false);
          reject();
        },
      });
    });
  }

  /**
   * Updates an existing meal record and synchronises local state.
   *
   * @param record - The updated {@link MealRecord} entity.
   * @returns Promise that resolves when the update is complete.
   */
  async updateMealEntry(record: MealRecord): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    return new Promise((resolve, reject) => {
      this.nutritionApi.updateMealEntry(record).subscribe({
        next: (updated) => {
          this._mealRecords.update((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
          this._loading.set(false);
          resolve();
        },
        error: () => {
          this._error.set('Failed to update meal entry.');
          this._loading.set(false);
          reject();
        },
      });
    });
  }

  /**
   * Deletes a meal record and removes it from local state.
   *
   * @param id - Numeric ID of the record to delete.
   * @returns Promise that resolves when deletion is complete.
   */
  async deleteMealEntry(id: number): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    return new Promise((resolve, reject) => {
      this.nutritionApi.deleteMealEntry(id).subscribe({
        next: () => {
          this._mealRecords.update((prev) => prev.filter((r) => r.id !== id));
          this._loading.set(false);
          resolve();
        },
        error: () => {
          this._error.set('Failed to delete meal entry.');
          this._loading.set(false);
          reject();
        },
      });
    });
  }

  /**
   * Loads the daily caloric balance.
   *
   * @returns Promise that resolves when loading is complete.
   */
  async fetchDailyBalance(): Promise<void> {
    const user = this.iamStore.currentUser();
    if (!user) return;
    this._loading.set(true);
    this._error.set(null);
    return new Promise((resolve) => {
      this.nutritionApi.getDailyBalance().subscribe({
        next: (balances) => {
          const userId = String(user.id);
          const userBalance = (balances as any[]).find((b) => String(b.userId) === userId);
          this._dailyIntake.set(userBalance ?? null);
          this._loading.set(false);
          resolve();
        },
        error: () => {
          this._error.set('Failed to load daily balance.');
          this._loading.set(false);
          resolve();
        },
      });
    });
  }
}
