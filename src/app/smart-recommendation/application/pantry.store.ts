import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { IamStore } from '../../iam/application/iam.store';
import { NutritionStore } from '../../nutrition-tracking/application/nutrition.store';
import { DomainEventBus } from '../../shared/application/domain-event-bus';
import { PantryUpdated } from '../../shared/domain/pantry-updated.event';
import { RecipeSuggested } from '../../shared/domain/recipe-suggested.event';
import { UserGoal } from '../../iam/domain/model/user-goal.enum';
import { PantryItem, IngredientCategory } from '../domain/model/pantry-item.entity';
import { RecipeSuggestion } from '../domain/model/recipe-suggestion.entity';
import { IngredientCatalogItem } from '../domain/model/ingredient-catalog-item.entity';
import { PantryApi } from '../infrastructure/pantry-api';

/**
 * Central state store for the Pantry feature (Smart Recommendation context).
 *
 * Manages pantry ingredient list and recipe suggestions using Angular Signals.
 * All mutations trigger a reactive recipe refresh via {@link _refreshSuggestions}.
 *
 * @author Del Aguila Del Aguila, Olenka Priscilla
 */
@Injectable({ providedIn: 'root' })
export class PantryStore {
  private pantryApi       = inject(PantryApi);
  private iamStore        = inject(IamStore);
  private nutritionStore  = inject(NutritionStore);
  private eventBus        = inject(DomainEventBus);

  // ─── Private Signals ──────────────────────────────────────────────────────

  private _pantryItems       = signal<PantryItem[]>([]);
  private _recipeSuggestions = signal<RecipeSuggestion[]>([]);
  private _catalog           = signal<IngredientCatalogItem[]>([]);
  private _loading           = signal<boolean>(false);
  private _error             = signal<string | null>(null);
  private _searchQuery       = signal<string>('');

  // ─── Public Read-only Signals ─────────────────────────────────────────────

  readonly pantryItems       = this._pantryItems.asReadonly();
  readonly recipeSuggestions = this._recipeSuggestions.asReadonly();
  readonly catalog           = this._catalog.asReadonly();
  readonly loading           = this._loading.asReadonly();
  readonly error             = this._error.asReadonly();
  readonly searchQuery       = this._searchQuery.asReadonly();

  // ─── Computed Signals ─────────────────────────────────────────────────────

  /** True when the pantry contains no ingredients. */
  readonly isEmpty = computed(() => this._pantryItems().length === 0);

  /** Daily caloric intake consumed so far, summed from today's meal records. */
  readonly dailyConsumed = computed(() =>
    Math.round(
      this.nutritionStore.mealRecords()
        .filter(r => r.isFromToday)
        .reduce((sum, r) => sum + r.calories, 0) * 10,
    ) / 10,
  );

  /** User's daily calorie goal. */
  readonly dailyGoal = computed(() => {
    const user = this.iamStore.currentUser();
    return user?.dailyCalorieTarget ?? 1800;
  });

  /** Remaining kilocalories for the day. */
  readonly remainingCalories = computed(() =>
    Math.max(0, this.dailyGoal() - this.dailyConsumed()),
  );

  /** Remaining protein grams for today. */
  readonly remainingProtein = computed(() => {
    const user = this.iamStore.currentUser();
    const consumedProtein = Math.round(
      this.nutritionStore.mealRecords()
        .filter(r => r.isFromToday)
        .reduce((sum, r) => sum + r.protein, 0) * 10,
    ) / 10;
    return Math.max(0, (user?.proteinTarget ?? 120) - consumedProtein);
  });

  /** The user's current fitness goal. */
  readonly userGoal = computed(() => {
    const user = this.iamStore.currentUser();
    return user?.goal ?? UserGoal.WEIGHT_LOSS;
  });

  constructor() {
    effect(() => {
      const goal = this.iamStore.currentUser()?.goal;
      untracked(() => {
        if (goal !== undefined && this._pantryItems().length > 0) {
          this._refreshSuggestions();
        }
      });
    });
  }

  // ─── Actions ──────────────────────────────────────────────────────────────

  /** Loads the ingredient catalog from the API. */
  fetchCatalog(): void {
    this.pantryApi.getIngredientCatalog().subscribe({
      next:  (items) => this._catalog.set(items),
      error: () => this._error.set('Failed to load ingredient catalog.'),
    });
  }

