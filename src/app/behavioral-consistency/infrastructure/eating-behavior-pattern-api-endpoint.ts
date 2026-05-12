import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment.development';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { EatingBehaviorPattern } from '../domain/model/eating-behavior-pattern.entity';
import { EatingBehaviorPatternAssembler } from './eating-behavior-pattern-assembler';
import {
  EatingBehaviorPatternResource,
  EatingBehaviorPatternResponse,
} from './eating-behavior-pattern-resource';

/**
 * HTTP endpoint for the `/eating-behavior-patterns` REST resource.
 */
export class EatingBehaviorPatternApiEndpoint extends BaseApiEndpoint<
  EatingBehaviorPattern,
  EatingBehaviorPatternResource,
  EatingBehaviorPatternResponse,
  EatingBehaviorPatternAssembler
> {
  /** @param http - Angular's {@link HttpClient} injected by the parent service. */
  constructor(http: HttpClient) {
    super(
      http,
      environment.apiBaseUrl + environment.eatingBehaviorPatternsEndpointPath,
      new EatingBehaviorPatternAssembler(),
    );
  }
}
