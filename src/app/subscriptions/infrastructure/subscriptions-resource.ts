import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';
import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { SubscriptionPlan } from '../../iam/domain/model/subscription-plan.enum';
import { Subscription } from '../domain/model/subscription.entity';
import { BillingRecord } from '../domain/model/billing-record.entity';

// ─── Resources ───────────────────────────────────────────────────────────────

export interface SubscriptionResource extends BaseResource {
  id: number;
  userId: number;
  plan: string;
  status: 'ACTIVE' | 'CANCELLED' | 'TRIAL';
  nextRenewal: string;
  pricePerMonth: number;
  startDate: string;
}

export interface SubscriptionsResponse extends BaseResponse {
  subscriptions: SubscriptionResource[];
}

export interface BillingRecordResource extends BaseResource {
  id: number;
  userId: number;
  date: string;
  plan: string;
  amount: number;
  currency: string;
  status: 'PAID' | 'TRIAL' | 'FAILED' | 'REFUNDED';
}

export interface BillingRecordsResponse extends BaseResponse {
  records: BillingRecordResource[];
}

// ─── Assemblers ──────────────────────────────────────────────────────────────

/**
 * Maps between {@link Subscription} entities and API resources.
 *
 * @author Mora Rivera, Joel Fernando
 */
export class SubscriptionAssembler
  implements BaseAssembler<Subscription, SubscriptionResource, SubscriptionsResponse> {

  toEntityFromResource(r: SubscriptionResource): Subscription {
    return new Subscription({
      id:            r.id,
      userId:        r.userId,
      plan:          r.plan as SubscriptionPlan,
      status:        r.status,
      nextRenewal:   r.nextRenewal,
      pricePerMonth: r.pricePerMonth,
      startDate:     r.startDate,
    });
  }

  toResourceFromEntity(e: Subscription): SubscriptionResource {
    return {
      id:            e.id,
      userId:        e.userId,
      plan:          e.plan,
      status:        e.status,
      nextRenewal:   e.nextRenewal,
      pricePerMonth: e.pricePerMonth,
      startDate:     e.startDate,
    };
  }

  toEntitiesFromResponse(r: SubscriptionsResponse): Subscription[] {
    return r.subscriptions.map(s => this.toEntityFromResource(s));
  }
}

/**
 * Maps between {@link BillingRecord} entities and API resources.
 *
 * @author Mora Rivera, Joel Fernando
 */
export class BillingRecordAssembler
  implements BaseAssembler<BillingRecord, BillingRecordResource, BillingRecordsResponse> {

  toEntityFromResource(r: BillingRecordResource): BillingRecord {
    return new BillingRecord({
      id:       r.id,
      userId:   r.userId,
      date:     r.date,
      plan:     r.plan as SubscriptionPlan,
      amount:   r.amount,
      currency: r.currency,
      status:   r.status,
    });
  }

  toResourceFromEntity(e: BillingRecord): BillingRecordResource {
    return {
      id:       e.id,
      userId:   e.userId,
      date:     e.date,
      plan:     e.plan,
      amount:   e.amount,
      currency: e.currency,
      status:   e.status,
    };
  }

  toEntitiesFromResponse(r: BillingRecordsResponse): BillingRecord[] {
    return r.records.map(rec => this.toEntityFromResource(rec));
  }
}
