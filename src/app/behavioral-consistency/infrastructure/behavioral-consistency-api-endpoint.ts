import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment.development';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { BehavioralProgress } from '../domain/model/behavioral-progress.entity';
import { BehavioralProgressAssembler } from './behavioral-progress-assembler';
import {
  BehavioralProgressResource,
  BehavioralProgressResponse,
} from './behavioral-progress-resource';
import { localIsoDate } from '../../shared/domain/local-date.util';

/**
 * HTTP endpoint for the Behavioral Consistency `/behavioral-progress` REST resource.
 *
 * Extends {@link BaseApiEndpoint} to inherit generic CRUD operations
 * using the {@link BehavioralProgressAssembler} for entity-resource conversion.
 */
export class BehavioralConsistencyApiEndpoint extends BaseApiEndpoint<
  BehavioralProgress,
  BehavioralProgressResource,
  BehavioralProgressResponse,
  BehavioralProgressAssembler
> {
  /**
   * @param http - Angular's {@link HttpClient} injected by the parent service.
   */
  constructor(http: HttpClient) {
    super(
      http,
      environment.apiBaseUrl + environment.behavioralProgressEndpointPath,
      new BehavioralProgressAssembler()
    );
  }

  /**
   * Sends only the fields the backend accepts for PUT /behavioral-progress/{id}.
   *
   * weeklyCompletionRate is converted from the entity's 0–100 scale to 0.0–1.0.
   */
  override update(entity: BehavioralProgress, id: number, goalMetToday = false): Observable<BehavioralProgress> {
    const rawDate = entity.lastGoalMetDate;
    const lastEvaluatedAt = rawDate
      ? (rawDate.length === 10 ? rawDate + 'T00:00:00Z' : rawDate)
      : null;
    const body = {
      adherenceStatus:      entity.adherenceStatus,
      streak:               entity.streak,
      consecutiveMisses:    entity.consecutiveMisses,
      weeklyCompletionRate: parseFloat((entity.weeklyCompletionRate / 100).toFixed(2)),
      lastEvaluatedAt,
      goalMetDates:         goalMetToday ? [localIsoDate()] : null,
      goalMetToday:         false,
    };
    return this.http
      .put<BehavioralProgressResource>(`${this.endpointUrl}/${id}`, body)
      .pipe(
        map(updated => this.assembler.toEntityFromResource(updated)),
        catchError(this.handleError('Failed to update behavioral progress')),
      );
  }
}
