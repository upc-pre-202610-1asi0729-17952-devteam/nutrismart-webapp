import { Observable } from 'rxjs';
import { PaymentMethod } from '../model/payment-method.value-object';
import { PaymentIntent } from '../model/payment-intent.entity';

/** Outcome of a payment processing attempt. */
export interface PaymentResult {
  /** Whether the charge was accepted. */
  success: boolean;
  /** Gateway-assigned transaction identifier on success. */
  transactionId?: string;
  /** Machine-readable error code on failure (e.g. `card_declined`). */
  errorCode?: string;
}

/**
 * Abstract port for payment processing.
 *
 * Implement this class in the infrastructure layer to swap between
 * simulated payments (development) and Stripe (production) without
 * touching application or domain code.
 *
 * @example
 * // Stripe adapter (future)
 * class StripePaymentGateway extends PaymentGatewayPort {
 *   processPayment(intent, method): Observable<PaymentResult> { ... }
 * }
 */
export abstract class PaymentGatewayPort {
  /**
   * Attempts to charge the given payment method for the intent's amount.
   *
   * @param intent - The payment intent describing what is being charged.
   * @param method - The card or payment method to charge.
   * @returns Observable emitting a single {@link PaymentResult}.
   */
  abstract processPayment(
    intent: PaymentIntent,
    method: PaymentMethod,
  ): Observable<PaymentResult>;
}
