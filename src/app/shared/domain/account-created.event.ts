import { DomainEvent } from './domain-event';
import { UserGoal } from '../../iam/domain/model/user-goal.enum';

export class AccountCreated extends DomainEvent {
  override readonly eventType = 'AccountCreated';

  /**
   * @param userId    - Persisted identifier assigned by the backend.
   * @param email     - Email address used to register.
   * @param firstName - Given name.
   * @param lastName  - Family name.
   * @param goal      - Initial fitness goal selected during registration.
   */
  constructor(
    readonly userId: number,
    readonly email: string,
    readonly firstName: string,
    readonly lastName: string,
    readonly goal: UserGoal,
  ) {
    super();
  }
}
