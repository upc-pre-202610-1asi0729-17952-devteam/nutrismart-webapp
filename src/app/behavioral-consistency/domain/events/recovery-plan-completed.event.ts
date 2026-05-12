import { DomainEvent } from '../../../shared/domain/domain-event';

/** Published when the user successfully completes an active recovery plan. */
export class RecoveryPlanCompleted extends DomainEvent {
  override readonly eventType = 'RecoveryPlanCompleted';

  constructor(
    readonly userId: number,
    readonly planId: number,
  ) {
    super();
  }
}
