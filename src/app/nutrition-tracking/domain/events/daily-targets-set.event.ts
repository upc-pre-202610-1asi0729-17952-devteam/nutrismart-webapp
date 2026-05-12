import { DomainEvent } from '../../../shared/domain/domain-event';

/**
 * Fired within Nutrition Tracking when a new daily caloric target is applied
 * in response to an incoming {@link MetabolicTargetSet} event.
 *
 * Confirms that the DailyIntake record has been updated with the new goal.
 */
export class DailyTargetsSet extends DomainEvent {
  override readonly eventType = 'DailyTargetsSet';

  constructor(
    readonly userId:         number,
    readonly dailyCalories:  number,
    readonly proteinTarget:  number,
    readonly carbsTarget:    number,
    readonly fatTarget:      number,
  ) { super(); }
}
