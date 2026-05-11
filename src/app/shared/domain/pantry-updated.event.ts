import { DomainEvent } from './domain-event';

export class PantryUpdated extends DomainEvent {
  override readonly eventType = 'PantryUpdated';

  constructor(
    readonly userId: number,
    readonly action: 'added' | 'removed',
    readonly ingredientKey: string,
  ) {
    super();
  }
}
