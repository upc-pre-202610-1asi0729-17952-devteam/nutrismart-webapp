import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IamStore } from '../../../../iam/application/iam.store';
import { SubscriptionPlan } from '../../../../iam/domain/model/subscription-plan.enum';

/**
 * Data shape for a single plan card displayed on the subscription screen.
 */
interface PlanCard {
  /** The {@link SubscriptionPlan} this card represents. */
  plan: SubscriptionPlan;
  /** Marketing name shown on the card. */
  name: string;
  /** Price string (e.g. "Free", "$9.99/mo"). */
  price: string;
  /** Optional badge text (e.g. "Most popular", "Save 33%"). */
  badge?: string;
  /** Whether the card uses the featured (teal-bordered) style. */
  featured: boolean;
  /** List of feature bullet points. */
  features: string[];
  /** CTA button label. */
  ctaLabel: string;
}

/**
 * Subscription plan selection view.
 *
 * Displays three plan cards (FREE, PRO, ANNUAL_PRO) and lets the user pick
 * a tier. The PRO card is featured with a teal border and "Most popular" badge.
 * ANNUAL_PRO shows a "Save 33%" badge. On selection the store is updated and
 * the user is navigated to `/dashboard`.
 */
@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [],
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
      plan: SubscriptionPlan.FREE,
      name: 'Free',
      price: 'Free',
      featured: false,
      features: [
        'Basic calorie tracking',
        'Manual food log',
        '7-day history',
        'Limited recommendations',
      ],
      ctaLabel: 'Get started for free',
    },
    {
      plan: SubscriptionPlan.PRO,
      name: 'Pro',
      price: '$9.99/mo',
      badge: 'Most popular',
      featured: true,
      features: [
        'Everything in Free',
        'AI Smart Scan',
        'Unlimited history',
        'Advanced recommendations',
        'Body progress tracking',
        'Wearable sync',
      ],
      ctaLabel: 'Start Pro',
    },
    {
      plan: SubscriptionPlan.ANNUAL_PRO,
      name: 'Annual Pro',
      price: '$7.99/mo',
      badge: 'Save 33%',
      featured: false,
      features: [
        'Everything in Pro',
        'Billed annually ($95.88/yr)',
        'Priority support',
        'Early access to new features',
      ],
      ctaLabel: 'Start Annual Pro',
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
   * Navigates to the login page, effectively deferring the plan selection.
   */
  maybeLater(): void {
    this.router.navigate(['/auth/login']);
  }
}
