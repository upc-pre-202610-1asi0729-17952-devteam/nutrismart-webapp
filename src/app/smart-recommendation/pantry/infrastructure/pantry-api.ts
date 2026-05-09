import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { BaseApi } from '../../../shared/infrastructure/base-api';
import { UserGoal } from '../../../iam/domain/model/user-goal.enum';
import { PantryItem } from '../domain/model/pantry-item.entity';
import { RecipeSuggestion } from '../domain/model/recipe-suggestion.entity';

/**
 * Application-facing API façade for the Pantry feature (Smart Recommendation context).
 *
 * All methods return mock data until a real backend is available.
 *
 * @author Del Aguila Del Aguila, Olenka Priscilla
 */
@Injectable({ providedIn: 'root' })
export class PantryApi extends BaseApi {
  private _http: HttpClient;

  constructor() {
    super();
    this._http = inject(HttpClient);
  }

  /**
   * Fetches the current user's pantry ingredient list (RegisterPantryItems read).
   *
   * @param userId - Authenticated user's numeric ID.
   * @returns Observable emitting the array of {@link PantryItem} entities.
   */
  getPantryItems(userId: number): Observable<PantryItem[]> {
    return of(this._mockPantryItems(userId));
  }

  /**
   * Adds a new ingredient to the pantry (PantryUpdated event trigger).
   *
   * @param item - The {@link PantryItem} to persist.
   * @returns Observable emitting the created entity as returned by the server.
   */
  addPantryItem(item: PantryItem): Observable<PantryItem> {
    const saved = new PantryItem({
      id:              Math.floor(Math.random() * 10000) + 100,
      name:            item.name,
      category:        item.category,
      quantityGrams:   item.quantityGrams,
      caloriesPer100g: item.caloriesPer100g,
      userId:          item.userId,
      addedAt:         new Date().toISOString(),
    });
    return of(saved);
  }

  /**
   * Removes an ingredient from the pantry (PantryUpdated event trigger).
   *
   * @param itemId - Numeric ID of the pantry item to delete.
   * @returns Observable that completes when deletion succeeds.
   */
  deletePantryItem(itemId: number): Observable<void> {
    return of(void 0);
  }

  /**
   * Retrieves recipe suggestions based on pantry contents and remaining macros
   * (SuggestRecipe command).
   *
   * @param userId    - Authenticated user's numeric ID.
   * @param goalType  - User's current fitness goal (drives ranking algorithm).
   * @returns Observable emitting an array of {@link RecipeSuggestion} entities.
   */
  getRecipeSuggestions(userId: number, goalType: UserGoal): Observable<RecipeSuggestion[]> {
    return of(this._mockRecipes(goalType));
  }

  // ─── Mock builders ────────────────────────────────────────────────────────

  private _mockPantryItems(userId: number): PantryItem[] {
    return [
      new PantryItem({ id: 1, name: 'White rice',    category: 'Grain',          quantityGrams: 500, caloriesPer100g: 130, userId, addedAt: new Date().toISOString() }),
      new PantryItem({ id: 2, name: 'Chicken breast', category: 'Animal protein', quantityGrams: 400, caloriesPer100g: 165, userId, addedAt: new Date().toISOString() }),
      new PantryItem({ id: 3, name: 'Lemon',          category: 'Fruit',          quantityGrams: 100, caloriesPer100g: 29,  userId, addedAt: new Date().toISOString() }),
      new PantryItem({ id: 4, name: 'Onion',          category: 'Vegetable',      quantityGrams: 200, caloriesPer100g: 40,  userId, addedAt: new Date().toISOString() }),
      new PantryItem({ id: 5, name: 'Garlic',         category: 'Seasoning',      quantityGrams: 50,  caloriesPer100g: 149, userId, addedAt: new Date().toISOString() }),
    ];
  }

  private _mockRecipes(goalType: UserGoal): RecipeSuggestion[] {
    if (goalType === UserGoal.MUSCLE_GAIN) {
      return [
        new RecipeSuggestion({ id: 1, name: 'Chicken breast with quinoa', calories: 540, protein: 52, carbs: 38, fat: 12, ingredients: ['chicken breast', 'quinoa', 'garlic', 'lemon'], goalType: UserGoal.MUSCLE_GAIN, prepTimeMinutes: 30, coversMacroPct: 43 }),
        new RecipeSuggestion({ id: 2, name: 'Rice and chicken bowl',      calories: 480, protein: 38, carbs: 52, fat: 8,  ingredients: ['white rice', 'chicken breast', 'onion', 'garlic'], goalType: UserGoal.MUSCLE_GAIN, prepTimeMinutes: 25, coversMacroPct: 32 }),
      ];
    }
    return [
      new RecipeSuggestion({ id: 3, name: 'Chicken and Cucumber Salad', calories: 480, protein: 18, carbs: 22, fat: 8, ingredients: ['chicken breast', 'onion', 'garlic', 'lemon'], goalType: UserGoal.WEIGHT_LOSS, prepTimeMinutes: 15, coversMacroPct: 25 }),
      new RecipeSuggestion({ id: 4, name: 'Lemon garlic rice',          calories: 340, protein: 6,  carbs: 64, fat: 4, ingredients: ['white rice', 'lemon', 'garlic', 'onion'],         goalType: UserGoal.WEIGHT_LOSS, prepTimeMinutes: 20, coversMacroPct: 20 }),
    ];
  }
}
