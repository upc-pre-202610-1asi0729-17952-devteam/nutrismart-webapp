import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

/**
 * API resource DTO representing behavioral progress as returned by the REST endpoint.
 *
 * String-based fields are converted to strongly typed domain values by
 * {@link BehavioralProgressAssembler}.
 */
export interface BehavioralProgressResource extends BaseResource {
  /** Unique numeric identifier. */
  id: number;
  /** Identifier of the user this behavioral progress belongs to. */
  userId: number | string;
  /** Current adherence status as a raw string, e.g. `"ON_TRACK"`. */
  adherenceStatus: string | null;
  /** Number of consecutive days where the user met the expected behavior. */
  streak: number;
  /** Number of consecutive missed days. */
  consecutiveMisses: number;
  /** Last date where the user met the daily goal, in ISO format. */
  lastGoalMetDate: string | null;
  /** Weekly completion flags, usually representing the last seven days. */
  weekDots: boolean[];
}

/**
 * Envelope returned by the `/behavioral-progress` collection endpoint.
 *
 * This is useful if the API later returns an object wrapper instead of
 * a plain array.
 */
export interface BehavioralProgressResponse extends BaseResponse {
  /** Array of behavioral progress resources returned by the API. */
  behavioralProgress: BehavioralProgressResource[];
}
