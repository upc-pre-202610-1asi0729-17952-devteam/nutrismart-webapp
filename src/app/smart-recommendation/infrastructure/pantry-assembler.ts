import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { UserGoal } from '../../iam/domain/model/user-goal.enum';
import { PantryItem, IngredientCategory } from '../domain/model/pantry-item.entity';
import { RecipeSuggestion } from '../domain/model/recipe-suggestion.entity';
import { IngredientCatalogItem } from '../domain/model/ingredient-catalog-item.entity';
import {
  PantryItemResource,
  PantryItemsResponse,
  RecipeSuggestionResource,
  RecipeSuggestionsResponse,
  IngredientCatalogResource,
} from './pantry-resource';

/**
 * Maps between {@link PantryItem} domain entities and their API resource DTOs.
 *
 * @author Del Aguila Del Aguila, Olenka Priscilla
 */
export class PantryItemAssembler
  implements BaseAssembler<PantryItem, PantryItemResource, PantryItemsResponse>
{
  toEntityFromResource(r: PantryItemResource): PantryItem {
    return new PantryItem({
      id:              r.id,
      name:            r.name,
      nameKey:         r.name_key,
      category:        r.category as IngredientCategory,
      quantityGrams:   r.quantity_grams,
      caloriesPer100g: r.calories_per_100g,
      userId:          r.user_id,
      addedAt:         r.added_at,
    });
  }

  toResourceFromEntity(e: PantryItem): PantryItemResource {
    return {
      id:                e.id,
      name:              e.name,
      name_key:          e.nameKey,
      category:          e.category,
      quantity_grams:    e.quantityGrams,
      calories_per_100g: e.caloriesPer100g,
      user_id:           e.userId,
      added_at:          e.addedAt,
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
  toEntityFromResource(r: RecipeSuggestionResource): RecipeSuggestion {
    return new RecipeSuggestion({
      id:              r.id,
      name:            r.name,
      nameKey:         r.name_key,
      calories:        r.calories,
      protein:         r.protein,
      carbs:           r.carbs,
      fat:             r.fat,
      ingredients:     [...r.ingredients],
      goalType:        r.goal_type as UserGoal,
      prepTimeMinutes: r.prep_time_minutes,
      coversMacroPct:  r.covers_macro_pct,
    });
  }

  toResourceFromEntity(e: RecipeSuggestion): RecipeSuggestionResource {
    return {
      id:                e.id,
      name:              e.name,
      name_key:          e.nameKey,
      calories:          e.calories,
      protein:           e.protein,
      carbs:             e.carbs,
      fat:               e.fat,
      ingredients:       e.ingredients,
      goal_type:         e.goalType,
      prep_time_minutes: e.prepTimeMinutes,
      covers_macro_pct:  e.coversMacroPct,
    };
  }

  toEntitiesFromResponse(response: RecipeSuggestionsResponse): RecipeSuggestion[] {
    return response.suggestions.map(r => this.toEntityFromResource(r));
  }
}

export class IngredientCatalogAssembler {
  toEntityFromResource(r: IngredientCatalogResource): IngredientCatalogItem {
    return new IngredientCatalogItem(r.id, r.name_key, r.category as IngredientCategory);
  }
}
