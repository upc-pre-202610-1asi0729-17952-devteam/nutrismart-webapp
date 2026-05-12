import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

/**
 * API resource DTO for an {@link EatingBehaviorPattern} as returned by the REST endpoint.
 */
export interface EatingBehaviorPatternResource extends BaseResource {
  id: number;
  userId: number | string;
  weeklyCompletionRate: number;
  currentStreak: number;
  consecutiveMisses: number;
  /** Raw string value of {@link BehaviorPatternType}. */
  patternType: string;
  analyzedAt: string;
}

/** Envelope for the `/eating-behavior-patterns` collection endpoint. */
export interface EatingBehaviorPatternResponse extends BaseResponse {
  eatingBehaviorPatterns: EatingBehaviorPatternResource[];
}
