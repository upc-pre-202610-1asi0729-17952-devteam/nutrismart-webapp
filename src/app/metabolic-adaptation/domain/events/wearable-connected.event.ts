import { DomainEvent } from '../../../shared/domain/domain-event';

export class WearableConnected extends DomainEvent {
  readonly eventType = 'WearableConnected';

  constructor(
    readonly userId: string | number,
    readonly provider: string,
    readonly authorizedAt: string,
  ) { super(); }
}
