import { DomainEvent } from './domain-event';

export class WeightGoalAchieved extends DomainEvent {
  override readonly eventType = 'WeightGoalAchieved';

  constructor(
    readonly userId:          number,
    readonly achievedWeightKg: number,
  ) {
    super();
  }
}
