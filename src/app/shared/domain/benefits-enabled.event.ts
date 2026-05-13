import { DomainEvent } from './domain-event';
import { SubscriptionPlan } from '../../iam/domain/model/subscription-plan.enum';

export class BenefitsEnabled extends DomainEvent {
  override readonly eventType = 'BenefitsEnabled';

  /**
   * Published after a subscription is activated so bounded contexts can
   * unlock plan-gated features.
   *
   * @param userId   - User whose benefits are enabled.
   * @param plan     - The activated plan tier.
   * @param features - Feature keys unlocked by the plan.
   */
  constructor(
    readonly userId: number,
    readonly plan: SubscriptionPlan,
    readonly features: string[],
  ) {
    super();
  }
}
