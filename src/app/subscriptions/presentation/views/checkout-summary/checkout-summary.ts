import { Component, inject, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageSwitcher } from '../../../../shared/presentation/components/language-switcher/language-switcher';
import { DecimalPipe } from '@angular/common';
import { PaymentStore } from '../../../application/payment.store';
import { IamStore } from '../../../../iam/application/iam.store';

/**
 * Order review screen (step 3 of the subscription flow).
 *
 * Displays plan name, price and masked card details for final confirmation.
 * The "Edit card" action clears the stored {@link PaymentMethod} and returns
 * to the payment form without losing the selected plan.
 */
@Component({
  selector: 'app-checkout-summary',
  standalone: true,
  imports: [TranslatePipe, DecimalPipe, LanguageSwitcher],
  templateUrl: './checkout-summary.html',
  styleUrl: './checkout-summary.css',
})
export class CheckoutSummary implements OnInit {
  private readonly router   = inject(Router);
  private readonly location = inject(Location);
  private readonly iamStore = inject(IamStore);

  protected readonly store = inject(PaymentStore);

  protected readonly plan          = this.store.selectedPlan;
  protected readonly price         = this.store.selectedPrice;
  protected readonly paymentMethod = this.store.paymentMethod;
  protected readonly processing    = this.store.processing;
  protected readonly error         = this.store.error;

  ngOnInit(): void {
    if (!this.store.readyForCheckout()) {
      this.router.navigate(['/subscription']);
    }
  }

  goBack(): void {
    this.location.back();
  }

  /**
   * Removes the stored card and navigates back to the payment form.
   * The selected plan is preserved so checkout resumes seamlessly after re-entry.
   */
  editCard(): void {
    this.store.clearPaymentMethod();
    this.router.navigate(['/subscription/payment']);
  }

  /**
   * Submits the payment intent and navigates to the confirmation screen on success.
   */
  async confirm(): Promise<void> {
    const userId = this.iamStore.currentUser()?.id;
    if (!userId) return;
    const success = await this.store.confirmPayment(userId);
    if (success) {
      this.router.navigate(['/subscription/confirmed']);
    }
  }
}
