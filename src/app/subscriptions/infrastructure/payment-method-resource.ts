/** Wire shape returned by the `/payment-methods` REST resource. */
export interface PaymentMethodResource {
  id: number;
  userId: number;
  lastFour: string;
  brand: string;
  expiryMonth: number;
  expiryYear: number;
  cardholderName: string;
  stripePaymentMethodId: string;
  createdAt: string;
}

/** Payload to register a new payment method (id assigned by the server). */
export interface RegisterPaymentMethodResource {
  userId: number;
  lastFour: string;
  brand: string;
  expiryMonth: number;
  expiryYear: number;
  cardholderName: string;
  stripePaymentMethodId: string;
}
