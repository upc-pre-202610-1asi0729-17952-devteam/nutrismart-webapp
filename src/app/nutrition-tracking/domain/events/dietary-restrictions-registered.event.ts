import { DomainEvent } from '../../../shared/domain/domain-event';
import { DietaryRestriction } from '../../../iam/domain/model/dietary-restriction.enum';

/**
 * Fired when the user's dietary restrictions are loaded and registered
 * within the Nutrition Tracking context.
 *
 * Emitted once per session during initialisation or after onboarding completion.
 * Activates the pre-log guardrail pipeline for the current session.
 */
export class DietaryRestrictionsRegistered extends DomainEvent {
  override readonly eventType = 'DietaryRestrictionsRegistered';

  constructor(
    readonly userId:       number,
    readonly restrictions: DietaryRestriction[],
  ) { super(); }
}
