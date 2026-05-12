import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { LowerCasePipe } from '@angular/common';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { SubscriptionsStore } from '../../../application/subscriptions.store';
import { IamStore } from '../../../../iam/application/iam.store';
import { SubscriptionPlan } from '../../../../iam/domain/model/subscription-plan.enum';

interface PlanCard {
  plan: SubscriptionPlan;
  nameKey: string;
  price: string;
  badgeKey?: string;
  featured: boolean;
  featureKeys: string[];
  ctaKey: string;
}

/**
 * Subscription plan management view for the Subscriptions bounded context.
 *
 * Renders three plan cards (BASIC / PRO / PREMIUM) and delegates activation
 * and cancellation to {@link SubscriptionsStore}. Supports two modes:
 * - **Setup** (post-onboarding): user picks a plan for the first time.
 * - **Manage** (my-plan): user views their current plan and can cancel.
 */
@Component({
  selector: 'app-subscription-plans',
  standalone: true,
  imports: [TranslatePipe, LowerCasePipe],
  templateUrl: './subscription-plans.html',
  styleUrl: './subscription-plans.css',
})
export class SubscriptionPlans implements OnInit {
  protected readonly store   = inject(SubscriptionsStore);
  private   readonly iamStore = inject(IamStore);
  private   readonly router   = inject(Router);

  /** Currently selected plan, or null. */
  readonly currentPlan = computed(() => this.iamStore.currentUser()?.plan ?? null);

  /** True when the user cancellation confirmation modal is visible. */
  readonly showCancelConfirm = signal<boolean>(false);

  readonly plans: PlanCard[] = [
    {
      plan:        SubscriptionPlan.BASIC,
      nameKey:     'subscriptions.plan_basic',
      price:       '$7.99',
      featured:    false,
      featureKeys: [
        'subscriptions.features_nutrition_log',
        'subscriptions.features_basic_dashboard',
        'subscriptions.features_bmi_bmr_tdee',
      ],
      ctaKey: 'subscriptions.cta_select',
    },
    {
      plan:        SubscriptionPlan.PRO,
      nameKey:     'subscriptions.plan_pro',
      price:       '$14.99',
      badgeKey:    'subscription.badge_popular',
      featured:    true,
      featureKeys: [
        'subscriptions.features_nutrition_log',
        'subscriptions.features_basic_dashboard',
        'subscriptions.features_bmi_bmr_tdee',
        'subscriptions.features_smart_scan',
        'subscriptions.features_travel_mode',
        'subscriptions.features_weather_recs',
        'subscriptions.features_pantry',
      ],
      ctaKey: 'subscriptions.cta_select',
    },
    {
      plan:        SubscriptionPlan.PREMIUM,
      nameKey:     'subscriptions.plan_premium',
      price:       '$19.99',
      badgeKey:    'subscription.badge_best',
      featured:    false,
      featureKeys: [
        'subscriptions.features_nutrition_log',
        'subscriptions.features_basic_dashboard',
        'subscriptions.features_bmi_bmr_tdee',
        'subscriptions.features_smart_scan',
        'subscriptions.features_travel_mode',
        'subscriptions.features_weather_recs',
        'subscriptions.features_pantry',
        'subscriptions.features_wearable_sync',
        'subscriptions.features_restaurant_menu',
        'subscriptions.features_unlimited_history',
        'subscriptions.features_pdf_reports',
      ],
      ctaKey: 'subscriptions.cta_select',
    },
  ];

  async ngOnInit(): Promise<void> {
    const user = this.iamStore.currentUser();
    if (user) await this.store.initialise(user.id);
  }

  /**
   * Selects a plan and navigates to the dashboard on success.
   *
   * @param plan - The chosen {@link SubscriptionPlan}.
   */
  async selectPlan(plan: SubscriptionPlan): Promise<void> {
    await this.store.selectPlan(plan);
    if (!this.store.error()) {
      this.router.navigate(['/dashboard']);
    }
  }

  /** Confirms and processes subscription cancellation. */
  async confirmCancel(): Promise<void> {
    await this.store.cancelSubscription();
    this.showCancelConfirm.set(false);
  }

  /** Opens the cancellation confirmation dialog. */
  requestCancel(): void {
    this.showCancelConfirm.set(true);
  }

  /** Dismisses the cancellation confirmation dialog. */
  dismissCancel(): void {
    this.showCancelConfirm.set(false);
  }
}
