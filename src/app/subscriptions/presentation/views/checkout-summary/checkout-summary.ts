import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { PaymentStore } from '../../../application/payment.store';
import { IamStore } from '../../../../../iam/application/iam.store';

/**
 * Order review screen (step 3 of the subscription flow).
 *
 * Displays plan name, price, and masked card details so the user can
 * verify before confirming. Delegates the actual charge to {@link PaymentStore}.
 */
@Component({
  selector: 'app-checkout-summary',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './checkout-summary.html',
  styleUrl: './checkout-summary.css',
})
export class CheckoutSummary implements OnInit {
  private readonly router   = inject(Router);
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

  /** Navigates back to the payment form to adjust card details. */
  goBack(): void {
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
