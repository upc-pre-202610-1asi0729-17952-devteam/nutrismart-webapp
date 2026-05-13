/**
 * Classification of a user's behavioral eating pattern over the last 7-day window.
 *
 * Derived from weekly completion rate, current streak, and consecutive misses.
 * WEEKDAY_ONLY requires day-of-week tracking not yet available in the current
 * data model and is reserved for future implementation.
 */
export enum BehaviorPatternType {
  /** ≥ 5 out of 7 days logged consistently. */
  CONSISTENT   = 'CONSISTENT',

  /** High weekday completion, low weekend completion (requires day-of-week data). */
  WEEKDAY_ONLY = 'WEEKDAY_ONLY',

  /** Active streak with weekly rate below 71% — user is rebuilding the habit. */
  RECOVERING   = 'RECOVERING',

  /** Zero streak or completion rate below 50% with active misses. */
  IRREGULAR    = 'IRREGULAR',
}
