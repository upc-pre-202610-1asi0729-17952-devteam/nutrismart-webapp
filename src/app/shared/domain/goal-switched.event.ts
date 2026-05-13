import { DomainEvent } from './domain-event';
import { UserGoal } from '../../iam/domain/model/user-goal.enum';

export class GoalSwitched extends DomainEvent {
  override readonly eventType = 'GoalSwitched';

  constructor(
    readonly userId:  number,
    readonly newGoal: UserGoal,
  ) {
    super();
  }
}
