import { DomainEvent } from './domain-event';
import { ActivityLevel } from '../../iam/domain/model/activity-level.enum';
import { UserGoal } from '../../iam/domain/model/user-goal.enum';

export class OnboardingCompleted extends DomainEvent {
  override readonly eventType = 'OnboardingCompleted';

  /**
   * Carries every field that downstream contexts need to bootstrap
   * metabolic targets and behavioural tracking without coupling to IAM.
   *
   * @param userId        - Identifier of the user who completed onboarding.
   * @param weight        - Body weight in kilograms.
   * @param height        - Height in centimetres.
   * @param activityLevel - Self-reported daily activity level.
   * @param biologicalSex - Biological sex ('male' | 'female' | 'other').
   * @param birthday      - Date of birth in ISO format (YYYY-MM-DD).
   * @param goal          - Confirmed fitness goal.
   */
  constructor(
    readonly userId: number,
    readonly weight: number,
    readonly height: number,
    readonly activityLevel: ActivityLevel,
    readonly biologicalSex: string,
    readonly birthday: string,
    readonly goal: UserGoal,
  ) {
    super();
  }
}
