import { SubscriptionPlan } from '../../iam/domain/model/subscription-plan.enum';
import { BillingRecord, BillingStatus } from '../domain/model/billing-record.entity';
import { BillingHistoryResource } from './billing-history-resource';

/** Maps API status strings to the domain {@link BillingStatus} union. */
const STATUS_MAP: Record<string, BillingStatus> = {
  PAID:   'PAID',
  Paid:   'PAID',
  TRIAL:  'TRIAL',
  Trial:  'TRIAL',
  FAILED: 'FAILED',
  Failed: 'FAILED',
};

/**
 * Bidirectional mapper between {@link BillingRecord} domain entities and
 * the {@link BillingHistoryResource} wire format used by the REST API.
 */
export class BillingHistoryAssembler {
  /**
   * Converts a raw API resource into a {@link BillingRecord} domain entity.
   *
   * @param resource - Raw object as received from the API.
   * @returns The corresponding domain entity.
   */
  toEntityFromResource(resource: BillingHistoryResource): BillingRecord {
    return new BillingRecord({
      id:       String(resource.id),
      userId:   String(resource.userId),
      date:     resource.date,
      plan:     resource.plan as SubscriptionPlan,
      amount:   resource.amount,
      currency: resource.currency,
      status:   STATUS_MAP[resource.status] ?? 'PAID',
    });
  }
}
