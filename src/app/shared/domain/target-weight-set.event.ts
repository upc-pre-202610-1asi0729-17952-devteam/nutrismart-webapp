import { DomainEvent } from './domain-event';

export class TargetWeightSet extends DomainEvent {
  override readonly eventType = 'TargetWeightSet';

  constructor(
    readonly userId:          number,
    readonly targetWeightKg:  number,
    readonly projectedDate:   string,
  ) {
    super();
  }
}
