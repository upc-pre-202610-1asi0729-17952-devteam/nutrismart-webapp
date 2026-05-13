import { DomainEvent } from './domain-event';

/**
 * Published by Behavioral Consistency when a user reaches 7+ consecutive missed
 * days, transitioning their adherence status to DROPPED.
 *
 * Consumed by Smart Recommendation to trigger a reactivation plan.
 *
 * @param userId            - Owner of the behavioral progress record.
 * @param consecutiveMisses - Number of consecutive days without a goal log (≥ 7).
 */
export class NutritionalAbandonmentRisk extends DomainEvent {
  override readonly eventType = 'NutritionalAbandonmentRisk';

  constructor(
    readonly userId: number,
    readonly consecutiveMisses: number,
  ) {
    super();
  }
}
