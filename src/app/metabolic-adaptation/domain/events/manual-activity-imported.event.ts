import { DomainEvent } from '../../../shared/domain/domain-event';

export class ManualActivityImported extends DomainEvent {
  readonly eventType = 'ManualActivityImported';

  constructor(
    readonly userId: string | number,
    readonly activityType: string,
    readonly durationMinutes: number,
    readonly caloriesBurned: number,
    readonly timestamp: string,
  ) { super(); }
}
