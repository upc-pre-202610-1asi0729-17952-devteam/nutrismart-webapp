/**
 * Represents the user's behavioral adherence status.
 *
 * Used to summarize how consistently the user is meeting their nutrition
 * logging and goal-completion habits.
 */
export enum AdherenceStatus {
  /** User is consistently meeting the expected behavior. */
  ON_TRACK = 'ON_TRACK',

  /** User has 1–6 consecutive misses and is at risk of dropping off. */
  AT_RISK = 'AT_RISK',

  /** User has 7+ consecutive misses and needs a reactivation plan. */
  DROPPED = 'DROPPED',
}
