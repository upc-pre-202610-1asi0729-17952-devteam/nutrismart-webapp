/**
 * Describes how physically active a user is on a daily basis.
 *
 * Each level maps to a specific activity multiplier used in the
 * Mifflin-St Jeor TDEE calculation inside {@link User.recalculateMacros}.
 */
export enum ActivityLevel {
  /** Little to no exercise (multiplier: 1.2). */
  SEDENTARY = 'SEDENTARY',

  /** Light exercise 1–3 days/week (multiplier: 1.375). */
  MODERATE = 'MODERATE',

  /** Moderate exercise 3–5 days/week (multiplier: 1.55). */
  ACTIVE = 'ACTIVE',

  /** Hard exercise 6–7 days/week (multiplier: 1.725). */
  VERY_ACTIVE = 'VERY_ACTIVE',
}
