import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { DietaryRestriction } from '../../iam/domain/model/dietary-restriction.enum';
import { MealType } from '../../nutrition-tracking/domain/model/meal-type.enum';
import { MacronutrientDistribution } from '../../nutrition-tracking/domain/model/macronutrient-distribution.value-object';
import { ScannedFoodItem } from '../domain/model/scanned-food-item.entity';
import { ScanResult } from '../domain/model/scan-result.entity';
import {
  MenuAnalysis,
  RankedDish,
  RestrictedDish,
} from '../domain/model/menu-analysis.entity';
import {
  MenuAnalysisResource,
  MenuAnalysisResponse,
  ScanResultResource,
  ScanResultsResponse,
} from './smart-scan-resource';

/**
 * Maps between {@link ScanResult} domain entities and their API resource DTOs.
 *
 * @author Del Aguila Del Aguila, Olenka Priscilla
 */
export class ScanResultAssembler
  implements BaseAssembler<ScanResult, ScanResultResource, ScanResultsResponse>
{
  toEntityFromResource(r: ScanResultResource): ScanResult {
    return new ScanResult({
      id:     r.id,
      status: r.status as any,
      imageBase64: r.image_base64,
      detectedItems: r.detected_items.map((item, idx) => new ScannedFoodItem({
        id:            item.id ?? idx + 1,
        name:          item.name,
        nameKey:       item.name_key ?? null,
        quantityGrams: item.quantity_grams,
        macros: new MacronutrientDistribution({
          calories: item.calories, protein: item.protein,
          carbs: item.carbs, fat: item.fat, fiber: 0, sugar: 0,
        }),
        restrictions:  item.restrictions.map(s => s as DietaryRestriction),
        isEdited:      item.is_edited,
      })),
      mealType:   r.meal_type as MealType,
      source:     r.source,
      scannedAt:  r.scanned_at,
    });
  }

  toResourceFromEntity(e: ScanResult): ScanResultResource {
    return {
      id:           e.id,
      status:       e.status,
      image_base64: e.imageBase64,
      detected_items: e.detectedItems.map(item => ({
        id:             item.id,
        name:           item.name,
        name_key:       item.nameKey,
        quantity_grams: item.quantityGrams,
        calories:       item.calories,
        protein:        item.protein,
        carbs:          item.carbs,
        fat:            item.fat,
        restrictions:   item.restrictions,
        is_edited:      item.isEdited,
      })),
      meal_type:   e.mealType,
      source:      e.source,
      scanned_at:  e.scannedAt,
    };
  }

  toEntitiesFromResponse(response: ScanResultsResponse): ScanResult[] {
    return response.results.map(r => this.toEntityFromResource(r));
  }
}

/**
 * Maps between {@link MenuAnalysis} domain entities and their API resource DTOs.
 *
 * @author Del Aguila Del Aguila, Olenka Priscilla
 */
export class MenuAnalysisAssembler
  implements BaseAssembler<MenuAnalysis, MenuAnalysisResource, MenuAnalysisResponse>
{
  toEntityFromResource(r: MenuAnalysisResource): MenuAnalysis {
    const ranked: RankedDish[] = r.ranked_dishes.map(d => ({
      rank:             d.rank,
      name:             d.name,
      nameKey:          d.name_key ?? null,
      calories:         d.calories,
      protein:          d.protein,
      carbs:            d.carbs,
      fat:              d.fat,
      compatibilityScore: d.compatibility_score,
      justification:    d.justification,
      justificationKey: d.justification_key ?? null,
    }));
    const restricted: RestrictedDish[] = r.restricted_dishes.map(d => ({
      name:        d.name,
      nameKey:     d.name_key ?? null,
      restriction: d.restriction as DietaryRestriction,
    }));
    return new MenuAnalysis({
      id:               r.id,
      rankedDishes:     ranked,
      restrictedDishes: restricted,
      scannedAt:        r.scanned_at,
      restaurantName:   r.restaurant_name,
    });
  }

  toResourceFromEntity(e: MenuAnalysis): MenuAnalysisResource {
    return {
      id:              e.id,
      ranked_dishes:   e.rankedDishes.map(d => ({
        rank:                d.rank,
        name:                d.name,
        name_key:            d.nameKey,
        calories:            d.calories,
        protein:             d.protein,
        carbs:               d.carbs,
        fat:                 d.fat,
        compatibility_score: d.compatibilityScore,
        justification:       d.justification,
        justification_key:   d.justificationKey,
      })),
      restricted_dishes: e.restrictedDishes.map(d => ({
        name:        d.name,
        name_key:    d.nameKey,
        restriction: d.restriction,
      })),
      scanned_at:      e.scannedAt,
      restaurant_name: e.restaurantName,
    };
  }

  toEntitiesFromResponse(response: MenuAnalysisResponse): MenuAnalysis[] {
    return response.analyses.map(r => this.toEntityFromResource(r));
  }
}
