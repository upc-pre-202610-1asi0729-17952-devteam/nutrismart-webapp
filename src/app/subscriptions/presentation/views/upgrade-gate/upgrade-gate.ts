import { Component, computed, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { IamStore } from '../../../../iam/application/iam.store';
import { PaymentStore } from '../../../application/payment.store';
import { Subscription } from '../../../domain/model/subscription.entity';
import { SubscriptionPlan } from '../../../../iam/domain/model/subscription-plan.enum';

/** Monthly prices per plan tier (USD). */
const PLAN_PRICES: Record<SubscriptionPlan, number> = {
  [SubscriptionPlan.BASIC]:   7.99,
  [SubscriptionPlan.PRO]:    14.99,
  [SubscriptionPlan.PREMIUM]: 19.99,
};

/**
 * Upgrade gate screen displayed when a user attempts to access a feature
 * that requires a higher subscription tier.
 *
 * Reads the required plan from the `plan` query parameter set by {@link planGuard}.
 * Shows only the features the user would gain by upgrading (delta vs. current plan),
 * then routes into the payment flow on confirmation.
 */
@Component({
  selector: 'app-upgrade-gate',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './upgrade-gate.html',
  styleUrl: './upgrade-gate.css',
})
export class UpgradeGate implements OnInit {
  private readonly route       = inject(ActivatedRoute);
  private readonly router      = inject(Router);
  private readonly iamStore    = inject(IamStore);
  private readonly paymentStore = inject(PaymentStore);

  /** Required plan read from the `plan` query param. */
  readonly requiredPlan = toSignal(
    this.route.queryParamMap.pipe(
      map(params => {
        const val = params.get('plan');
        return (val === 'PRO' || val === 'PREMIUM' || val === 'BASIC')
          ? val as SubscriptionPlan
          : null;
      }),
    ),
    { initialValue: null as SubscriptionPlan | null },
  );

  /** Lowercase plan name for i18n interpolation. */
  readonly planName = computed(() => {
    const p = this.requiredPlan();
    if (!p) return '';
    return p.charAt(0) + p.slice(1).toLowerCase();
  });

  /** Monthly price for the required plan. */
  readonly planPrice = computed(() => {
    const p = this.requiredPlan();
    return p ? PLAN_PRICES[p] : 0;
  });

  /** i18n key for the subtitle, varies by required plan. */
  readonly subtitleKey = computed(() =>
    this.requiredPlan() === SubscriptionPlan.PREMIUM
      ? 'upgrade_gate.subtitle_premium'
      : 'upgrade_gate.subtitle_pro',
  );

  /**
   * Features the user would gain — delta between required plan and current plan.
   * Each string maps to the `subscriptions.features_*` i18n namespace.
   */
  readonly exclusiveFeatures = computed(() => {
    const required = this.requiredPlan();
    if (!required) return [];
    const userPlan        = this.iamStore.currentUser()?.plan ?? SubscriptionPlan.BASIC;
    const requiredSet     = Subscription.featuresFor(required);
    const currentSet      = new Set(Subscription.featuresFor(userPlan));
    return requiredSet.filter(f => !currentSet.has(f));
  });

  ngOnInit(): void {
    const required = this.requiredPlan();
    const user     = this.iamStore.currentUser();
    if (!required || !user) {
      this.router.navigate(['/dashboard']);
      return;
    }
    const alreadyUnlocked =
      required === SubscriptionPlan.PREMIUM ? user.isPremium() :
      required === SubscriptionPlan.PRO     ? user.isPro()     :
      true;
    if (alreadyUnlocked) {
      this.router.navigate(['/dashboard']);
    }
  }

  /**
   * Maps an internal feature key to its i18n translation key.
   *
   * @param feature - Internal feature key from {@link Subscription.featuresFor}.
   * @returns The `subscriptions.features_*` i18n key.
   */
  protected featureI18nKey(feature: string): string {
    return `subscriptions.features_${feature}`;
  }

  /**
   * Stores the required plan in {@link PaymentStore} and starts the payment flow.
   * If a card is already on file the payment gateway redirects straight to checkout.
   */
  upgrade(): void {
    const plan = this.requiredPlan();
    if (!plan) return;
    this.paymentStore.setPlan(plan);
    this.router.navigate(['/subscription/payment']);
  }

  /** Navigates to the dashboard as a safe exit from the gate. */
  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
