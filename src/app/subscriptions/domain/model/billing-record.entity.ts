import { BaseEntity } from '../../../shared/infrastructure/base-entity';
import { SubscriptionPlan } from '../../../iam/domain/model/subscription-plan.enum';

/**
 * Constructor DTO for creating a {@link BillingRecord} instance.
 *
 * @author Mora Rivera, Joel Fernando
 */
export interface BillingRecordProps {
  id: number;
  userId: number;
  date: string;
  plan: SubscriptionPlan;
  amount: number;
  currency: string;
  status: 'PAID' | 'TRIAL' | 'FAILED' | 'REFUNDED';
}

/**
 * Domain entity representing a single billing history record.
 *
 * Non-anemic: exposes display helpers for rendering the payment history table.
 *
 * @author Mora Rivera, Joel Fernando
 */
export class BillingRecord implements BaseEntity {
  private _id:       number;
  private _userId:   number;
  private _date:     string;
  private _plan:     SubscriptionPlan;
  private _amount:   number;
  private _currency: string;
  private _status:   'PAID' | 'TRIAL' | 'FAILED' | 'REFUNDED';

  constructor(props: BillingRecordProps) {
    this._id       = props.id;
    this._userId   = props.userId;
    this._date     = props.date;
    this._plan     = props.plan;
    this._amount   = props.amount;
    this._currency = props.currency;
    this._status   = props.status;
  }

  // ─── Getters & Setters ───────────────────────────────────────────────────

  get id(): number { return this._id; }
  set id(v: number) { this._id = v; }

  get userId(): number { return this._userId; }
  set userId(v: number) { this._userId = v; }

  get date(): string { return this._date; }
  set date(v: string) { this._date = v; }

  get plan(): SubscriptionPlan { return this._plan; }
  set plan(v: SubscriptionPlan) { this._plan = v; }

  get amount(): number { return this._amount; }
  set amount(v: number) { this._amount = v; }

  get currency(): string { return this._currency; }
  set currency(v: string) { this._currency = v; }

  get status(): 'PAID' | 'TRIAL' | 'FAILED' | 'REFUNDED' { return this._status; }
  set status(v: 'PAID' | 'TRIAL' | 'FAILED' | 'REFUNDED') { this._status = v; }

  // ─── Domain Behaviour ─────────────────────────────────────────────────────

  /** Formatted date string for table display. */
  get formattedDate(): string {
    return new Date(this._date).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  /** Formatted amount with currency symbol. */
  get formattedAmount(): string {
    return `${this._currency}/ ${this._amount.toFixed(2)}`;
  }

  /** Plan label for display (e.g. "Pro", "Pro (trial)"). */
  get planLabel(): string {
    const base = this._plan.charAt(0) + this._plan.slice(1).toLowerCase();
    return this._status === 'TRIAL' ? `${base} (trial)` : base;
  }

  /** Whether this record represents a zero-cost trial. */
  get isTrial(): boolean {
    return this._status === 'TRIAL';
  }
}
