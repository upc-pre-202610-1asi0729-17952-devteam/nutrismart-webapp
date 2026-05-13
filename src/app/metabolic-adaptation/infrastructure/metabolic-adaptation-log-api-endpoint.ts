import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment.development';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { MetabolicAdaptationLog } from '../domain/model/metabolic-adaptation-log.entity';
import { MetabolicAdaptationLogAssembler } from './metabolic-adaptation-log-assembler';
import { MetabolicAdaptationLogResource, MetabolicAdaptationLogResponse } from './metabolic-adaptation-log-resource';

/**
 * HTTP endpoint for the `/metabolic-adaptation-logs` REST resource.
 */
export class MetabolicAdaptationLogApiEndpoint extends BaseApiEndpoint<
  MetabolicAdaptationLog,
  MetabolicAdaptationLogResource,
  MetabolicAdaptationLogResponse,
  MetabolicAdaptationLogAssembler
> {
  /** @param http - Angular's {@link HttpClient} injected by the parent service. */
  constructor(http: HttpClient) {
    super(
      http,
      environment.apiBaseUrl + environment.metabolicAdaptationLogsEndpointPath,
      new MetabolicAdaptationLogAssembler(),
    );
  }
}
