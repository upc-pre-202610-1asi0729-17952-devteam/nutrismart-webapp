/**
 * Represents the four daily meal windows supported by the nutrition log.
 *
 * Used to group {@link MealRecord} entries by meal time and to detect
 * when a meal window has passed without a log entry (MealSkipped event).
 *
 * @author Mora Rivera, Joel Fernando
 */
export enum MealType {
  BREAKFAST = 'BREAKFAST',
  LUNCH     = 'LUNCH',
  SNACK     = 'SNACK',
  DINNER    = 'DINNER',
}
