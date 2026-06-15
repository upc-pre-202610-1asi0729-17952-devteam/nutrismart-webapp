import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

/**
 * API resource DTO for a single pantry ingredient.
 *
 * @author Del Aguila Del Aguila, Olenka Priscilla
 */
export interface PantryItemResource extends BaseResource {
  foodId: string;
  quantityG: number;
  userId: number;
}

/**
 * API resource DTO for a single recipe suggestion.
 *
 * @author Del Aguila Del Aguila, Olenka Priscilla
 */
export interface RecipeSuggestionResource extends BaseResource {
  name: string;
  nameEs?: string;
  goalType: string;
  prepTimeMinutes: number;
  estimatedCalories: number;
  estimatedProtein: number;
  estimatedCarbs: number;
  estimatedFat: number;
  ingredients: string[];
}

/** Response envelope for pantry-item list endpoints. */
export interface PantryItemsResponse extends BaseResponse {
  items: PantryItemResource[];
}

/** Response envelope for recipe-suggestion list endpoints. */
export interface RecipeSuggestionsResponse extends BaseResponse {
  suggestions: RecipeSuggestionResource[];
}

