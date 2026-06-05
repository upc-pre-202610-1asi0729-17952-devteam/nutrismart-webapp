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
      foodId:          r.food_id,
      name:            food?.name ?? r.food_id,
      nameKey:         food?.nameKey,
      category:        (food?.category ?? 'Other') as IngredientCategory,
      quantityGrams:   r.quantity_grams,
      caloriesPer100g: food?.caloriesPer100g ?? 0,
      userId:          r.userId,
      addedAt:         r.added_at,
    });
  }

  toResourceFromEntity(e: PantryItem): PantryItemResource {
    return {
      id:             e.id,
      food_id:        e.foodId ?? '',
      quantity_grams: e.quantityGrams,
      userId:         e.userId,
      added_at:       e.addedAt,
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
    const es   = this.translate.currentLang === 'es';
    const name = es && r.name_es ? r.name_es : r.name;
    return new RecipeSuggestion({
      id:                   r.id,
      name,
      nameKey:              r.name_key,
      calories:             r.calories,
      protein:              r.protein,
      carbs:                r.carbs,
      fat:                  r.fat,
      ingredients:          r.ingredients.map(i => ({ foodId: i.foodId, quantity_grams: i.quantity_grams })),
      goalType:             r.goal_type as UserGoal,
      prepTimeMinutes:      r.prep_time_minutes,
      coversMacroPct:       r.covers_macro_pct,
      restrictionsConflict: [...(r.restrictions_conflict ?? [])],
    });
  }

  toResourceFromEntity(e: RecipeSuggestion): RecipeSuggestionResource {
    return {
      id:                    e.id,
      name:                  e.name,
      name_key:              e.nameKey,
      calories:              e.calories,
      protein:               e.protein,
      carbs:                 e.carbs,
      fat:                   e.fat,
      ingredients:           e.ingredients,
      goal_type:             e.goalType,
      prep_time_minutes:     e.prepTimeMinutes,
      covers_macro_pct:      e.coversMacroPct,
      restrictions_conflict: e.restrictionsConflict,
    };
  }

  toEntitiesFromResponse(response: RecipeSuggestionsResponse): RecipeSuggestion[] {
    return response.suggestions.map(r => this.toEntityFromResource(r));
  }
}

