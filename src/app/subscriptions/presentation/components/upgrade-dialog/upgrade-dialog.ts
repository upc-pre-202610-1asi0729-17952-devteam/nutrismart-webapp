import { Component, EventEmitter, inject, input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IamStore } from '../../../../iam/application/iam.store';
import { SubscriptionPlan } from '../../../../iam/domain/model/subscription-plan.enum';

/**
 * Upgrade confirmation dialog with payment form, declined state,
 * and SubscriptionActivated success state (T25).
 *
 * @author Mora Rivera, Joel Fernando
 */
@Component({
  selector: 'app-upgrade-dialog',
  imports: [FormsModule],
  templateUrl: './upgrade-dialog.html',
  styleUrl: './upgrade-dialog.css',
})
export class UpgradeDialogComponent {
  targetPlan = input.required<SubscriptionPlan>();
  loading = input<boolean>(false);

  @Output() confirm = new EventEmitter<SubscriptionPlan>();
  @Output() cancel = new EventEmitter<void>();

  private router = inject(Router);
  private iamStore = inject(IamStore);

  protected cardName = '';
  protected cardNumber = '';
  protected cardExpiry = '';
  protected cardCvc = '';

  protected paymentDeclined = signal(false);
  protected upgradeSuccess = signal(false);

  get planName(): string {
    return this.targetPlan().charAt(0) + this.targetPlan().slice(1).toLowerCase();
  }

  get planPrice(): string {
    return this.targetPlan() === SubscriptionPlan.PRO ? '14.99' : '19.99';
  }

  get newFeatures(): string[] {
    if (this.targetPlan() === SubscriptionPlan.PRO) {
      return [
        'Smart Scan (plate photo)',
        'Travel Mode',
        'Wearable Sync (Google Fit)',
        'Pantry and recipes',
      ];
    }
    return [
      'Restaurant menu analysis',
      'Unlimited history',
      'Export PDF report',
      'Google Fit Sync Premium',
    ];
  }

  get userName(): string {
    return this.iamStore.currentUser()?.firstName ?? 'User';
  }

  onPay(): void {
    const last4 = this.cardNumber.replace(/\s/g, '').slice(-4);
    if (last4 === '0000') {
      this.paymentDeclined.set(true);
      return;
    }
    this.confirm.emit(this.targetPlan());
    this.upgradeSuccess.set(true);
    this.paymentDeclined.set(false);
  }

  onGoToDashboard(): void {
    this.router.navigate(['/dashboard']);
    this.cancel.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('dialog-backdrop')) {
      this.cancel.emit();
    }
  }

  isCardInvalid(): boolean {
    return this.cardNumber.replace(/\s/g, '').slice(-4) === '0000'
      || this.cardNumber.trim() === '';
  }
}
