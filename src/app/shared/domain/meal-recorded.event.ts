import { DomainEvent } from './domain-event';
import { MealType } from '../../nutrition-tracking/domain/model/meal-type.enum';

/**
 * Fired when the user successfully logs a meal entry.
 *
 * Consumed by Smart Recommendation and Behavioral Consistency to update
 * suggestion models and streak counters.
 */
export class MealRecorded extends DomainEvent {
  override readonly eventType = 'MealRecorded';

  constructor(
    readonly userId: number,
    readonly mealType: MealType,
    readonly calories: number,
    readonly source: 'manual' | 'smart_scan',
  ) { super(); }
}
