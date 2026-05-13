import { DomainEvent } from './domain-event';

export class SessionTerminated extends DomainEvent {
  override readonly eventType = 'SessionTerminated';

  /**
   * Published when a user explicitly logs out.
   *
   * @param userId - ID of the user whose session ended.
   */
  constructor(readonly userId: number) {
    super();
  }
}
