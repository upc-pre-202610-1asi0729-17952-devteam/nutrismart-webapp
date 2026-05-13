import { DomainEvent } from './domain-event';
import { MealType } from '../../nutrition-tracking/domain/model/meal-type.enum';

/**
 * Fired when a meal window closes without any logged entry for that slot.
 *
 * Windows: breakfast 06–10 h, lunch 11–15 h, dinner 18–22 h.
 * Consumed by Behavioral Consistency to count as an adherence miss.
 */
export class MealSkipped extends DomainEvent {
  override readonly eventType = 'MealSkipped';

  constructor(
    readonly userId:              number,
    readonly mealType:            MealType,
    readonly expectedWindowEnd:   string,
    readonly date:                string,
  ) { super(); }
}
