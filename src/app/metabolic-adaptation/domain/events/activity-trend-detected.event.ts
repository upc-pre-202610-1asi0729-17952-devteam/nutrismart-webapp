import { DomainEvent } from '../../../shared/domain/domain-event';

/**
 * Published by {@link WearableStore} when the 7-day average of calories burned
 * exceeds the significance threshold (300 kcal/day).
 *
 * {@link MetabolicStore} subscribes to this event to trigger an automatic
 * TDEE recalculation logged as an {@link MetabolicAdaptationLog} with trigger
 * `ACTIVITY_TREND`.
 */
export class ActivityTrendDetected extends DomainEvent {
  override readonly eventType = 'ActivityTrendDetected';

  /**
   * @param userId                      - User whose activity trend was analysed.
   * @param averageWeeklyCaloriesBurned - Mean daily calories burned over the last 7 days.
   * @param recommendedTdeeAdjustment   - Extra kcal/day to add to TDEE (50 % of the average).
   * @param detectedAt                  - ISO timestamp of detection.
   */
  constructor(
    readonly userId:                      number,
    readonly averageWeeklyCaloriesBurned: number,
    readonly recommendedTdeeAdjustment:   number,
    readonly detectedAt:                  string,
  ) {
    super();
  }
}
