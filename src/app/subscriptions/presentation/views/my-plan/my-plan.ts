import { Component, inject, OnInit, signal } from '@angular/core';
import { SubscriptionPlan } from '../../../../iam/domain/model/subscription-plan.enum';
import { SubscriptionsStore } from '../../../application/subscriptions.store';
import { SubscriptionsApi } from '../../../infrastructure/subscriptions-api';
import { PlanCardsComponent } from '../../components/plan-cards/plan-cards';
import { UpgradeDialogComponent } from '../../components/upgrade-dialog/upgrade-dialog';
import { DowngradeDialogComponent } from '../../components/downgrade-dialog/downgrade-dialog';

/**
 * Subscription management view — route `/my-plan`.
 *
 * Displays the active plan banner, plan comparison cards (T24),
 * payment history table, and upgrade/downgrade confirmation dialogs (T25).
 *
 * @author Mora Rivera, Joel Fernando
 */
@Component({
  selector: 'app-my-plan',
  imports: [
    PlanCardsComponent,
    UpgradeDialogComponent,
    DowngradeDialogComponent,
  ],
  templateUrl: './my-plan.html',
  styleUrl: './my-plan.css',
})
export class MyPlan implements OnInit {

  protected subsStore   = inject(SubscriptionsStore);
  private   subsApi     = inject(SubscriptionsApi);

  /** Target plan for the upgrade dialog — null when closed. */
  protected upgradingTo   = signal<SubscriptionPlan | null>(null);

  /** Target plan for the downgrade dialog — null when closed. */
  protected downgradingTo = signal<SubscriptionPlan | null>(null);

  /** Plan prices per tier. */
  protected planPrice(plan: SubscriptionPlan): string {
    const prices: Record<SubscriptionPlan, string> = {
      [SubscriptionPlan.BASIC]:   '9.99',
      [SubscriptionPlan.PRO]:     '14.99',
      [SubscriptionPlan.PREMIUM]: '19.99',
    };
    return prices[plan];
  }

  async ngOnInit(): Promise<void> {
    await this.subsStore.fetchActivePlan();
    await this.subsStore.fetchBillingHistory();
  }

  /** Opens the upgrade dialog for the target plan. */
  onUpgrade(plan: SubscriptionPlan): void {
    this.upgradingTo.set(plan);
  }

  /** Opens the downgrade dialog for the target plan. */
  onDowngrade(plan: SubscriptionPlan): void {
    this.downgradingTo.set(plan);
  }

  /** Confirms and executes the upgrade (SubscriptionActivated). */
  async onConfirmUpgrade(plan: SubscriptionPlan): Promise<void> {
    await this.subsStore.upgradePlan(plan);
    //this.upgradingTo.set(null);
  }

  /** Confirms and executes the downgrade. */
  async onConfirmDowngrade(): Promise<void> {
    const target = this.downgradingTo();
    if (!target) return;
    await this.subsStore.downgradePlan(target);
    this.downgradingTo.set(null);
  }

  /** Cancels the active subscription. */
  async onCancelPlan(): Promise<void> {
    await this.subsStore.cancelPlan();
  }

  /** Opens a mock PDF receipt. */
  onDownloadReceipt(id: number): void {
    window.open(this.subsApi.downloadReceipt(id), '_blank');
  }
}
