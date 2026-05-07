/**
 * Represents the user's primary fitness goal within NutriSmart.
 *
 * Used to drive macro recalculation and content personalization
 * throughout the application.
 */
export enum UserGoal {
  /** User wants to reduce body weight via a caloric deficit. */
  WEIGHT_LOSS = 'WEIGHT_LOSS',

  /** User wants to increase lean muscle mass via a caloric surplus. */
  MUSCLE_GAIN = 'MUSCLE_GAIN',
}
