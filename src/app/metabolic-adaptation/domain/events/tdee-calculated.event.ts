import { DomainEvent } from '../../../shared/domain/domain-event';

/**
 * Fired when a Total Daily Energy Expenditure is derived during target calculation.
 *
 * TDEE = BMR × activity multiplier (1.2 – 1.725 based on activity level).
 */
export class TDEECalculated extends DomainEvent {
  override readonly eventType = 'TDEECalculated';

  constructor(
    readonly userId:             number,
    readonly tdee:               number,
    readonly activityMultiplier: number,
  ) { super(); }
}
