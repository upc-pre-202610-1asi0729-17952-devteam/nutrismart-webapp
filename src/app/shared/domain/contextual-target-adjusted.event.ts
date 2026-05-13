import { DomainEvent } from './domain-event';
import { AdjustmentSource } from '../../smart-recommendation/domain/model/contextual-target-adjustment.value-object';

/**
 * Published by {@link RecommendationsStore} whenever the active context
 * (travel or weather) produces a new calorie target adjustment for the session.
 */
export class ContextualTargetAdjusted extends DomainEvent {
  override readonly eventType = 'ContextualTargetAdjusted';

  /**
   * @param userId            - Owner of the adjusted session.
   * @param source            - Context that triggered the adjustment.
   * @param factor            - Multiplicative factor applied (e.g. 1.10).
   * @param baseKcalTarget    - Calorie target before adjustment.
   * @param adjustedKcalTarget - Calorie target after adjustment.
   */
  constructor(
    readonly userId:             number,
    readonly source:             AdjustmentSource,
    readonly factor:             number,
    readonly baseKcalTarget:     number,
    readonly adjustedKcalTarget: number,
  ) {
    super();
  }
}
