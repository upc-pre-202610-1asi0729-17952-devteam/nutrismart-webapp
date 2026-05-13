import { DomainEvent } from './domain-event';
import { SubscriptionPlan } from '../../iam/domain/model/subscription-plan.enum';

export class SubscriptionActivated extends DomainEvent {
  override readonly eventType = 'SubscriptionActivated';

  /**
   * Published when a user activates or upgrades to a subscription plan.
   *
   * @param userId             - User who activated the plan.
   * @param plan               - The activated {@link SubscriptionPlan}.
   * @param featuresEnabled    - Feature keys unlocked by the plan.
   * @param billingCycleStart  - ISO date string when the billing cycle starts.
   */
  constructor(
    readonly userId: number,
    readonly plan: SubscriptionPlan,
    readonly featuresEnabled: string[],
    readonly billingCycleStart: string,
  ) {
    super();
  }
}
