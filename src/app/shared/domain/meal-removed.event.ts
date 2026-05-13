import { DomainEvent } from './domain-event';
import { MealType } from '../../nutrition-tracking/domain/model/meal-type.enum';

/**
 * Fired when the user deletes a meal record from their daily log.
 *
 * Consumed by Behavioral Consistency to detect incomplete logging patterns.
 */
export class MealRemoved extends DomainEvent {
  override readonly eventType = 'MealRemoved';

  constructor(
    readonly userId: number,
    readonly mealType: MealType,
  ) { super(); }
}
