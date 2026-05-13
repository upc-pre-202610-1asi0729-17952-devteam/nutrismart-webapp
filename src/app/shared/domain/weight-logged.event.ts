import { DomainEvent } from './domain-event';

export class WeightLogged extends DomainEvent {
  override readonly eventType = 'WeightLogged';

  constructor(
    readonly userId:   number,
    readonly weightKg: number,
    readonly bmi:      number,
  ) {
    super();
  }
}
