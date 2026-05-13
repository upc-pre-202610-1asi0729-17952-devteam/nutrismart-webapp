/**
 * Classifies the nutritional risk of adding a meal record
 * relative to the user's daily caloric goal.
 *
 * @author Mora Rivera, Joel Fernando
 */
export enum NutritionalRiskLevel {
  /** Combined total stays below 80 % of the daily goal. */
  SAFE     = 'SAFE',
  /** Combined total reaches 80–99 % of the daily goal. */
  MODERATE = 'MODERATE',
  /** Combined total meets or exceeds the daily goal. */
  HIGH     = 'HIGH',
}
