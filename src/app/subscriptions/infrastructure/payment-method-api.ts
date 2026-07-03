import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { PaymentMethod } from '../domain/model/payment-method.value-object';
import { PaymentMethodResource, RegisterPaymentMethodResource } from './payment-method-resource';

/**
 * HTTP façade for the `/payment-methods` REST resource.
 *
 * Registers Stripe-tokenized cards (pm_xxx + safe metadata) against the backend,
 * which stores them and returns the server-assigned id used later to charge.
 *
 * Provided in root so a single instance is shared across the application.
 */
@Injectable({ providedIn: 'root' })
export class PaymentMethodApi {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl + environment.paymentMethodsEndpointPath;

  /** Maps a wire resource to the {@link PaymentMethod} value object. */
  private toValueObject(r: PaymentMethodResource): PaymentMethod {
    return new PaymentMethod({
      holderName:            r.cardholderName,
      last4:                 r.lastFour,
      brand:                 r.brand,
      expiryMonth:           String(r.expiryMonth).padStart(2, '0'),
      expiryYear:            String(r.expiryYear).slice(-2),
      id:                    r.id,
      stripePaymentMethodId: r.stripePaymentMethodId,
    });
  }

  /**
   * Registers a Stripe-tokenized payment method and returns the stored card.
   *
   * @param resource - Card metadata plus the Stripe `stripePaymentMethodId`.
   * @returns Observable emitting the registered {@link PaymentMethod} (with backend id).
   */
  register(resource: RegisterPaymentMethodResource): Observable<PaymentMethod> {
    return this.http
      .post<PaymentMethodResource>(this.baseUrl, resource)
      .pipe(map(r => this.toValueObject(r)));
  }

  /**
   * Fetches all payment methods registered for a user.
   *
   * @param userId - Numeric user id.
   * @returns Observable emitting the user's {@link PaymentMethod} list.
   */
  getByUser(userId: number): Observable<PaymentMethod[]> {
    return this.http
      .get<PaymentMethodResource[]>(`${this.baseUrl}?userId=${userId}`)
      .pipe(map(list => list.map(r => this.toValueObject(r))));
  }

  /**
   * Deletes a payment method by id.
   *
   * @param id - Backend payment method id.
   * @returns Observable that completes on success.
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
