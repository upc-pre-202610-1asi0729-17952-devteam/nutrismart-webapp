import { DomainEvent } from './domain-event';

/**
 * Fired (at most once per calendar day) when the user's total consumed
 * calories exceed their adjusted daily goal.
 *
 * Consumed by Smart Recommendation to suggest corrective actions.
 */
export class DailyGoalExceeded extends DomainEvent {
  override readonly eventType = 'DailyGoalExceeded';

  constructor(
    readonly userId: number,
    readonly exceededByCalories: number,
    readonly date: string,
  ) { super(); }
}
