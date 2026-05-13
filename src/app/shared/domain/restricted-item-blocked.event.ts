import { DomainEvent } from './domain-event';

/**
 * Fired when a pre-log guardrail blocks a meal entry due to a dietary restriction.
 *
 * Consumed by Behavioral Consistency to register a deviation attempt
 * without penalising the streak counter.
 */
export class RestrictedItemBlocked extends DomainEvent {
  override readonly eventType = 'RestrictedItemBlocked';

  constructor(
    readonly userId:       number,
    readonly foodItemName: string,
    readonly restriction:  string,
    readonly date:         string,
  ) { super(); }
}
