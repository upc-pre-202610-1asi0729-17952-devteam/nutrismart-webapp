import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

/**
 * API resource DTO for a single pantry ingredient.
 *
 * @author Del Aguila Del Aguila, Olenka Priscilla
 */
export interface PantryItemResource extends BaseResource {
  name: string;
  name_key?: string;
  category: string;
  quantity_grams: number;
  calories_per_100g: number;
  user_id: number;
  added_at: string;
}

/**
 * API resource DTO for a single recipe suggestion.
 *
 * @author Del Aguila Del Aguila, Olenka Priscilla
 */
export interface RecipeSuggestionResource extends BaseResource {
  name: string;
  name_key?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  goal_type: string;
  prep_time_minutes: number;
  covers_macro_pct: number;
}

/** Response envelope for pantry-item list endpoints. */
export interface PantryItemsResponse extends BaseResponse {
  items: PantryItemResource[];
}

/** Response envelope for recipe-suggestion list endpoints. */
export interface RecipeSuggestionsResponse extends BaseResponse {
  suggestions: RecipeSuggestionResource[];
}

export interface IngredientCatalogResource extends BaseResource {
  name_key: string;
  category: string;
}
