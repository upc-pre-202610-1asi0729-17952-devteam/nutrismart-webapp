import { DomainEvent } from './domain-event';
import { UserGoal } from '../../iam/domain/model/user-goal.enum';

export class StagnationDetected extends DomainEvent {
  override readonly eventType = 'StagnationDetected';

  /**
   * Published when a user shows no weight progress over the 14-day stagnation
   * window despite consistent logging. SmartRecommendation subscribes to
   * trigger a strategy adjustment suggestion.
   *
   * @param userId              - User whose plan has stagnated.
   * @param daysWithoutProgress - Length of the stagnation window in days.
   * @param currentWeightKg     - Latest logged weight.
   * @param goalType            - Active goal (informs the suggested adjustment).
   */
  constructor(
    readonly userId: number,
    readonly daysWithoutProgress: number,
    readonly currentWeightKg: number,
    readonly goalType: UserGoal,
  ) {
    super();
  }
}
