/**
 * Represents the user's behavioral adherence status.
 *
 * Used to summarize how consistently the user is meeting their nutrition
 * logging and goal-completion habits.
 */
export enum AdherenceStatus {
  /** User is consistently meeting the expected behavior. */
  ON_TRACK = 'ON_TRACK',

  /** User is close to losing consistency or has some missed days. */
  AT_RISK = 'AT_RISK',

  /** User has missed several days and requires re-engagement. */
  OFF_TRACK = 'OFF_TRACK',

  /** User has completely dropped off and needs a reactivation plan. */
  DROPPED = 'DROPPED',

  /** User has recovered from a dropped state and is back on track. */
  RECOVERED = 'RECOVERED',
}
