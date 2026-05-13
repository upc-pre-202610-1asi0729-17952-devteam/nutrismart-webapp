import { DomainEvent } from './domain-event';

export class ProfileUpdated extends DomainEvent {
  override readonly eventType = 'ProfileUpdated';

  /**
   * @param userId        - Identifier of the updated user.
   * @param updatedFields - Names of the fields that changed (e.g. `['weight', 'activityLevel']`).
   */
  constructor(
    readonly userId: number,
    readonly updatedFields: string[],
  ) {
    super();
  }
}
