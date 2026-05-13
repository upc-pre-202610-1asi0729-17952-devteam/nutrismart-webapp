import { DomainEvent } from '../../../shared/domain/domain-event';
import { AdherenceDropTrigger } from '../model/adherence-drop-trigger.enum';

/** Published when the system activates a new adherence recovery plan. */
export class RecoveryPlanActivated extends DomainEvent {
  override readonly eventType = 'RecoveryPlanActivated';

  constructor(
    readonly userId:    number,
    readonly planId:    number,
    readonly trigger:   AdherenceDropTrigger,
  ) {
    super();
  }
}
