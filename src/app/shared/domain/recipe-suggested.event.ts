import { DomainEvent } from './domain-event';

export class RecipeSuggested extends DomainEvent {
  override readonly eventType = 'RecipeSuggested';

  constructor(
    readonly userId: number,
    readonly recipeName: string,
    readonly calories: number,
    readonly protein: number,
    readonly carbs: number,
    readonly fat: number,
  ) {
    super();
  }
}
