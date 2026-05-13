import { DomainEvent } from '../../../shared/domain/domain-event';
import { BehaviorPatternType } from '../model/behavior-pattern-type.enum';

/**
 * Published when the behavioral pattern analysis completes for a user.
 *
 * Consumers (e.g. RecommendationsStore) can subscribe to adapt their
 * strategy based on the classified pattern.
 */
export class BehaviorPatternAnalyzed extends DomainEvent {
  override readonly eventType = 'BehaviorPatternAnalyzed';

  /**
   * @param userId      - Identifier of the analysed user.
   * @param patternType - Classified behavior pattern for the 7-day window.
   * @param analyzedAt  - ISO date (YYYY-MM-DD) when the analysis ran.
   */
  constructor(
    readonly userId: number,
    readonly patternType: BehaviorPatternType,
    readonly analyzedAt: string,
  ) {
    super();
  }
}
