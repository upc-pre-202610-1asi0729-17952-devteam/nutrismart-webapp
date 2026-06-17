import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { DietaryRestriction } from '../../iam/domain/model/dietary-restriction.enum';
import { MealType } from '../domain/model/meal-type.enum';
import { FoodItem } from '../domain/model/food-item.entity';
import { MealRecord } from '../domain/model/meal-record.entity';
import { DailyIntake } from '../domain/model/daily-intake.entity';
import {
  FoodItemResource, FoodItemsResponse,
  MealRecordResource, MealRecordsResponse,
  DailyIntakeResource, DailyIntakeResponse,
} from './nutrition-resource';

/**
 * Assembler for {@link FoodItem} — maps between the food search API DTO and
 * the domain entity.
 *
 * @author Mora Rivera, Joel Fernando
 */
export class FoodItemAssembler
  implements BaseAssembler<FoodItem, FoodItemResource, FoodItemsResponse> {

  toEntityFromResource(r: FoodItemResource): FoodItem {
    return new FoodItem({
      id:              r.id,
      name:            r.name,
      nameEs:          r.nameEs,
      source:          r.source,
      servingSize:     r.servingSize,
      servingUnit:     r.servingUnit,
      caloriesPer100g: r.caloriesPer100g,
      proteinPer100g:  r.proteinPer100g,
      carbsPer100g:    r.carbsPer100g,
      fatPer100g:      r.fatPer100g,
      fiberPer100g:    r.fiberPer100g,
      sugarPer100g:    r.sugarPer100g,
      restrictions:    r.restrictions.map(s => s as DietaryRestriction),
      nameKey:         r.nameKey,
      category:        r.category,
      itemType:        r.itemType,
      weatherTypes:    r.weatherTypes ?? [],
      originCity:      r.originCity ?? null,
      originCountry:   r.originCountry ?? null,
    });
  }

  toResourceFromEntity(e: FoodItem): FoodItemResource {
    return {
      id:              e.id,
      name:            e.name,
      source:          e.source,
      servingSize:     e.servingSize,
      servingUnit:     e.servingUnit,
      caloriesPer100g: e.caloriesPer100g,
      proteinPer100g:  e.proteinPer100g,
      carbsPer100g:    e.carbsPer100g,
      fatPer100g:      e.fatPer100g,
      fiberPer100g:    e.fiberPer100g,
      sugarPer100g:    e.sugarPer100g,
      restrictions:    e.restrictions,
      nameKey:         e.nameKey,
      category:        e.category,
      itemType:        e.itemType,
      weatherTypes:    e.weatherTypes,
      originCity:      e.originCity,
      originCountry:   e.originCountry,
    };
  }

  toEntitiesFromResponse(response: FoodItemsResponse): FoodItem[] {
    return response.foods.map(r => this.toEntityFromResource(r));
  }
}

/**
 * Assembler for {@link MealRecord} — maps between the nutrition-log API DTO
 * and the domain entity.
 *
 * @author Mora Rivera, Joel Fernando
 */
export class MealRecordAssembler
  implements BaseAssembler<MealRecord, MealRecordResource, MealRecordsResponse> {

  toEntityFromResource(r: MealRecordResource): MealRecord {
    return new MealRecord({
      id:              r.id,
      foodId:          r.foodId,
      foodItemName:    r.foodItemName,
      foodItemNameEs:  r.foodItemNameEs,
      mealType:        r.mealType as MealType,
      quantity:     r.quantity,
      unit:         r.unit,
      calories:     r.calories,
      protein:      r.protein,
      carbs:        r.carbs,
      fat:          r.fat,
      fiber:        r.fiber,
      sugar:        r.sugar,
      loggedAt:     r.loggedAt,
      userId:       r.userId,
    });
  }

  toResourceFromEntity(e: MealRecord): MealRecordResource {
    return {
      id:              e.id,
      foodId:          e.foodId,
      foodItemName:    e.foodItemName,
      foodItemNameEs:  e.foodItemNameEs,
      mealType:        e.mealType,
      quantity:     e.quantity,
      unit:         e.unit,
      calories:     e.calories,
      protein:      e.protein,
      carbs:        e.carbs,
      fat:          e.fat,
      fiber:        e.fiber,
      sugar:        e.sugar,
      loggedAt:     e.loggedAt,
      userId:       e.userId,
    };
  }

  toEntitiesFromResponse(response: MealRecordsResponse): MealRecord[] {
    return response.records.map(r => this.toEntityFromResource(r));
  }
}

/**
 * Assembler for {@link DailyIntake} — maps between the daily-balance API DTO
 * and the domain entity.
 *
 * @author Mora Rivera, Joel Fernando
 */
export class DailyIntakeAssembler
  implements BaseAssembler<DailyIntake, DailyIntakeResource, DailyIntakeResponse> {

  toEntityFromResource(r: DailyIntakeResource): DailyIntake {
    return new DailyIntake({
      id:        r.id,
      userId:    r.userId,
      date:      r.date,
      dailyGoal: r.dailyGoal,
      consumed:  r.consumed,
      active:    r.active,
    });
  }

  toResourceFromEntity(e: DailyIntake): DailyIntakeResource {
    return {
      id:        e.id,
      userId:    e.userId,
      date:      e.date,
      dailyGoal: e.dailyGoal,
      consumed:  e.consumed,
      active:    e.active,
    };
  }

  toEntitiesFromResponse(response: DailyIntakeResponse): DailyIntake[] {
    return [this.toEntityFromResource(response.balance)];
  }
}
