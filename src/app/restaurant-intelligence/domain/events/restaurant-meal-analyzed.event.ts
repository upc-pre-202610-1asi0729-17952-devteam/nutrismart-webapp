import { DomainEvent } from '../../../shared/domain/domain-event';
import { MealType } from '../../../nutrition-tracking/domain/model/meal-type.enum';

export class RestaurantMealAnalyzed extends DomainEvent {
  override readonly eventType = 'RestaurantMealAnalyzed';

  constructor(
    readonly userId: number,
    readonly mealType: MealType,
    readonly totalCalories: number,
    readonly source: 'plate' | 'menu',
  ) {
    super();
  }
}
