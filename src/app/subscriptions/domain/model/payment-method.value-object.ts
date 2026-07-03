/**
 * Represents an immutable payment card used to process a subscription charge.
 *
 * Stores only safe, displayable card metadata — never the raw PAN.
 * When registered against the backend (Stripe flow) it also carries the
 * server-assigned `id` and the Stripe `stripePaymentMethodId` (pm_xxx) so the
 * gateway can charge it. In the simulated flow both are undefined.
 */
export class PaymentMethod {
  readonly holderName: string;
  readonly last4: string;
  readonly brand: string;
  readonly expiryMonth: string;
  readonly expiryYear: string;
  /** Backend-assigned payment method id (present once registered). */
  readonly id?: number;
  /** Stripe payment method token (pm_xxx), present in the Stripe flow. */
  readonly stripePaymentMethodId?: string;

  constructor(props: {
    holderName: string;
    last4: string;
    brand: string;
    expiryMonth: string;
    expiryYear: string;
    id?: number;
    stripePaymentMethodId?: string;
  }) {
    this.holderName            = props.holderName;
    this.last4                 = props.last4;
    this.brand                 = props.brand;
    this.expiryMonth           = props.expiryMonth;
    this.expiryYear            = props.expiryYear;
    this.id                    = props.id;
    this.stripePaymentMethodId = props.stripePaymentMethodId;
  }

  /** Returns a masked card number string for display purposes. */
  get maskedNumber(): string {
    return `•••• •••• •••• ${this.last4}`;
  }

  /** Returns expiry in MM/YY format. */
  get expiryLabel(): string {
    return `${this.expiryMonth}/${this.expiryYear}`;
  }
}
