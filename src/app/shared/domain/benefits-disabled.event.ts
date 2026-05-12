import { DomainEvent } from './domain-event';
import { SubscriptionPlan } from '../../iam/domain/model/subscription-plan.enum';

export class BenefitsDisabled extends DomainEvent {
  override readonly eventType = 'BenefitsDisabled';

  /**
   * Published after a subscription is cancelled so bounded contexts can
   * lock plan-gated features.
   *
   * @param userId - User whose benefits are disabled.
   * @param plan   - The plan that was cancelled.
   */
  constructor(
    readonly userId: number,
    readonly plan: SubscriptionPlan,
  ) {
    super();
  }
}
