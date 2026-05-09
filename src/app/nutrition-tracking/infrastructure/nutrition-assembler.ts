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
      source:          r.source,
      servingSize:     r.serving_size,
      servingUnit:     r.serving_unit,
      caloriesPer100g: r.calories_per_100g,
      proteinPer100g:  r.protein_per_100g,
      carbsPer100g:    r.carbs_per_100g,
      fatPer100g:      r.fat_per_100g,
      fiberPer100g:    r.fiber_per_100g,
      sugarPer100g:    r.sugar_per_100g,
      restrictions:    r.restrictions.map(s => s as DietaryRestriction),
    });
  }

  toResourceFromEntity(e: FoodItem): FoodItemResource {
    return {
      id:               e.id,
      name:             e.name,
      source:           e.source,
      serving_size:     e.servingSize,
      serving_unit:     e.servingUnit,
      calories_per_100g: e.caloriesPer100g,
      protein_per_100g:  e.proteinPer100g,
      carbs_per_100g:    e.carbsPer100g,
      fat_per_100g:      e.fatPer100g,
      fiber_per_100g:    e.fiberPer100g,
      sugar_per_100g:    e.sugarPer100g,
      restrictions:      e.restrictions,
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
      id:           r.id,
      foodItemId:   r.foodItemId,
      foodItemName: r.foodItemName,
      mealType:     r.mealType as MealType,
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
      id:           e.id,
      foodItemId:   e.foodItemId,
      foodItemName: e.foodItemName,
      mealType:     e.mealType,
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
      dailyGoal: r.daily_goal,
      consumed:  r.consumed,
      active:    r.active,
    });
  }

  toResourceFromEntity(e: DailyIntake): DailyIntakeResource {
    return {
      id:         e.id,
      userId:     e.userId,
      date:       e.date,
      daily_goal: e.dailyGoal,
      consumed:   e.consumed,
      active:     e.active,
    };
  }

  toEntitiesFromResponse(response: DailyIntakeResponse): DailyIntake[] {
    return [this.toEntityFromResource(response.balance)];
  }
}
