import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

/**
 * API resource DTO for a food item as returned by the `/foods` endpoint.
 *
 * @author Mora Rivera, Joel Fernando
 */
export interface FoodItemResource extends BaseResource {
  id: number;
  name: string;
  nameEs?: string;
  source: string;
  servingSize: number;
  servingUnit: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
  sugarPer100g: number;
  restrictions: string[];
  /** Machine-readable key matching pantry/recipe ingredient identifiers. */
  nameKey?: string;
  /** Food category (e.g. "Grain", "Prepared dish"). */
  category?: string;
  itemType?: 'INGREDIENT' | 'DISH';
  weatherTypes?: string[];
  originCity?: string | null;
  originCountry?: string | null;
}

/** Envelope for the `/foods` collection endpoint. */
export interface FoodItemsResponse extends BaseResponse {
  foods: FoodItemResource[];
}

/**
 * API resource DTO for a meal record as returned by the `/nutrition-log` endpoint.
 *
 * @author Mora Rivera, Joel Fernando
 */
export interface MealRecordResource extends BaseResource {
  id: number;
  foodId: string | null;
  foodItemName: string;
  foodItemNameEs?: string;
  mealType: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  loggedAt: string;
  userId: number;
}

/** Envelope for the `/nutrition-log` collection endpoint. */
export interface MealRecordsResponse extends BaseResponse {
  records: MealRecordResource[];
}

/**
 * API resource DTO for the daily balance as returned by the `/daily-balance` endpoint.
 *
 * @author Mora Rivera, Joel Fernando
 */
export interface DailyIntakeResource extends BaseResource {
  id: number;
  userId: number;
  date: string;
  dailyGoal: number;
  consumed: number;
  active: number;
}

/** Envelope for the `/daily-balance` collection endpoint. */
export interface DailyIntakeResponse extends BaseResponse {
  balance: DailyIntakeResource;
}
