import { DomainEvent } from './domain-event';

export class BehavioralDropDetected extends DomainEvent {
  override readonly eventType = 'BehavioralDropDetected';

  constructor(
    readonly userId: number,
    readonly consecutiveMisses: number,
  ) {
    super();
  }
}
