/**
 * Represents an immutable payment card used to process a subscription charge.
 *
 * Stores only safe, displayable card metadata — never the raw PAN.
 * When migrating to Stripe, map the Stripe `PaymentMethod` object to this class.
 */
export class PaymentMethod {
  readonly holderName: string;
  readonly last4: string;
  readonly brand: string;
  readonly expiryMonth: string;
  readonly expiryYear: string;

  constructor(props: {
    holderName: string;
    last4: string;
    brand: string;
    expiryMonth: string;
    expiryYear: string;
  }) {
    this.holderName  = props.holderName;
    this.last4       = props.last4;
    this.brand       = props.brand;
    this.expiryMonth = props.expiryMonth;
    this.expiryYear  = props.expiryYear;
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
