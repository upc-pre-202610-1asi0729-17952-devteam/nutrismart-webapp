import { BaseEntity } from '../../../shared/infrastructure/base-entity';
import { SubscriptionPlan } from '../../../iam/domain/model/subscription-plan.enum';

/**
 * Constructor DTO for creating a {@link Subscription} instance.
 *
 * @author Mora Rivera, Joel Fernando
 */
export interface SubscriptionProps {
  id: number;
  userId: number;
  plan: SubscriptionPlan;
  status: 'ACTIVE' | 'CANCELLED' | 'TRIAL';
  nextRenewal: string;
  pricePerMonth: number;
  startDate: string;
}

/**
 * Domain entity representing the user's active subscription plan.
 *
 * Non-anemic: exposes business behaviour such as plan tier checks,
 * upgrade/downgrade validation, and display helpers.
 *
 * @author Mora Rivera, Joel Fernando
 */
export class Subscription implements BaseEntity {
  private _id:            number;
  private _userId:        number;
  private _plan:          SubscriptionPlan;
  private _status:        'ACTIVE' | 'CANCELLED' | 'TRIAL';
  private _nextRenewal:   string;
  private _pricePerMonth: number;
  private _startDate:     string;

  constructor(props: SubscriptionProps) {
    this._id            = props.id;
    this._userId        = props.userId;
    this._plan          = props.plan;
    this._status        = props.status;
    this._nextRenewal   = props.nextRenewal;
    this._pricePerMonth = props.pricePerMonth;
    this._startDate     = props.startDate;
  }

  // ─── Getters & Setters ───────────────────────────────────────────────────

  get id(): number { return this._id; }
  set id(v: number) { this._id = v; }

  get userId(): number { return this._userId; }
  set userId(v: number) { this._userId = v; }

  get plan(): SubscriptionPlan { return this._plan; }
  set plan(v: SubscriptionPlan) { this._plan = v; }

  get status(): 'ACTIVE' | 'CANCELLED' | 'TRIAL' { return this._status; }
  set status(v: 'ACTIVE' | 'CANCELLED' | 'TRIAL') { this._status = v; }

  get nextRenewal(): string { return this._nextRenewal; }
  set nextRenewal(v: string) { this._nextRenewal = v; }

  get pricePerMonth(): number { return this._pricePerMonth; }
  set pricePerMonth(v: number) { this._pricePerMonth = v; }

  get startDate(): string { return this._startDate; }
  set startDate(v: string) { this._startDate = v; }

  // ─── Domain Behaviour ─────────────────────────────────────────────────────

  /** Human-readable plan name. */
  get planLabel(): string {
    return this._plan.charAt(0) + this._plan.slice(1).toLowerCase();
  }

  /** Whether the user can upgrade to a higher tier. */
  canUpgradeTo(target: SubscriptionPlan): boolean {
    const order = [SubscriptionPlan.BASIC, SubscriptionPlan.PRO, SubscriptionPlan.PREMIUM];
    return order.indexOf(target) > order.indexOf(this._plan);
  }

  /** Whether the user can downgrade to a lower tier. */
  canDowngradeTo(target: SubscriptionPlan): boolean {
    const order = [SubscriptionPlan.BASIC, SubscriptionPlan.PRO, SubscriptionPlan.PREMIUM];
    return order.indexOf(target) < order.indexOf(this._plan);
  }

  /** Whether this is the user's current plan. */
  isCurrent(plan: SubscriptionPlan): boolean {
    return this._plan === plan;
  }

  /** Formatted next renewal date. */
  get formattedRenewal(): string {
    return new Date(this._nextRenewal).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  }
}
