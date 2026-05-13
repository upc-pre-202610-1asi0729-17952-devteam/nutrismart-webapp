import { DomainEvent } from './domain-event';

export class SessionStarted extends DomainEvent {
  override readonly eventType = 'SessionStarted';

  /**
   * Published when a user successfully authenticates.
   *
   * @param userId - Authenticated user's numeric ID.
   * @param email  - Authenticated user's email address.
   */
  constructor(
    readonly userId: number,
    readonly email: string,
  ) {
    super();
  }
}
