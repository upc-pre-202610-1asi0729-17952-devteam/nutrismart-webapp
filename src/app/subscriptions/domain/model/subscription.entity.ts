import { SubscriptionPlan } from '../../../iam/domain/model/subscription-plan.enum';

export type SubscriptionStatus = 'active' | 'cancelled' | 'expired';

export interface SubscriptionProps {
  id: number;
  userId: number;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
}

const PLAN_FEATURES: Record<SubscriptionPlan, string[]> = {
  [SubscriptionPlan.BASIC]: [
    'nutrition_log',
    'basic_dashboard',
    'bmi_bmr_tdee',
  ],
  [SubscriptionPlan.PRO]: [
    'nutrition_log',
    'basic_dashboard',
    'bmi_bmr_tdee',
    'smart_scan',
    'travel_mode',
    'weather_recs',
    'pantry',
  ],
  [SubscriptionPlan.PREMIUM]: [
    'nutrition_log',
    'basic_dashboard',
    'bmi_bmr_tdee',
    'smart_scan',
    'travel_mode',
    'weather_recs',
    'pantry',
    'wearable_sync',
    'restaurant_menu',
    'unlimited_history',
    'pdf_reports',
  ],
};

/**
 * Subscription aggregate root for the Subscriptions bounded context.
 *
 * Encapsulates plan lifecycle: activation, cancellation, and renewal.
 * Feature entitlement is derived from the plan tier via {@link featuresFor}.
 */
export class Subscription {
  id: number;
  userId: number;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;

  constructor(props: SubscriptionProps) {
    this.id        = props.id;
    this.userId    = props.userId;
    this.plan      = props.plan;
    this.status    = props.status;
    this.startDate = props.startDate;
    this.endDate   = props.endDate;
  }

  /**
   * Returns the feature keys unlocked by the given plan tier.
   *
   * @param plan - The subscription tier to query.
   * @returns Array of feature key strings.
   */
  static featuresFor(plan: SubscriptionPlan): string[] {
    return PLAN_FEATURES[plan];
  }

  /**
   * Activates the subscription under a new plan.
   *
   * @param plan - The plan tier to activate.
   */
  activate(plan: SubscriptionPlan): void {
    this.plan      = plan;
    this.status    = 'active';
    this.startDate = new Date().toISOString().slice(0, 10);
    this.endDate   = this.computeEndDate(30);
  }

  /** Marks the subscription as cancelled. */
  cancel(): void {
    this.status = 'cancelled';
  }

  /** Extends the billing cycle by 30 days from today. */
  renew(): void {
    this.endDate = this.computeEndDate(30);
  }

  /** Returns true when the subscription is currently active. */
  isActive(): boolean {
    return this.status === 'active';
  }

  private computeEndDate(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }
}
