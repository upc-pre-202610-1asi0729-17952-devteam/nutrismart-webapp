import { DomainEvent } from './domain-event';

/**
 * Published by Behavioral Consistency when a recalculated metabolic target is
 * considered aggressive relative to the user's recent weekly completion rate.
 *
 * Consumed by Smart Recommendation to suggest a strategy adjustment.
 *
 * @param userId               - Owner of the behavioral progress record.
 * @param weeklyCompletionRate - Percentage (0–100) of weekly goals completed.
 * @param newDailyCalorieTarget - The new calorie target from the recalculation.
 */
export class StrategyMismatchDetected extends DomainEvent {
  override readonly eventType = 'StrategyMismatchDetected';

  constructor(
    readonly userId: number,
    readonly weeklyCompletionRate: number,
    readonly newDailyCalorieTarget: number,
  ) {
    super();
  }
}
