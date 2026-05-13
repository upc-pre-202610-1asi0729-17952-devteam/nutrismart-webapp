import { DomainEvent } from './domain-event';

/**
 * Fired when metabolic targets are recalculated due to a body or profile change.
 *
 * Unlike {@link MetabolicTargetSet} (initial calculation at onboarding),
 * this event represents an adaptive update to an existing plan.
 *
 * Consumed by Nutrition Tracking to refresh daily targets,
 * and by Behavioral Consistency to evaluate strategy compatibility.
 */
export class MetabolicTargetsRecalculated extends DomainEvent {
  override readonly eventType = 'MetabolicTargetsRecalculated';

  constructor(
    readonly userId:              number,
    readonly dailyCalorieTarget:  number,
    readonly proteinTarget:       number,
    readonly carbsTarget:         number,
    readonly fatTarget:           number,
    readonly trigger:             string,
  ) { super(); }
}
