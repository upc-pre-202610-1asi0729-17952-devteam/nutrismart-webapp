import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment.development';
import { Subscription } from '../domain/model/subscription.entity';
import { SubscriptionAssembler } from './subscription-assembler';
import { SubscriptionResource } from './subscription-resource';

const assembler = new SubscriptionAssembler();

/**
 * HTTP façade for the `/subscriptions` REST resource.
 *
 * All network errors are propagated as observable errors; error handling
 * lives in the store, not here.
 *
 * Provided in root so a single instance is shared across the application.
 */
@Injectable({ providedIn: 'root' })
export class SubscriptionApi {
  private readonly http     = inject(HttpClient);
  private readonly baseUrl  = environment.apiBaseUrl + environment.subscriptionsEndpointPath;

  /**
   * Fetches the subscription for a given user, or null if none exists.
   *
   * @param userId - Numeric user ID as a string for query-param compatibility.
   * @returns Observable emitting a {@link Subscription} entity or null.
   */
  getSubscription(userId: string): Observable<Subscription | null> {
    return this.http
      .get<SubscriptionResource[]>(`${this.baseUrl}?userId=${userId}`)
      .pipe(
        map(resources => resources.length > 0 ? assembler.toEntityFromResource(resources[0]) : null),
        catchError(() => of(null)),
      );
  }

  /**
   * Creates a new subscription record on the server.
   *
   * @param subscription - The {@link Subscription} entity to persist.
   * @returns Observable emitting the created entity.
   */
  createSubscription(subscription: Subscription): Observable<Subscription> {
    const { id, ...body } = assembler.toResourceFromEntity(subscription) as Record<string, unknown>;
    void id;
    return this.http
      .post<SubscriptionResource>(this.baseUrl, body)
      .pipe(map(r => assembler.toEntityFromResource(r)));
  }

  /**
   * Updates an existing subscription record on the server.
   *
   * @param subscription - The updated {@link Subscription} entity.
   * @returns Observable emitting the updated entity.
   */
  updateSubscription(subscription: Subscription): Observable<Subscription> {
    return this.http
      .put<SubscriptionResource>(`${this.baseUrl}/${subscription.id}`, assembler.toResourceFromEntity(subscription))
      .pipe(map(r => assembler.toEntityFromResource(r)));
  }
}
