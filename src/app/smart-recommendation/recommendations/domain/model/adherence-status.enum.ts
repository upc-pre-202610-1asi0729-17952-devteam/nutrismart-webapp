/**
 * Represents the user's current nutritional adherence state.
 *
 * Drives which recommendation card variant is displayed in the
 * /recommendations view (standard, preventive, or intervention).
 */
export enum AdherenceStatus {
  /** User is logging consistently — show standard weather-based cards. */
  ON_TRACK = 'ON_TRACK',

  /** Adherence is slipping — show a preventive recommendation card. */
  AT_RISK = 'AT_RISK',

  /** User has abandoned the plan — show an intervention plan card. */
  DROPPED = 'DROPPED',
}
