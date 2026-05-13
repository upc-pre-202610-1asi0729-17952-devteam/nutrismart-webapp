import { DomainEvent } from './domain-event';
import { DietaryRestriction } from '../../iam/domain/model/dietary-restriction.enum';

export class RestrictionsChanged extends DomainEvent {
  override readonly eventType = 'RestrictionsChanged';

  /**
   * Carries the full current state so consumers can replace rather than patch.
   *
   * @param userId            - Identifier of the user whose restrictions changed.
   * @param restrictions      - Complete list of active dietary restrictions after the change.
   * @param medicalConditions - Complete list of medical conditions after the change.
   */
  constructor(
    readonly userId: number,
    readonly restrictions: DietaryRestriction[],
    readonly medicalConditions: string[],
  ) {
    super();
  }
}
