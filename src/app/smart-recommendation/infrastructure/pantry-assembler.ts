import { TranslateService } from '@ngx-translate/core';
import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { UserGoal } from '../../iam/domain/model/user-goal.enum';
import { FoodItem } from '../../nutrition-tracking/domain/model/food-item.entity';
import { PantryItem, IngredientCategory } from '../domain/model/pantry-item.entity';
import { RecipeSuggestion } from '../domain/model/recipe-suggestion.entity';
import {
  PantryItemResource,
  PantryItemsResponse,
  RecipeSuggestionResource,
  RecipeSuggestionsResponse,
} from './pantry-resource';

/**
 * Maps between {@link PantryItem} domain entities and their API resource DTOs.
 *
 * @author Del Aguila Del Aguila, Olenka Priscilla
 */
export class PantryItemAssembler
  implements BaseAssembler<PantryItem, PantryItemResource, PantryItemsResponse>
{
  toEntityFromResource(r: PantryItemResource, food?: FoodItem): PantryItem {
    return new PantryItem({
      id:              r.id,
      foodId:          r.foodId,
      name:            food?.name ?? r.foodId,
      nameEs:          food?.nameEs ?? '',
      nameKey:         food?.nameKey,
      category:        (food?.category ?? 'Other') as IngredientCategory,
      quantityGrams:   r.quantityG,
      caloriesPer100g: food?.caloriesPer100g ?? 0,
      userId:          r.userId,
      addedAt:         '',
    });
  }

  toResourceFromEntity(e: PantryItem): PantryItemResource {
    return {
      id:       e.id,
      foodId:   e.foodId ?? '',
      quantityG: e.quantityGrams,
      userId:   e.userId,
    };
  }

  toEntitiesFromResponse(response: PantryItemsResponse): PantryItem[] {
    return response.items.map(r => this.toEntityFromResource(r));
  }
}

/**
 * Maps between {@link RecipeSuggestion} domain entities and their API resource DTOs.
 *
 * @author Del Aguila Del Aguila, Olenka Priscilla
 */
export class RecipeSuggestionAssembler
  implements BaseAssembler<RecipeSuggestion, RecipeSuggestionResource, RecipeSuggestionsResponse>
{
  constructor(private readonly translate: TranslateService) {}

  toEntityFromResource(r: RecipeSuggestionResource): RecipeSuggestion {
    return new RecipeSuggestion({
      id:                   r.id,
      name:                 r.name,
      nameEs:               r.nameEs,
      calories:             r.estimatedCalories,
      protein:              r.estimatedProtein,
      carbs:                r.estimatedCarbs,
      fat:                  r.estimatedFat,
      ingredients:          r.ingredients.map(s => ({ nameKey: s, quantityGrams: 0 })),
      goalType:             r.goalType as UserGoal,
      prepTimeMinutes:      r.prepTimeMinutes,
      coversMacroPct:       0,
      restrictionsConflict: [],
    });
  }

  toResourceFromEntity(e: RecipeSuggestion): RecipeSuggestionResource {
    return {
      id:                e.id,
      name:              e.name,
      nameEs:            e.nameEs,
      goalType:          e.goalType,
      prepTimeMinutes:   e.prepTimeMinutes,
      estimatedCalories: e.calories,
      estimatedProtein:  e.protein,
      estimatedCarbs:    e.carbs,
      estimatedFat:      e.fat,
      ingredients:       e.ingredients.map(i => i.nameKey),
    };
  }

  toEntitiesFromResponse(response: RecipeSuggestionsResponse): RecipeSuggestion[] {
    return response.suggestions.map(r => this.toEntityFromResource(r));
  }
}

