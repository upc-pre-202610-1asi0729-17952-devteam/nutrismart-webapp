import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { MetabolicAdaptationLog } from '../domain/model/metabolic-adaptation-log.entity';
import { MetabolicAdaptationLogApiEndpoint } from './metabolic-adaptation-log-api-endpoint';

/**
 * Application-facing API façade for {@link MetabolicAdaptationLog} resources.
 *
 * Exposes domain-specific methods and hides the generic endpoint CRUD surface
 * from application services and stores.
 */
@Injectable({ providedIn: 'root' })
export class MetabolicAdaptationLogApi extends BaseApi {
  private endpoint: MetabolicAdaptationLogApiEndpoint;

  constructor() {
    super();
    const http = inject(HttpClient);
    this.endpoint = new MetabolicAdaptationLogApiEndpoint(http);
  }

  /**
   * Returns all adaptation logs for the given user, ordered by date descending.
   *
   * @param userId - Numeric identifier of the user.
   * @returns Observable emitting the log entries.
   */
  getByUserId(userId: number): Observable<MetabolicAdaptationLog[]> {
    return this.endpoint.getAll().pipe(
      map(logs =>
        logs
          .filter(l => l.userId === userId)
          .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()),
      ),
    );
  }

  /**
   * Persists a new adaptation log entry.
   *
   * @param log - The {@link MetabolicAdaptationLog} entity to persist.
   * @returns Observable emitting the created entity with its assigned id.
   */
  create(log: MetabolicAdaptationLog): Observable<MetabolicAdaptationLog> {
    return this.endpoint.create(log);
  }
}
