import { DomainEvent } from '../../../shared/domain/domain-event';

/**
 * Fired within Nutrition Tracking when the net daily calorie target is adjusted
 * in response to an incoming {@link CaloricTargetAdjusted} event.
 *
 * The adjusted target equals the base goal plus active calories burned.
 */
export class NetTargetUpdated extends DomainEvent {
  override readonly eventType = 'NetTargetUpdated';

  constructor(
    readonly userId:                 number,
    readonly adjustedDailyCalories:  number,
    readonly activeCaloriesAdded:    number,
  ) { super(); }
}
