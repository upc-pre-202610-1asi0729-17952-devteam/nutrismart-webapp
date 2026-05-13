import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { EatingBehaviorPattern } from '../domain/model/eating-behavior-pattern.entity';
import { EatingBehaviorPatternApiEndpoint } from './eating-behavior-pattern-api-endpoint';

/**
 * Application-facing API façade for {@link EatingBehaviorPattern} resources.
 *
 * Exposes domain-specific methods and hides the generic endpoint CRUD surface
 * from application services and stores.
 */
@Injectable({ providedIn: 'root' })
export class EatingBehaviorPatternApi extends BaseApi {
  private endpoint: EatingBehaviorPatternApiEndpoint;

  constructor() {
    super();
    const http = inject(HttpClient);
    this.endpoint = new EatingBehaviorPatternApiEndpoint(http);
  }

  /**
   * Fetches the latest behavior pattern record for a user.
   *
   * Returns `undefined` when the user has no pattern on record yet.
   *
   * @param userId - Numeric identifier of the user.
   * @returns Observable emitting the matching pattern or `undefined`.
   */
  getByUserId(userId: number): Observable<EatingBehaviorPattern | undefined> {
    return this.endpoint.getAll().pipe(
      map(patterns => patterns.find(p => p.userId === userId)),
    );
  }

  /**
   * Creates a new behavior pattern record.
   *
   * @param pattern - The {@link EatingBehaviorPattern} entity to persist.
   * @returns Observable emitting the created entity.
   */
  create(pattern: EatingBehaviorPattern): Observable<EatingBehaviorPattern> {
    return this.endpoint.create(pattern);
  }

  /**
   * Replaces an existing behavior pattern record.
   *
   * @param pattern - The updated {@link EatingBehaviorPattern} entity.
   * @returns Observable emitting the updated entity.
   */
  update(pattern: EatingBehaviorPattern): Observable<EatingBehaviorPattern> {
    return this.endpoint.update(pattern, pattern.id);
  }
}
