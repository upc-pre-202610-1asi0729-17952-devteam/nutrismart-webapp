import { DomainEvent } from '../../../shared/domain/domain-event';

export class CaloricTargetAdjusted extends DomainEvent {
  readonly eventType = 'CaloricTargetAdjusted';

  constructor(
    readonly userId: string | number,
    readonly previousTarget: number,
    readonly newTarget: number,
    readonly activeCaloriesAdded: number,
  ) { super(); }
}
