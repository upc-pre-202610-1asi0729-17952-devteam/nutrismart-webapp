import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Location, LowerCasePipe } from '@angular/common';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageSwitcher } from '../../../../shared/presentation/components/language-switcher/language-switcher';
import { SubscriptionsStore } from '../../../application/subscriptions.store';
import { PaymentStore } from '../../../application/payment.store';
import { IamStore } from '../../../../iam/application/iam.store';
import { SubscriptionPlan } from '../../../../iam/domain/model/subscription-plan.enum';

interface SubscriptionPlansNavState {
  fromProfile?: boolean;
}

interface PlanCard {
  plan: SubscriptionPlan;
  nameKey: string;
  price: string;
  badgeKey?: string;
  featured: boolean;
  featureKeys: string[];
}

/**
 * Plan selection view (step 1 of the subscription flow).
 *
 * Renders BASIC / PRO / PREMIUM plan cards. Selecting a card stores the
 * chosen plan in {@link PaymentStore} and navigates to the payment step.
 * No subscription is activated here — that happens after payment confirmation.
 */
@Component({
  selector: 'app-subscription-plans',
  standalone: true,
  imports: [TranslatePipe, LowerCasePipe, LanguageSwitcher],
  templateUrl: './subscription-plans.html',
  styleUrl: './subscription-plans.css',
})
export class SubscriptionPlans implements OnInit {
  protected readonly store     = inject(SubscriptionsStore);
  private   readonly payStore  = inject(PaymentStore);
  private   readonly iamStore  = inject(IamStore);
  private   readonly router    = inject(Router);
  private   readonly location  = inject(Location);

  private readonly _fromProfile = signal<boolean>(
    (history.state as SubscriptionPlansNavState)?.fromProfile === true,
  );

  readonly fromProfile = this._fromProfile.asReadonly();

  /** Currently active plan, preferring the subscription store as the source of truth. */
  readonly currentPlan = computed(() => {
    const sub = this.store.subscription();
    if (sub?.isActive()) return sub.plan;
    return this.iamStore.currentUser()?.plan ?? null;
  });

  /** True when the cancellation confirmation modal is visible. */
  readonly showCancelConfirm = signal<boolean>(false);

  readonly plans: PlanCard[] = [
    {
      plan:        SubscriptionPlan.BASIC,
      nameKey:     'subscription.plan_basic',
      price:       '$7.99',
      featured:    false,
      featureKeys: [
        'subscription.feature_nutrition_log',
        'subscription.feature_basic_dashboard',
        'subscription.feature_bmi_bmr_tdee',
      ],
    },
    {
      plan:        SubscriptionPlan.PRO,
      nameKey:     'subscription.plan_pro',
      price:       '$14.99',
      badgeKey:    'subscription.badge_popular',
      featured:    true,
      featureKeys: [
        'subscription.feature_everything_basic',
        'subscription.feature_smart_scan',
        'subscription.feature_travel_mode',
        'subscription.feature_weather_rec',
        'subscription.feature_pantry',
      ],
    },
    {
      plan:        SubscriptionPlan.PREMIUM,
      nameKey:     'subscription.plan_premium',
      price:       '$19.99',
      badgeKey:    'subscription.badge_best',
      featured:    false,
      featureKeys: [
        'subscription.feature_everything_pro',
        'subscription.feature_wearable',
        'subscription.feature_restaurant',
        'subscription.feature_unlimited',
        'subscription.feature_pdf',
      ],
    },
  ];

  async ngOnInit(): Promise<void> {
    const user = this.iamStore.currentUser();
    if (user) await this.store.initialise(user.id);
  }

  goBack(): void {
    this.location.back();
  }

  maybeLater(): void {
    this.iamStore.logout();
  }

  /**
   * Stores the selected plan and navigates to the payment step.
   *
   * @param plan - The {@link SubscriptionPlan} tier chosen by the user.
   */
  selectPlan(plan: SubscriptionPlan): void {
    this.payStore.setPlan(plan);
    this.router.navigate(['/subscription/payment']);
  }

  /** Opens the cancellation confirmation dialog. */
  requestCancel(): void {
    this.showCancelConfirm.set(true);
  }

  /** Confirms and processes subscription cancellation. */
  async confirmCancel(): Promise<void> {
    await this.store.cancelSubscription();
    this.showCancelConfirm.set(false);
  }

  /** Dismisses the cancellation confirmation dialog. */
  dismissCancel(): void {
    this.showCancelConfirm.set(false);
  }
}
