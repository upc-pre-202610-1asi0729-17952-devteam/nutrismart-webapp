import { DomainEvent } from './domain-event';

/**
 * Published by Behavioral Consistency when the user's streak crosses a
 * 7-day milestone boundary (7, 14, 21, 30+ days).
 *
 * Consumed by Smart Recommendation and Analytics to display achievement badges.
 *
 * @param userId     - Owner of the behavioral progress record.
 * @param streakDays - Total consecutive days at the moment of milestone crossing.
 * @param milestone  - The milestone boundary that was crossed (7 | 14 | 21 | 30).
 */
export class StreakMilestoneReached extends DomainEvent {
  override readonly eventType = 'StreakMilestoneReached';

  constructor(
    readonly userId: number,
    readonly streakDays: number,
    readonly milestone: 7 | 14 | 21 | 30,
  ) {
    super();
  }
}
