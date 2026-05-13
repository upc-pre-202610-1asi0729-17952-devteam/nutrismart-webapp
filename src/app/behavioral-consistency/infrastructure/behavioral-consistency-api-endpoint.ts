import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment.development';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { BehavioralProgress } from '../domain/model/behavioral-progress.entity';
import { BehavioralProgressAssembler } from './behavioral-progress-assembler';
import {
  BehavioralProgressResource,
  BehavioralProgressResponse,
} from './behavioral-progress-resource';

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
}
