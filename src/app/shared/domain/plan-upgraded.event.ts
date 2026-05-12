import { DomainEvent } from './domain-event';
import { SubscriptionPlan } from '../../iam/domain/model/subscription-plan.enum';

export class PlanUpgraded extends DomainEvent {
  override readonly eventType = 'PlanUpgraded';

  /**
   * Published by {@link IamStore} until the Subscriptions bounded context
   * takes ownership of plan lifecycle management.
   *
   * @param userId - Identifier of the user whose plan was upgraded.
   * @param plan   - The newly activated subscription tier.
   */
  constructor(
    readonly userId: number,
    readonly plan: SubscriptionPlan,
  ) {
    super();
  }
}
