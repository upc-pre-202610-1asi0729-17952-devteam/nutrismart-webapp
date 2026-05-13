import { DomainEvent } from './domain-event';

export class ConsistencyRecovered extends DomainEvent {
  override readonly eventType = 'ConsistencyRecovered';

  constructor(readonly userId: number) {
    super();
  }
}
