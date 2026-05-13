import { DomainEvent } from './domain-event';

/**
 * Fired after each meal log when the user is still within their daily caloric target.
 *
 * Consumed by Analytics to refresh the daily progress summary in real time.
 * Complements {@link DailyGoalExceeded} and {@link DailyGoalMet} for the on-track case.
 */
export class DailyProgressUpdated extends DomainEvent {
  override readonly eventType = 'DailyProgressUpdated';

  constructor(
    readonly userId:            number,
    readonly remainingCalories: number,
    readonly adherencePct:      number,
    readonly date:              string,
  ) { super(); }
}
