import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { FoodItem } from '../domain/model/food-item.entity';
import { MealRecord } from '../domain/model/meal-record.entity';
import { DailyIntake } from '../domain/model/daily-intake.entity';
import { FoodSearchEndpoint, NutritionLogEndpoint, DailyBalanceEndpoint } from './nutrition-api-endpoint';

/**
 * Application-facing API façade for the Nutrition Tracking bounded context.
 *
 * Wraps all nutrition endpoints and exposes domain-specific methods.
 * Components and {@link NutritionStore} should depend on this class.
 *
 * Provided in root so a single instance is shared across the application.
 *
 * @author Mora Rivera, Joel Fernando
 */
@Injectable({ providedIn: 'root' })
export class NutritionApi extends BaseApi {
  private foodSearchEndpoint: FoodSearchEndpoint;
  private nutritionLogEndpoint: NutritionLogEndpoint;
  private dailyBalanceEndpoint: DailyBalanceEndpoint;

  constructor() {
    super();
    const http = inject(HttpClient);
    this.foodSearchEndpoint   = new FoodSearchEndpoint(http);
    this.nutritionLogEndpoint = new NutritionLogEndpoint(http);
    this.dailyBalanceEndpoint = new DailyBalanceEndpoint(http);
  }

  /**
   * Searches food items by name applying a 400 ms debounce at the store level.
   *
   * @param query - Partial food name (minimum 2 characters recommended).
   * @returns Observable emitting matching {@link FoodItem} entities.
   */
  searchFoods(query: string): Observable<FoodItem[]> {
    return this.foodSearchEndpoint.searchByName(query);
  }

  /**
   * Fetches all meal records for the given user.
   *
   * @param userId - The authenticated user's numeric ID.
   * @returns Observable emitting an array of {@link MealRecord} entities.
   */
  getMealEntries(userId: any): Observable<MealRecord[]> {
    return this.nutritionLogEndpoint.getByUserId(userId);
  }

  /**
   * Creates a new meal record on the server.
   *
   * @param record - The {@link MealRecord} entity to persist.
   * @returns Observable emitting the created entity as returned by the server.
   */
  createMealEntry(record: MealRecord): Observable<MealRecord> {
    return this.nutritionLogEndpoint.create(record);
  }

  /**
   * Replaces an existing meal record with updated data.
   *
   * @param record - The updated {@link MealRecord} entity.
   * @returns Observable emitting the updated entity as returned by the server.
   */
  updateMealEntry(record: MealRecord): Observable<MealRecord> {
    return this.nutritionLogEndpoint.update(record, record.id);
  }

  /**
   * Deletes the meal record with the given ID.
   *
   * @param id - Numeric ID of the record to delete.
   * @returns Observable that completes when the deletion succeeds.
   */
  deleteMealEntry(id: number): Observable<void> {
    return this.nutritionLogEndpoint.delete(id);
  }

  /**
   * Fetches the daily caloric balance for the current day.
   *
   * @returns Observable emitting the {@link DailyIntake} entity.
   */
  getDailyBalance(): Observable<DailyIntake[]> {
    return this.dailyBalanceEndpoint.getAll();
  }
}
