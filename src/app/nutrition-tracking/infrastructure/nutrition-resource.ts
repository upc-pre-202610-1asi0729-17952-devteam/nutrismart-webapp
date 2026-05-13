import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

/**
 * API resource DTO for a food item as returned by the `/foods` endpoint.
 *
 * @author Mora Rivera, Joel Fernando
 */
export interface FoodItemResource extends BaseResource {
  id: number;
  name: string;
  name_es?: string;
  source: string;
  serving_size: number;
  serving_unit: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g: number;
  sugar_per_100g: number;
  restrictions: string[];
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
  foodItemId: number;
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
  daily_goal: number;
  consumed: number;
  active: number;
}

/** Envelope for the `/daily-balance` collection endpoint. */
export interface DailyIntakeResponse extends BaseResponse {
  balance: DailyIntakeResource;
}
