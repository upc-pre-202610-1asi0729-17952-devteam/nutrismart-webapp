import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { RecoveryPlan } from '../domain/model/recovery-plan.entity';
import { RecoveryPlanApiEndpoint } from './recovery-plan-api-endpoint';

/**
 * Application-facing API façade for {@link RecoveryPlan} resources.
 *
 * Exposes domain-specific methods and hides the generic endpoint CRUD surface
 * from application services and stores.
 */
@Injectable({ providedIn: 'root' })
export class RecoveryPlanApi extends BaseApi {
  private endpoint: RecoveryPlanApiEndpoint;

  constructor() {
    super();
    const http = inject(HttpClient);
    this.endpoint = new RecoveryPlanApiEndpoint(http);
  }

  /**
   * Fetches the currently active recovery plan for a user, if any.
   *
   * @param userId - Numeric identifier of the user.
   * @returns Observable emitting the active plan or `undefined`.
   */
  getActiveByUserId(userId: number): Observable<RecoveryPlan | undefined> {
    return this.endpoint.getAll().pipe(
      map(plans => plans.find(p => p.userId === userId && p.isActive())),
    );
  }

  /**
   * Creates a new recovery plan record.
   *
   * @param plan - The {@link RecoveryPlan} entity to persist.
   * @returns Observable emitting the created entity.
   */
  create(plan: RecoveryPlan): Observable<RecoveryPlan> {
    return this.endpoint.create(plan);
  }

  /**
   * Replaces an existing recovery plan record.
   *
   * @param plan - The updated {@link RecoveryPlan} entity.
   * @returns Observable emitting the updated entity.
   */
  update(plan: RecoveryPlan): Observable<RecoveryPlan> {
    return this.endpoint.update(plan, plan.id);
  }
}
