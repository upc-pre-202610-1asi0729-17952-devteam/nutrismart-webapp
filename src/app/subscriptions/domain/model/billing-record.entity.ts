import { SubscriptionPlan } from '../../../iam/domain/model/subscription-plan.enum';

export type BillingStatus = 'PAID' | 'TRIAL' | 'FAILED';

export interface BillingRecordProps {
  id: string;
  userId: string;
  date: string;
  plan: SubscriptionPlan;
  amount: number;
  currency: string;
  status: BillingStatus;
}

/**
 * Immutable record of a completed billing cycle or charge.
 *
 * Maps directly to the `billing-history` REST collection.
 */
export class BillingRecord {
  readonly id: string;
  readonly userId: string;
  readonly date: string;
  readonly plan: SubscriptionPlan;
  readonly amount: number;
  readonly currency: string;
  readonly status: BillingStatus;

  constructor(props: BillingRecordProps) {
    this.id       = props.id;
    this.userId   = props.userId;
    this.date     = props.date;
    this.plan     = props.plan;
    this.amount   = props.amount;
    this.currency = props.currency;
    this.status   = props.status;
  }

  /** Returns true when this record represents a successful charge. */
  isPaid(): boolean {
    return this.status === 'PAID';
  }

  /** Returns true when this record represents a free trial period. */
  isTrial(): boolean {
    return this.status === 'TRIAL';
  }
}
