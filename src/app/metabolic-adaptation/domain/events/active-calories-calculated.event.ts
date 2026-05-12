import { DomainEvent } from '../../../shared/domain/domain-event';

/**
 * Fired when active calories are estimated for a manual activity entry.
 *
 * Emitted by {@link WearableStore} before {@link CaloricTargetAdjusted},
 * using the formula: calories = MET × weight(kg) × duration(h).
 */
export class ActiveCaloriesCalculated extends DomainEvent {
  override readonly eventType = 'ActiveCaloriesCalculated';

  constructor(
    readonly userId:          number,
    readonly caloriesBurned:  number,
    readonly activityKey:     string,
    readonly durationMinutes: number,
  ) { super(); }
}
