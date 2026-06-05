import { computed, inject, Injectable, signal } from '@angular/core';
import { filter, firstValueFrom } from 'rxjs';
import { DomainEventBus } from '../../shared/application/domain-event-bus';
import { SessionTerminated } from '../../shared/domain/session-terminated.event';
import { SubscriptionPlan } from '../../iam/domain/model/subscription-plan.enum';
import { PaymentGatewayPort } from '../domain/ports/payment-gateway.port';
import { PaymentIntent } from '../domain/model/payment-intent.entity';
import { PaymentMethod } from '../domain/model/payment-method.value-object';
import { SubscriptionsStore } from './subscriptions.store';
import { Subscription } from '../domain/model/subscription.entity';

/** Alias for the canonical plan prices defined on the domain entity. */
const PLAN_PRICES = Subscription.MONTHLY_PRICES;

const STORAGE_KEY = 'nutrismart_payment_method';

/**
 * State store for the multi-step payment flow.
 *
 * Orchestrates: plan selection → card entry → gateway processing → confirmation.
 * The actual subscription activation is delegated to {@link SubscriptionsStore}
 * after a successful payment.
 *
 * The stored {@link PaymentMethod} survives plan changes within the same session
 * so the user is not asked to re-enter their card when switching plans.
 * Call {@link clearPaymentMethod} to explicitly remove it (e.g. "Edit card" action).
 *
 * Provided in root so state survives navigation between payment steps.
 */
@Injectable({ providedIn: 'root' })
export class PaymentStore {
  private readonly gateway            = inject(PaymentGatewayPort);
  private readonly subscriptionsStore = inject(SubscriptionsStore);
  private readonly eventBus           = inject(DomainEventBus);

  // ─── Private Signals ──────────────────────────────────────────────────────

  private _selectedPlan  = signal<SubscriptionPlan | null>(null);
  private _paymentMethod = signal<PaymentMethod | null>(null);
  private _processing    = signal<boolean>(false);
  private _confirmed     = signal<boolean>(false);
  private _error         = signal<string | null>(null);

  constructor() {
    this.restorePaymentMethod();
    // Root services live for the full app lifetime — no takeUntilDestroyed needed.
    this.eventBus.events$
      .pipe(filter(e => e instanceof SessionTerminated))
      .subscribe(() => this.reset());
  }

  // ─── Storage helpers ──────────────────────────────────────────────────────

  private saveToStorage(method: PaymentMethod): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      holderName:  method.holderName,
      last4:       method.last4,
      brand:       method.brand,
      expiryMonth: method.expiryMonth,
      expiryYear:  method.expiryYear,
    }));
  }

  private restorePaymentMethod(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      this._paymentMethod.set(new PaymentMethod(JSON.parse(raw)));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  private clearFromStorage(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  // ─── Public Read-only Signals ─────────────────────────────────────────────

  /** The plan the user chose on the plan selection screen. */
  readonly selectedPlan  = this._selectedPlan.asReadonly();

  /** The card saved during this session, or null. Persists across plan changes. */
  readonly paymentMethod = this._paymentMethod.asReadonly();

  /** True while the gateway request is in flight. */
  readonly processing    = this._processing.asReadonly();

  /** True after a successful payment confirmation. */
  readonly confirmed     = this._confirmed.asReadonly();

  /** Last error i18n key, or null. */
  readonly error         = this._error.asReadonly();

  // ─── Computed Signals ─────────────────────────────────────────────────────

  /** Monthly price for the selected plan in USD. */
  readonly selectedPrice = computed(() => {
    const plan = this._selectedPlan();
    return plan ? PLAN_PRICES[plan] : 0;
  });

  /** True when both plan and payment method are set, ready for checkout. */
  readonly readyForCheckout = computed(
    () => this._selectedPlan() !== null && this._paymentMethod() !== null,
  );

  // ─── Actions ──────────────────────────────────────────────────────────────

  /**
   * Sets the plan chosen on the plan selection screen.
   *
   * The existing {@link paymentMethod} is intentionally preserved so the user
   * does not need to re-enter their card when switching between plans.
   *
   * @param plan - The {@link SubscriptionPlan} tier chosen.
   */
  setPlan(plan: SubscriptionPlan): void {
    this._selectedPlan.set(plan);
    this._confirmed.set(false);
    this._error.set(null);
  }

  /**
   * Stores the card details entered on the payment gateway form.
   *
   * @param method - The validated {@link PaymentMethod} value object.
   */
  setPaymentMethod(method: PaymentMethod): void {
    this._paymentMethod.set(method);
    this._error.set(null);
    this.saveToStorage(method);
  }

  /**
   * Removes the stored card, forcing the user back to the payment form.
   * Used by the "Edit card" action in the checkout screen.
   */
  clearPaymentMethod(): void {
    this._paymentMethod.set(null);
    this._error.set(null);
    this.clearFromStorage();
  }

  /**
   * Clears plan, confirmation state and error while preserving the stored card.
   * Use this when starting a new plan selection from the billing panel so the
   * user goes straight to checkout if a card is already on file.
   */
  clearFlow(): void {
    this._selectedPlan.set(null);
    this._confirmed.set(false);
    this._error.set(null);
  }

  /**
   * Sends the payment intent to the gateway and, on success, activates the
   * subscription via {@link SubscriptionsStore}.
   *
   * @param userId - Numeric user ID used to create the intent.
   * @returns Promise resolving to `true` on success, `false` on failure.
   */
  async confirmPayment(userId: number): Promise<boolean> {
    const plan   = this._selectedPlan();
    const method = this._paymentMethod();
    if (!plan || !method) return false;

    this._processing.set(true);
    this._error.set(null);

    const intent = new PaymentIntent({
      id:        `pi_${Date.now()}`,
      userId:    String(userId),
      plan,
      amount:    PLAN_PRICES[plan],
      currency:  'USD',
      status:    'pending',
      createdAt: new Date().toISOString().slice(0, 10),
    });

    try {
      const result = await firstValueFrom(this.gateway.processPayment(intent, method));
      if (result.success) {
        intent.succeed();
        await this.subscriptionsStore.selectPlan(plan);
        this._confirmed.set(true);
        return true;
      }
      this._error.set(
        result.errorCode === 'card_declined'
          ? 'payment.error_card_declined'
          : 'payment.error_processing_failed',
      );
      return false;
    } catch {
      this._error.set('payment.error_processing_failed');
      return false;
    } finally {
      this._processing.set(false);
    }
  }

  /**
   * Clears all payment flow state including the stored card.
   * Call on logout or when the user fully abandons the subscription flow.
   */
  reset(): void {
    this._selectedPlan.set(null);
    this._paymentMethod.set(null);
    this._processing.set(false);
    this._confirmed.set(false);
    this._error.set(null);
    this.clearFromStorage();
  }
}
