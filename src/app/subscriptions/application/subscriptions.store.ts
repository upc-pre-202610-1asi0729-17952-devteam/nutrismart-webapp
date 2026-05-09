import { computed, inject, Injectable, signal } from '@angular/core';
import { IamStore } from '../../iam/application/iam.store';
import { SubscriptionPlan } from '../../iam/domain/model/subscription-plan.enum';
import { Subscription } from '../domain/model/subscription.entity';
import { BillingRecord } from '../domain/model/billing-record.entity';
import { SubscriptionsApi } from '../infrastructure/subscriptions-api';

/**
 * Central state store for the Subscriptions bounded context.
 *
 * Manages the active subscription plan and billing history using Angular
 * Signals. All mutations are persisted via {@link SubscriptionsApi}.
 *
 * Provided in root so a single instance is shared across the application.
 *
 * @author Mora Rivera, Joel Fernando
 */
@Injectable({ providedIn: 'root' })
export class SubscriptionsStore {
  private subsApi  = inject(SubscriptionsApi);
  private iamStore = inject(IamStore);

  // ─── Private Signals ─────────────────────────────────────────────────────

  private _subscription   = signal<Subscription | null>(null);
  private _billingHistory = signal<BillingRecord[]>([]);
  private _loading        = signal<boolean>(false);
  private _error          = signal<string | null>(null);

  // ─── Public Read-only Signals ─────────────────────────────────────────────

  readonly subscription   = this._subscription.asReadonly();
  readonly billingHistory = this._billingHistory.asReadonly();
  readonly loading        = this._loading.asReadonly();
  readonly error          = this._error.asReadonly();

  // ─── Computed ─────────────────────────────────────────────────────────────

  /** The user's current plan tier (falls back to IAM store). */
  readonly currentPlan = computed(() =>
    this._subscription()?.plan ?? this.iamStore.currentUser()?.plan ?? SubscriptionPlan.BASIC
  );

  /** Whether the current plan is BASIC. */
  readonly isBasic   = computed(() => this.currentPlan() === SubscriptionPlan.BASIC);

  /** Whether the current plan is PRO. */
  readonly isPro     = computed(() => this.currentPlan() === SubscriptionPlan.PRO);

  /** Whether the current plan is PREMIUM. */
  readonly isPremium = computed(() => this.currentPlan() === SubscriptionPlan.PREMIUM);

  // ─── Actions ──────────────────────────────────────────────────────────────

  /** Loads the active subscription from the API. */
  async fetchActivePlan(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    return new Promise(resolve => {
      this.subsApi.getActivePlan().subscribe({
        next: subs => {
          const userId = String(this.iamStore.currentUser()?.id);
          const userSub = subs.find((s: any) => String(s.userId) === userId);
          this._subscription.set(userSub ?? null);
          this._loading.set(false);
          resolve();
        },
        error: () => {
          this._error.set('Failed to load subscription.');
          this._loading.set(false);
          resolve();
        }
      });
    });
  }

  /** Upgrades the plan — emits SubscriptionActivated on success. */
  async upgradePlan(newPlan: SubscriptionPlan): Promise<void> {
    const sub = this._subscription();
    if (!sub) return;
    this._loading.set(true);
    return new Promise((resolve, reject) => {
      this.subsApi.upgradePlan(sub, newPlan).subscribe({
        next: updated => {
          this._subscription.set(updated);
          this._loading.set(false);
          resolve();
        },
        error: () => {
          this._error.set('Failed to upgrade plan.');
          this._loading.set(false);
          reject();
        }
      });
    });
  }

  /** Downgrades the plan. */
  async downgradePlan(newPlan: SubscriptionPlan): Promise<void> {
    const sub = this._subscription();
    if (!sub) return;
    this._loading.set(true);
    return new Promise((resolve, reject) => {
      this.subsApi.downgradePlan(sub, newPlan).subscribe({
        next: updated => {
          this._subscription.set(updated);
          this._loading.set(false);
          resolve();
        },
        error: () => {
          this._error.set('Failed to downgrade plan.');
          this._loading.set(false);
          reject();
        }
      });
    });
  }

  /** Cancels the active subscription. */
  async cancelPlan(): Promise<void> {
    const sub = this._subscription();
    if (!sub) return;
    this._loading.set(true);
    return new Promise((resolve, reject) => {
      this.subsApi.cancelPlan(sub).subscribe({
        next: updated => {
          this._subscription.set(updated);
          this._loading.set(false);
          resolve();
        },
        error: () => {
          this._error.set('Failed to cancel plan.');
          this._loading.set(false);
          reject();
        }
      });
    });
  }

  /** Loads the billing history from the API. */
  async fetchBillingHistory(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    return new Promise(resolve => {
      this.subsApi.getBillingHistory().subscribe({
        next: records => {
          const userId = String(this.iamStore.currentUser()?.id);
          const userRecords = (records as any[]).filter((r) => String(r.userId) === userId);
          this._billingHistory.set(userRecords);
          this._loading.set(false);
          resolve();
        },
        error: () => {
          this._error.set('Failed to load billing history.');
          this._loading.set(false);
          resolve();
        }
      });
    });
  }
}
