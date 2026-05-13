import { DomainEvent } from './domain-event';

/**
 * Fired when the user records a new body-metrics snapshot (weight ± height).
 *
 * Consumed by Behavioral Consistency to evaluate strategy compatibility,
 * and by Analytics to update the weight-evolution chart.
 */
export class BodyMetricsUpdated extends DomainEvent {
  override readonly eventType = 'BodyMetricsUpdated';

  constructor(
    readonly userId:    number,
    readonly weightKg:  number,
    readonly heightCm:  number,
    readonly timestamp: string,
  ) { super(); }
}
