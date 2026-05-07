/**
 * Dietary restrictions a user may have.
 *
 * Stored on the {@link User} entity and passed to the recommendation engine
 * to filter out incompatible foods and restaurant dishes.
 */
export enum DietaryRestriction {
  /** Excludes foods containing lactose. */
  LACTOSE_FREE = 'LACTOSE_FREE',

  /** Excludes foods containing gluten. */
  GLUTEN_FREE = 'GLUTEN_FREE',

  /** Excludes all animal-derived products. */
  VEGAN = 'VEGAN',

  /** Excludes meat and fish but allows other animal products. */
  VEGETARIAN = 'VEGETARIAN',

  /** Excludes tree nuts and peanuts. */
  NUT_FREE = 'NUT_FREE',

  /** Excludes all seafood and shellfish. */
  SEAFOOD_FREE = 'SEAFOOD_FREE',

  /** Follows kosher dietary laws. */
  KOSHER = 'KOSHER',

  /** Follows halal dietary laws. */
  HALAL = 'HALAL',
}
