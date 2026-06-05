import { SubscriptionPlan } from '../../../iam/domain/model/subscription-plan.enum';

export type PaymentIntentStatus = 'pending' | 'succeeded' | 'failed';

export interface PaymentIntentProps {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  amount: number;
  currency: string;
  status: PaymentIntentStatus;
  createdAt: string;
}

/**
 * Represents an in-flight payment request for a subscription tier.
 *
 * Designed to map 1-to-1 to a Stripe `PaymentIntent` when integrated.
 * In simulation mode the gateway creates and resolves intents in memory.
 */
export class PaymentIntent {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  amount: number;
  currency: string;
  status: PaymentIntentStatus;
  createdAt: string;

  constructor(props: PaymentIntentProps) {
    this.id        = props.id;
    this.userId    = props.userId;
    this.plan      = props.plan;
    this.amount    = props.amount;
    this.currency  = props.currency;
    this.status    = props.status;
    this.createdAt = props.createdAt;
  }

  /** Marks the intent as successfully charged. */
  succeed(): void {
    this.status = 'succeeded';
  }

  /** Marks the intent as failed. */
  fail(): void {
    this.status = 'failed';
  }

  /** Returns true when the payment was successfully processed. */
  isSucceeded(): boolean {
    return this.status === 'succeeded';
  }
}
