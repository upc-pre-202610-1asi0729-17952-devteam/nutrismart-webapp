import { DomainEvent } from './domain-event';
import { MealType } from '../../nutrition-tracking/domain/model/meal-type.enum';

/**
 * Fired when an existing meal record's quantity is adjusted.
 *
 * Triggers a re-evaluation of daily macro validation within Nutrition Tracking.
 */
export class MealEntryUpdated extends DomainEvent {
  override readonly eventType = 'MealEntryUpdated';

  constructor(
    readonly userId:      number,
    readonly entryId:     number,
    readonly mealType:    MealType,
    readonly newCalories: number,
  ) { super(); }
}
