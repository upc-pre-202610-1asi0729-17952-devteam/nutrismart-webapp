import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { DietaryRestriction } from '../../iam/domain/model/dietary-restriction.enum';
import { MealType } from '../domain/model/meal-type.enum';
import { MacronutrientDistribution } from '../domain/model/macronutrient-distribution.value-object';
import { ScannedFoodItem } from '../domain/model/scanned-food-item.entity';
import { ScanResult } from '../domain/model/scan-result.entity';
import { ScanResultResource, ScanResultsResponse } from './plate-scan-resource';

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
      detectedItems: r.detected_items.map((item, idx) => {
        const qty = item.quantity_grams || 100;
        const cal100 = qty > 0 ? (item.calories / qty) * 100 : 0;
        const prt100 = qty > 0 ? (item.protein  / qty) * 100 : 0;
        const crb100 = qty > 0 ? (item.carbs    / qty) * 100 : 0;
        const fat100 = qty > 0 ? (item.fat      / qty) * 100 : 0;
        return new ScannedFoodItem({
          id:              item.id ?? idx + 1,
          foodItemId:      item.id ?? null,
          name:            item.name,
          nameEs:          null,
          nameKey:         item.name_key ?? null,
          quantityGrams:   qty,
          macros: new MacronutrientDistribution({
            calories: item.calories, protein: item.protein,
            carbs: item.carbs, fat: item.fat, fiber: 0, sugar: 0,
          }),
          restrictions:    item.restrictions.map(s => s as DietaryRestriction),
          isEdited:        item.is_edited,
          isEstimate:      false,
          caloriesPer100g: cal100,
          proteinPer100g:  prt100,
          carbsPer100g:    crb100,
          fatPer100g:      fat100,
        });
      }),
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
