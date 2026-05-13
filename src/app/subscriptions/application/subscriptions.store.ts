import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom, retry } from 'rxjs';
import { DomainEventBus } from '../../shared/application/domain-event-bus';
import { BenefitsEnabled } from '../../shared/domain/benefits-enabled.event';
import { BenefitsDisabled } from '../../shared/domain/benefits-disabled.event';
import { SubscriptionActivated } from '../../shared/domain/subscription-activated.event';
import { SubscriptionCancelled } from '../../shared/domain/subscription-cancelled.event';
import { IamStore } from '../../iam/application/iam.store';
import { SubscriptionPlan } from '../../iam/domain/model/subscription-plan.enum';
import { SubscriptionApi } from '../infrastructure/subscription-api';
import { Subscription } from '../domain/model/subscription.entity';

/**
 * Central state store for the Subscriptions bounded context.
 *
 * Orchestrates plan selection, cancellation, and feature entitlement.
 * Publishes cross-context events ({@link SubscriptionActivated},
 * {@link BenefitsEnabled}, {@link SubscriptionCancelled}, {@link BenefitsDisabled})
 * so other bounded contexts can react to billing changes.
 *
 * Provided in root so a single instance is shared across the application.
 */
@Injectable({ providedIn: 'root' })
export class SubscriptionsStore {
  private readonly api      = inject(SubscriptionApi);
  private readonly iamStore = inject(IamStore);
  private readonly eventBus = inject(DomainEventBus);

  // ─── Private Signals ──────────────────────────────────────────────────────

  private _subscription = signal<Subscription | null>(null);
  private _loading      = signal<boolean>(false);
  private _error        = signal<string | null>(null);

  // ─── Public Read-only Signals ─────────────────────────────────────────────

  /** Current subscription entity, or null when none is active. */
  readonly subscription = this._subscription.asReadonly();

  /** Whether an async operation is in flight. */
  readonly loading      = this._loading.asReadonly();

  /** Last error i18n key, or null. */
  readonly error        = this._error.asReadonly();

  // ─── Computed Signals ─────────────────────────────────────────────────────

  /** Feature keys unlocked by the current subscription plan. */
  readonly activeFeatures = computed(() =>
    Subscription.featuresFor(this._subscription()?.plan ?? SubscriptionPlan.BASIC),
  );

  /** True when the user has an active subscription. */
  readonly hasActivePlan = computed(() => this._subscription()?.isActive() ?? false);

  // ─── Actions ──────────────────────────────────────────────────────────────

  /**
   * Loads the subscription for the current user.
   *
   * @param userId - Numeric user ID.
   * @returns Promise that resolves when loading is complete.
   */
  async initialise(userId: number): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      const subscription = await firstValueFrom(this.api.getSubscription(String(userId)));
      this._subscription.set(subscription);
    } catch {
      this._error.set('subscriptions.error_load_failed');
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Activates or upgrades the subscription to the given plan, persists it,
   * and publishes {@link SubscriptionActivated} and {@link BenefitsEnabled}.
   *
   * @param plan - The {@link SubscriptionPlan} tier to activate.
   * @returns Promise that resolves when persistence is complete.
   */
  async selectPlan(plan: SubscriptionPlan): Promise<void> {
    const user = this.iamStore.currentUser();
    if (!user) return;
    this._loading.set(true);
    this._error.set(null);
    try {
      const now      = new Date().toISOString().slice(0, 10);
      const features = Subscription.featuresFor(plan);
      let saved: Subscription;
      const existing = this._subscription();

      if (existing) {
        existing.activate(plan);
        saved = await firstValueFrom(this.api.updateSubscription(existing).pipe(retry(2)));
      } else {
        const draft = new Subscription({ id: 0, userId: user.id, plan, status: 'active', startDate: now, endDate: now });
        draft.activate(plan);
        saved = await firstValueFrom(this.api.createSubscription(draft).pipe(retry(2)));
      }

      this._subscription.set(saved);
      this.iamStore.upgradePlan(plan);
      this.eventBus.publish(new SubscriptionActivated(user.id, plan, features, now));
      this.eventBus.publish(new BenefitsEnabled(user.id, plan, features));
    } catch {
      this._error.set('subscriptions.error_update_failed');
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Cancels the current subscription, persists it, and publishes
   * {@link SubscriptionCancelled} and {@link BenefitsDisabled}.
   *
   * @returns Promise that resolves when persistence is complete.
   */
  async cancelSubscription(): Promise<void> {
    const user         = this.iamStore.currentUser();
    const subscription = this._subscription();
    if (!user || !subscription) return;
    this._loading.set(true);
    this._error.set(null);
    try {
      subscription.cancel();
      const saved = await firstValueFrom(this.api.updateSubscription(subscription).pipe(retry(2)));
      this._subscription.set(saved);
      this.eventBus.publish(new SubscriptionCancelled(user.id, subscription.plan));
      this.eventBus.publish(new BenefitsDisabled(user.id, subscription.plan));
    } catch {
      this._error.set('subscriptions.error_update_failed');
    } finally {
      this._loading.set(false);
    }
  }
}
