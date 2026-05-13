import { DomainEvent } from './domain-event';

/**
 * Fired when the user has logged at least one entry in all four meal windows
 * for the current calendar day, indicating a complete daily log.
 *
 * Consumed by Behavioral Consistency to update the logging streak.
 *
 * @param adherencePct - Percentage of daily calorie goal reached (0–100+).
 */
export class DailyGoalMet extends DomainEvent {
  override readonly eventType = 'DailyGoalMet';

  constructor(
    readonly userId: number,
    readonly date: string,
    readonly totalCalories: number,
    readonly adherencePct: number,
  ) { super(); }
}
