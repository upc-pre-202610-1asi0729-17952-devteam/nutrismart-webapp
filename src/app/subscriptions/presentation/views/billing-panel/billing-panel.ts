import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { DecimalPipe } from '@angular/common';
import { SubscriptionsStore } from '../../../application/subscriptions.store';
import { PaymentStore } from '../../../application/payment.store';
import { IamStore } from '../../../../iam/application/iam.store';
import { BillingRecord } from '../../../domain/model/billing-record.entity';

/**
 * Billing dashboard panel displayed in the profile subscription section.
 *
 * Shows the active plan status (plan name, renewal date, price) and a
 * sortable payment history table. Delegates plan changes to the main
 * payment flow at `/subscription`.
 */
@Component({
  selector: 'app-billing-panel',
  standalone: true,
  imports: [TranslatePipe, DecimalPipe],
  templateUrl: './billing-panel.html',
  styleUrl: './billing-panel.css',
})
export class BillingPanel implements OnInit {
  private readonly router   = inject(Router);
  private readonly iamStore = inject(IamStore);
  private readonly payStore = inject(PaymentStore);

  protected readonly store = inject(SubscriptionsStore);

  protected readonly subscription  = this.store.subscription;
  protected readonly billingHistory = this.store.billingHistory;
  protected readonly loading        = this.store.loading;

  async ngOnInit(): Promise<void> {
    const userId = this.iamStore.currentUser()?.id;
    if (!userId) return;
    if (!this.subscription()) {
      await this.store.initialise(userId);
    } else {
      await this.store.loadBillingHistory(userId);
    }
  }

  /**
   * Routes to the plan selection screen with the flow pre-cleared,
   * so the user can pick a new plan and go through the payment steps.
   */
  changePlan(): void {
    this.payStore.reset();
    this.router.navigate(['/subscription']);
  }

  /**
   * Returns the i18n key for a billing record status.
   *
   * @param record - The billing record to label.
   */
  protected statusKey(record: BillingRecord): string {
    if (record.isTrial()) return 'my_plan.trial';
    if (record.isPaid())  return 'my_plan.paid';
    return 'my_plan.failed';
  }

  /**
   * Returns true when the billing record represents a failed charge.
   *
   * @param record - The billing record to check.
   */
  protected isFailed(record: BillingRecord): boolean {
    return record.status === 'FAILED';
  }
}
