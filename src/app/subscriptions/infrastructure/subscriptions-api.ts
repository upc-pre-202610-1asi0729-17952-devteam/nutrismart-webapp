import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { environment } from '../../../environments/environment.development';
import { Subscription } from '../domain/model/subscription.entity';
import { BillingRecord } from '../domain/model/billing-record.entity';
import { SubscriptionPlan } from '../../iam/domain/model/subscription-plan.enum';
import {
  SubscriptionResource, SubscriptionsResponse, SubscriptionAssembler,
  BillingRecordResource, BillingRecordsResponse, BillingRecordAssembler,
} from './subscriptions-resource';

/**
 * HTTP endpoint for the `/subscriptions` REST resource.
 *
 * @author Mora Rivera, Joel Fernando
 */
class SubscriptionsEndpoint extends BaseApiEndpoint<
  Subscription, SubscriptionResource, SubscriptionsResponse, SubscriptionAssembler
> {
  constructor(http: HttpClient) {
    super(http, environment.apiBaseUrl + environment.subscriptionsEndpointPath, new SubscriptionAssembler());
  }
}

/**
 * HTTP endpoint for the `/billing-history` REST resource.
 *
 * @author Mora Rivera, Joel Fernando
 */
class BillingHistoryEndpoint extends BaseApiEndpoint<
  BillingRecord, BillingRecordResource, BillingRecordsResponse, BillingRecordAssembler
> {
  constructor(http: HttpClient) {
    super(http, environment.apiBaseUrl + environment.billingHistoryEndpointPath, new BillingRecordAssembler());
  }
}

/**
 * Application-facing API façade for the Subscriptions bounded context.
 *
 * Exposes domain-specific methods for plan management and billing history.
 * Provided in root so a single instance is shared.
 *
 * @author Mora Rivera, Joel Fernando
 */
@Injectable({ providedIn: 'root' })
export class SubscriptionsApi extends BaseApi {
  private subsEndpoint:    SubscriptionsEndpoint;
  private billingEndpoint: BillingHistoryEndpoint;

  constructor() {
    super();
    const http = inject(HttpClient);
    this.subsEndpoint    = new SubscriptionsEndpoint(http);
    this.billingEndpoint = new BillingHistoryEndpoint(http);
  }

  /** Fetches the active subscription plan for the current user. */
  getActivePlan(): Observable<Subscription[]> {
    return this.subsEndpoint.getAll();
  }

  /** Upgrades the plan (updates subscription record). */
  upgradePlan(subscription: Subscription, newPlan: SubscriptionPlan): Observable<Subscription> {
    subscription.plan = newPlan;
    subscription.status = 'ACTIVE';
    subscription.pricePerMonth = newPlan === SubscriptionPlan.PRO ? 14.99 : 19.99;
    return this.subsEndpoint.update(subscription, subscription.id);
  }

  /** Downgrades the plan (updates subscription record). */
  downgradePlan(subscription: Subscription, newPlan: SubscriptionPlan): Observable<Subscription> {
    subscription.plan = newPlan;
    subscription.status = 'ACTIVE';
    subscription.pricePerMonth = newPlan === SubscriptionPlan.BASIC ? 9.99 : 14.99;
    return this.subsEndpoint.update(subscription, subscription.id);
  }

  /** Cancels the active subscription. */
  cancelPlan(subscription: Subscription): Observable<Subscription> {
    subscription.status = 'CANCELLED';
    return this.subsEndpoint.update(subscription, subscription.id);
  }

  /** Fetches billing history for the current user. */
  getBillingHistory(): Observable<BillingRecord[]> {
    return this.billingEndpoint.getAll();
  }

  /** Mock: returns a fake PDF URL for a billing record. */
  downloadReceipt(id: number): string {
    return `${environment.apiBaseUrl}/billing-history/${id}/receipt.pdf`;
  }
}
