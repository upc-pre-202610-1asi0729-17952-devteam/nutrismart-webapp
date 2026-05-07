import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { IamStore } from '../../../../iam/application/iam.store';
import { SubscriptionPlan } from '../../../../iam/domain/model/subscription-plan.enum';

/**
 * Data shape for a single plan card displayed on the subscription screen.
 */
interface PlanCard {
  /** The {@link SubscriptionPlan} this card represents. */
  plan: SubscriptionPlan;
  /** i18n key for the plan name. */
  nameKey: string;
  /** Price string (e.g. "$7.99"). */
  price: string;
  /** i18n key for an optional badge (e.g. "Most popular", "Best value"). */
  badgeKey?: string;
  /** Whether the card uses the featured (highlighted) style. */
  featured: boolean;
  /** List of i18n feature keys. */
  features: string[];
  /** i18n key for the CTA button label. */
  ctaKey: string;
  /** i18n key for the plan description. */
  descKey: string;
}

/**
 * Subscription plan selection view.
 *
 * Displays three plan cards (BASIC, PRO, PREMIUM) and lets the user pick
 * a tier. The PRO card is featured with a "Most popular" badge. PREMIUM shows
 * a "Best value" badge. On selection the store is updated and the user is
 * navigated to `/dashboard`.
 */
@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './subscription.html',
  styleUrl: './subscription.css',
})
export class Subscription {
  /** IAM store used to upgrade the user's plan. */
  private iamStore = inject(IamStore);

  /** Angular router for post-selection navigation. */
  private router = inject(Router);

  /**
   * Plan card definitions rendered in the template.
   */
  readonly plans: PlanCard[] = [
    {
      plan: SubscriptionPlan.BASIC,
      nameKey: 'subscription.plan_basic',
      price: '$7.99',
      featured: false,
      descKey: 'subscription.desc_basic',
      features: [
        'subscription.feature_nutrition_log',
        'subscription.feature_basic_dashboard',
        'subscription.feature_bmi_bmr_tdee',
      ],
      ctaKey: 'subscription.cta_basic',
    },
    {
      plan: SubscriptionPlan.PRO,
      nameKey: 'subscription.plan_pro',
      price: '$14.99',
      badgeKey: 'subscription.badge_popular',
      featured: true,
      descKey: 'subscription.desc_pro',
      features: [
        'subscription.feature_everything_basic',
        'subscription.feature_smart_scan',
        'subscription.feature_travel_mode',
        'subscription.feature_weather_rec',
        'subscription.feature_pantry',
      ],
      ctaKey: 'subscription.cta_pro',
    },
    {
      plan: SubscriptionPlan.PREMIUM,
      nameKey: 'subscription.plan_premium',
      price: '$19.99',
      badgeKey: 'subscription.badge_best',
      featured: false,
      descKey: 'subscription.desc_premium',
      features: [
        'subscription.feature_everything_pro',
        'subscription.feature_wearable',
        'subscription.feature_restaurant',
        'subscription.feature_unlimited',
        'subscription.feature_pdf',
      ],
      ctaKey: 'subscription.cta_premium',
    },
  ];

  /**
   * Handles plan selection: updates the store and navigates to the dashboard.
   *
   * @param plan - The {@link SubscriptionPlan} the user selected.
   */
  selectPlan(plan: SubscriptionPlan): void {
    this.iamStore.upgradePlan(plan);
    this.router.navigate(['/dashboard']);
  }

  /**
   * Navigates to the dashboard, deferring the plan selection.
   */
  maybeLater(): void {
    this.router.navigate(['/dashboard']);
  }
}
