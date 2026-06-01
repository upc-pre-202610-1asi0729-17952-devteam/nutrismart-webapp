import { Injectable } from '@angular/core';
import { delay, Observable, of } from 'rxjs';
import { PaymentGatewayPort, PaymentResult } from '../domain/ports/payment-gateway.port';
import { PaymentIntent } from '../domain/model/payment-intent.entity';
import { PaymentMethod } from '../domain/model/payment-method.value-object';

/**
 * Simulated payment gateway for development and testing.
 *
 * Introduces a realistic 1 500 ms delay to mimic network latency.
 * Cards ending in `0000` are declined; all others succeed.
 *
 * Replace this class with `StripePaymentGateway` when integrating Stripe:
 * change the `useClass` binding in `app.config.ts` — no other code changes needed.
 */
@Injectable()
export class SimulatedPaymentGateway extends PaymentGatewayPort {
  /**
   * Processes a payment intent against the simulated gateway.
   *
   * @param intent - The intent describing the charge.
   * @param method - The card to charge.
   * @returns Observable emitting a {@link PaymentResult} after a simulated delay.
   */
  processPayment(intent: PaymentIntent, method: PaymentMethod): Observable<PaymentResult> {
    const declined = method.last4 === '0000';
    const result: PaymentResult = declined
      ? { success: false, errorCode: 'card_declined' }
      : { success: true, transactionId: `sim_${intent.id}_${Date.now()}` };
    return of(result).pipe(delay(1500));
  }
}
