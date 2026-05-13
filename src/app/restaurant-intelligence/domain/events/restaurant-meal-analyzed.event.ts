import { DomainEvent } from '../../../shared/domain/domain-event';
import { MealType } from '../../../nutrition-tracking/domain/model/meal-type.enum';

/**
 * Published when a user logs a dish selected from a restaurant menu analysis.
 *
 * Source is always 'menu': plate-scan logging is handled by the Nutrition Tracking
 * context and produces {@link MealRecorded} with source 'smart_scan' instead.
 */
export class RestaurantMealAnalyzed extends DomainEvent {
  override readonly eventType = 'RestaurantMealAnalyzed';

  constructor(
    readonly userId: number,
    readonly mealType: MealType,
    readonly totalCalories: number,
  ) {
    super();
  }
}
