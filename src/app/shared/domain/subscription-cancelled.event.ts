import { DomainEvent } from './domain-event';
import { SubscriptionPlan } from '../../iam/domain/model/subscription-plan.enum';

export class SubscriptionCancelled extends DomainEvent {
  override readonly eventType = 'SubscriptionCancelled';

  /**
   * Published when a user cancels their active subscription.
   *
   * @param userId - User who cancelled the plan.
   * @param plan   - The plan that was cancelled.
   */
  constructor(
    readonly userId: number,
    readonly plan: SubscriptionPlan,
  ) {
    super();
  }
}
