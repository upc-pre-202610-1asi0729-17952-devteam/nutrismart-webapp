import { DomainEvent } from './domain-event';

/** Minimal shape required by {@link User.applyMetabolicTargets}. */
export interface MacroDistribution {
  dailyCalorieTarget: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
  fiberTarget: number;
}

export class MetabolicTargetSet extends DomainEvent implements MacroDistribution {
  override readonly eventType = 'MetabolicTargetSet';

  /**
   * Published by MetabolicAdaptation whenever TDEE recalculation produces
   * new targets. IAM and NutritionTracking subscribe to sync their projections.
   *
   * Field names mirror {@link MetabolicTargets} so consumers can pass the event
   * directly to {@link User.applyMetabolicTargets} without any mapping.
   *
   * @param userId             - Owner of the recalculated plan.
   * @param dailyCalorieTarget - Total daily kcal target.
   * @param proteinTarget      - Daily protein target in grams.
   * @param carbsTarget        - Daily carbohydrate target in grams.
   * @param fatTarget          - Daily fat target in grams.
   * @param fiberTarget        - Daily fibre target in grams.
   */
  constructor(
    readonly userId: number,
    readonly dailyCalorieTarget: number,
    readonly proteinTarget: number,
    readonly carbsTarget: number,
    readonly fatTarget: number,
    readonly fiberTarget: number,
  ) {
    super();
  }
}
