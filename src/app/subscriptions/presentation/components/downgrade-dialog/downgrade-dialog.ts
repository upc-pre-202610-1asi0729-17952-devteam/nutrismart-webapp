import { Component, EventEmitter, input, Output } from '@angular/core';
import { SubscriptionPlan } from '../../../../iam/domain/model/subscription-plan.enum';

/**
 * Downgrade confirmation dialog (T25).
 *
 * Shows features that will be lost, the effective date, and a confirm button.
 *
 * @author Mora Rivera, Joel Fernando
 */
@Component({
  selector: 'app-downgrade-dialog',
  templateUrl: './downgrade-dialog.html',
  styleUrl: './downgrade-dialog.css',
})
export class DowngradeDialogComponent {

  currentPlan  = input.required<SubscriptionPlan>();
  targetPlan   = input.required<SubscriptionPlan>();
  renewalDate  = input<string>('14 May 2026');
  loading      = input<boolean>(false);

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel  = new EventEmitter<void>();

  get targetPlanName(): string {
    return this.targetPlan().charAt(0) + this.targetPlan().slice(1).toLowerCase();
  }

  get featuresLost(): string[] {
    const proFeatures     = ['Smart Scan', 'Travel Mode', 'Wearable Sync', 'Pantry & recipes'];
    const premiumFeatures = [
      'Restaurant menu analysis',
      'Unlimited history',
      'Export PDF report',
      'Google Fit Sync Premium',
    ];

    if (this.currentPlan() === SubscriptionPlan.PREMIUM && this.targetPlan() === SubscriptionPlan.PRO) {
      return premiumFeatures;
    }
    if (this.currentPlan() === SubscriptionPlan.PREMIUM && this.targetPlan() === SubscriptionPlan.BASIC) {
      return [...proFeatures, ...premiumFeatures];
    }
    return proFeatures;
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('dialog-backdrop')) {
      this.cancel.emit();
    }
  }
}
