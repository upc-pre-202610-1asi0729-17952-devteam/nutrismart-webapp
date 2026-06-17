import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageSwitcher } from '../../../../shared/presentation/components/language-switcher/language-switcher';
import { DecimalPipe } from '@angular/common';
import { PaymentStore } from '../../../application/payment.store';
import { Subscription } from '../../../domain/model/subscription.entity';

/**
 * Subscription confirmation screen (final step of the payment flow).
 *
 * Displayed after a successful payment. Shows plan details and provides
 * a call-to-action to enter the dashboard.
 */
@Component({
  selector: 'app-subscription-confirmed',
  standalone: true,
  imports: [TranslatePipe, DecimalPipe, LanguageSwitcher],
  templateUrl: './subscription-confirmed.html',
  styleUrl: './subscription-confirmed.css',
})
export class SubscriptionConfirmed implements OnInit {
  private readonly router = inject(Router);
  private readonly store  = inject(PaymentStore);

  protected readonly plan  = this.store.selectedPlan;
  protected readonly price = this.store.selectedPrice;

  /** Feature keys for the selected plan, used to render the feature list. */
  protected readonly features = (() => {
    const plan = this.store.selectedPlan();
    return plan ? Subscription.featuresFor(plan) : [];
  })();

  ngOnInit(): void {
    if (!this.store.confirmed()) {
      this.router.navigate(['/subscription']);
    }
  }

  /** Navigates to the main dashboard and resets payment flow state. */
  goToDashboard(): void {
    this.store.clearFlow();
    this.router.navigate(['/dashboard']);
  }
}
