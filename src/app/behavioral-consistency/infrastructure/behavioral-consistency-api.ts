import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { BehavioralProgress } from '../domain/model/behavioral-progress.entity';
import { BehavioralConsistencyApiEndpoint } from './behavioral-consistency-api-endpoint';

/**
 * Application-facing API façade for the Behavioral Consistency bounded context.
 *
 * Wraps {@link BehavioralConsistencyApiEndpoint} to expose domain-specific
 * methods instead of leaking generic CRUD operations to presentation or
 * application services.
 */
@Injectable({ providedIn: 'root' })
export class BehavioralConsistencyApi extends BaseApi {
  /** Underlying HTTP endpoint that performs the actual requests. */
  private endpoint: BehavioralConsistencyApiEndpoint;

  /**
   * Creates the Behavioral Consistency API façade.
   */
  constructor() {
    super();
    const http = inject(HttpClient);
    this.endpoint = new BehavioralConsistencyApiEndpoint(http);
  }

  /**
   * Fetches all behavioral progress records.
   *
   * @returns Observable emitting an array of {@link BehavioralProgress} entities.
   */
  getBehavioralProgressList(): Observable<BehavioralProgress[]> {
    return this.endpoint.getAll();
  }

  /**
   * Fetches a single behavioral progress record by its numeric ID.
   *
   * @param id - The numeric identifier of the behavioral progress record.
   * @returns Observable emitting the matching {@link BehavioralProgress} entity.
   */
  getBehavioralProgress(id: number): Observable<BehavioralProgress> {
    return this.endpoint.getById(id);
  }

  /**
   * Fetches the behavioral progress record for a specific user.
   *
   * Since json-server returns a collection for `/behavioral-progress`,
   * this method filters the domain entities client-side.
   *
   * @param userId - The numeric identifier of the user.
   * @returns Observable emitting the first matching {@link BehavioralProgress}.
   */
  getBehavioralProgressByUserId(userId: number): Observable<BehavioralProgress | undefined> {
    return this.endpoint.getAll().pipe(
      map(progressList => progressList.find(progress => progress.userId === userId))
    );
  }

  /**
   * Creates a new behavioral progress record on the server.
   *
   * @param progress - The {@link BehavioralProgress} entity to persist.
   * @returns Observable emitting the created entity as returned by the server.
   */
  createBehavioralProgress(progress: BehavioralProgress): Observable<BehavioralProgress> {
    return this.endpoint.create(progress);
  }

  /**
   * Replaces an existing behavioral progress record with updated data.
   *
   * @param progress - The updated {@link BehavioralProgress} entity.
   * @returns Observable emitting the updated entity as returned by the server.
   */
  updateBehavioralProgress(progress: BehavioralProgress): Observable<BehavioralProgress> {
    return this.endpoint.update(progress, progress.id);
  }

  /**
   * Deletes a behavioral progress record.
   *
   * @param id - Numeric ID of the behavioral progress record to delete.
   * @returns Observable that completes when the deletion succeeds.
   */
  deleteBehavioralProgress(id: number): Observable<void> {
    return this.endpoint.delete(id);
  }
}
