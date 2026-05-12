import { SubscriptionPlan } from '../../iam/domain/model/subscription-plan.enum';
import { Subscription, SubscriptionStatus } from '../domain/model/subscription.entity';
import { SubscriptionResource } from './subscription-resource';

/** Maps API status strings to the domain {@link SubscriptionStatus} union. */
const STATUS_MAP: Record<string, SubscriptionStatus> = {
  ACTIVE: 'active',
  active: 'active',
  CANCELLED: 'cancelled',
  cancelled: 'cancelled',
  EXPIRED: 'expired',
  expired: 'expired',
};

/**
 * Bidirectional mapper between {@link Subscription} domain entities and
 * the {@link SubscriptionResource} wire format used by the REST API.
 */
export class SubscriptionAssembler {
  /**
   * Converts a raw API resource into a {@link Subscription} domain entity.
   *
   * @param resource - Raw object as received from the API.
   * @returns The corresponding domain entity.
   */
  toEntityFromResource(resource: SubscriptionResource): Subscription {
    return new Subscription({
      id:        Number(resource.id),
      userId:    Number(resource.userId),
      plan:      resource.plan as SubscriptionPlan,
      status:    STATUS_MAP[resource.status] ?? 'expired',
      startDate: resource.startDate,
      endDate:   resource.nextRenewal,
    });
  }

  /**
   * Serialises a {@link Subscription} domain entity to a {@link SubscriptionResource}
   * suitable for POST / PUT request bodies.
   *
   * @param entity - The domain entity to serialise.
   * @returns The API resource representation.
   */
  toResourceFromEntity(entity: Subscription): SubscriptionResource {
    const STATUS_REVERSE: Record<SubscriptionStatus, string> = {
      active:    'ACTIVE',
      cancelled: 'CANCELLED',
      expired:   'EXPIRED',
    };
    return {
      id:          String(entity.id),
      userId:      String(entity.userId),
      plan:        entity.plan,
      status:      STATUS_REVERSE[entity.status],
      startDate:   entity.startDate,
      nextRenewal: entity.endDate,
    };
  }
}
