import { DomainEvent } from '../../../shared/domain/domain-event';

/**
 * Fired when a food database search completes and results are returned.
 *
 * Emitted by {@link NutritionStore} after the debounced search resolves.
 * Carries the query string and the number of items returned.
 */
export class FoodSearchExecuted extends DomainEvent {
  override readonly eventType = 'FoodSearchExecuted';

  constructor(
    readonly userId:       number,
    readonly query:        string,
    readonly resultsCount: number,
  ) { super(); }
}
