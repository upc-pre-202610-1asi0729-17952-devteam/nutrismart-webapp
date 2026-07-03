import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { PaymentGatewayPort, PaymentResult } from '../domain/ports/payment-gateway.port';
import { PaymentIntent } from '../domain/model/payment-intent.entity';
import { PaymentMethod } from '../domain/model/payment-method.value-object';

/** Wire shape returned by `POST /payments/charge`. */
interface ChargeResultResource {
  success: boolean;
  transactionId?: string;
  errorCode?: string;
  message?: string;
}

/**
 * Real payment gateway backed by Stripe.
 *
 * The card is tokenized in the browser with Stripe Elements and registered
 * against the backend (see {@link import('./payment-method-api').PaymentMethodApi}),
 * which yields a payment method id carried on the {@link PaymentMethod}. This
 * adapter then delegates the actual charge to the backend `POST /payments/charge`
 * endpoint, so the Stripe secret key never reaches the browser.
 *
 * Swap it for {@link import('./simulated-payment-gateway').SimulatedPaymentGateway}
 * via the `useClass` binding in `app.config.ts`.
 */
@Injectable()
export class StripePaymentGateway extends PaymentGatewayPort {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl + environment.paymentsEndpointPath;

  /**
   * Charges the registered payment method via the backend Stripe integration.
   *
   * @param intent - Describes the amount, currency, plan and user being charged.
   * @param method - The registered card; must carry a backend `id`.
   * @returns Observable emitting a single {@link PaymentResult}.
   */
  processPayment(intent: PaymentIntent, method: PaymentMethod): Observable<PaymentResult> {
    if (method.id == null) {
      // Card was not registered against the backend (e.g. restored from a
      // previous session without a fresh token). Force re-entry.
      return of<PaymentResult>({ success: false, errorCode: 'payment_method_not_registered' });
    }

    const body = {
      userId:          Number(intent.userId),
      plan:            intent.plan,
      paymentMethodId: method.id,
      amount:          intent.amount,
      currency:        intent.currency,
    };

    return this.http.post<ChargeResultResource>(`${this.baseUrl}/charge`, body).pipe(
      map(res => ({
        success:       res.success,
        transactionId: res.transactionId,
        errorCode:     res.success ? undefined : (res.errorCode ?? 'card_declined'),
      })),
      catchError(() => of<PaymentResult>({ success: false, errorCode: 'processing_failed' })),
    );
  }
}
