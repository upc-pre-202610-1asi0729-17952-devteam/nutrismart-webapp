/**
 * Subscription tiers available in NutriSmart.
 *
 * Controls access to premium features throughout the application.
 * Use {@link User.isPro} and {@link User.canUpgrade} for business-rule checks.
 */
export enum SubscriptionPlan {
  /** Free tier with limited feature access. */
  FREE = 'FREE',

  /** Monthly Pro subscription with full feature access. */
  PRO = 'PRO',

  /** Annual Pro subscription at a discounted rate (saves 33%). */
  ANNUAL_PRO = 'ANNUAL_PRO',
}
