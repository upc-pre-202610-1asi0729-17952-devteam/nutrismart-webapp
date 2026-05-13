import { DomainEvent } from '../../../shared/domain/domain-event';

/**
 * Fired when a Basal Metabolic Rate is derived during target calculation.
 *
 * Uses Mifflin-St Jeor when no lean-mass data is available,
 * or Katch-McArdle when body composition is known.
 */
export class BMRCalculated extends DomainEvent {
  override readonly eventType = 'BMRCalculated';

  constructor(
    readonly userId: number,
    readonly bmr:    number,
  ) { super(); }
}