  /** Loads the pantry items and initial recipe suggestions for the current user. */
  async fetchPantryItems(): Promise<void> {
    const user = this.iamStore.currentUser();
    if (!user) return;
    this._loading.set(true);
    this._error.set(null);

    return new Promise((resolve) => {
      this.pantryApi.getPantryItems(user.id).subscribe({
        next: (items) => {
          this._pantryItems.set(items);
          this._loading.set(false);
          resolve();
          this._refreshSuggestions();
        },
        error: () => {
          this._error.set('Failed to load pantry items.');
          this._loading.set(false);
          resolve();
        },
      });
    });
  }

  /**
   * Adds a new ingredient to the pantry and refreshes recipe suggestions
   * (PantryUpdated event trigger).
   *
   * @param name            - Ingredient name entered by the user.
   * @param category        - Ingredient category.
   * @param quantityGrams   - Amount in grams.
   * @param caloriesPer100g - Caloric density.
   */
  async addPantryItem(
    name: string,
    category: IngredientCategory,
    quantityGrams: number,
    caloriesPer100g: number,
    nameKey?: string,
  ): Promise<void> {
    const user = this.iamStore.currentUser();
    if (!user) return;

    const item = new PantryItem({
      id:              0,
      name,
      nameKey,
      category,
      quantityGrams,
      caloriesPer100g,
      userId:          user.id,
      addedAt:         new Date().toISOString(),
    });

    this._loading.set(true);
    return new Promise((resolve) => {
      this.pantryApi.addPantryItem(item).subscribe({
        next: (created) => {
          this._pantryItems.update(prev => [...prev, created]);
          this._loading.set(false);
          resolve();
          this.eventBus.publish(new PantryUpdated(user.id, 'added', nameKey ?? name));
          this._refreshSuggestions();
        },
        error: () => {
          this._error.set('Failed to add ingredient.');
          this._loading.set(false);
          resolve();
        },
      });
    });
  }

  /**
   * Removes an ingredient from the pantry and refreshes recipe suggestions
   * (PantryUpdated event trigger).
   *
   * @param itemId - Numeric ID of the pantry item to remove.
   */
  async deletePantryItem(itemId: number): Promise<void> {
    const user    = this.iamStore.currentUser();
    const removed = this._pantryItems().find(i => i.id === itemId);
    this._loading.set(true);
    return new Promise((resolve) => {
      this.pantryApi.deletePantryItem(itemId).subscribe({
        next: () => {
          this._pantryItems.update(prev => prev.filter(i => i.id !== itemId));
          this._loading.set(false);
          resolve();
          if (user && removed) {
            this.eventBus.publish(new PantryUpdated(user.id, 'removed', removed.nameKey ?? removed.name));
          }
          this._refreshSuggestions();
        },
        error: () => {
          this._error.set('Failed to remove ingredient.');
          this._loading.set(false);
          resolve();
        },
      });
    });
  }

  /** Updates the search query signal (used to filter ingredient search results). */
  setSearchQuery(query: string): void {
    this._searchQuery.set(query);
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  /**
   * Fetches fresh recipe suggestions after any pantry mutation.
   *
   * Fires-and-forgets — errors are surfaced via the error signal.
   */
  private _refreshSuggestions(): void {
    const user = this.iamStore.currentUser();
    if (!user || this._pantryItems().length === 0) {
      this._recipeSuggestions.set([]);
      return;
    }

    const pantryKeys        = new Set(
      this._pantryItems()
        .map(i => i.nameKey)
        .filter((k): k is string => !!k),
    );
    const userRestrictions  = user.restrictions as string[] ?? [];

    this.pantryApi.getRecipeSuggestions(user.goal).subscribe({
      next: (all) => {
        const matched = all.filter(recipe =>
          recipe.isCompatibleWith(pantryKeys) && !recipe.hasConflictWith(userRestrictions),
        );
        this._recipeSuggestions.set(matched);
        const top = matched[0];
        if (top) {
          this.eventBus.publish(new RecipeSuggested(user.id, top.name, top.calories, top.protein, top.carbs, top.fat));
        }
      },
      error: () => this._error.set('Failed to load recipe suggestions.'),
    });
  }
}
