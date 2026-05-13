import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment.development';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { RecoveryPlan } from '../domain/model/recovery-plan.entity';
import { RecoveryPlanAssembler } from './recovery-plan-assembler';
import { RecoveryPlanResource, RecoveryPlanResponse } from './recovery-plan-resource';

/**
 * HTTP endpoint for the `/recovery-plans` REST resource.
 */
export class RecoveryPlanApiEndpoint extends BaseApiEndpoint<
  RecoveryPlan,
  RecoveryPlanResource,
  RecoveryPlanResponse,
  RecoveryPlanAssembler
> {
  /** @param http - Angular's {@link HttpClient} injected by the parent service. */
  constructor(http: HttpClient) {
    super(
      http,
      environment.apiBaseUrl + environment.recoveryPlansEndpointPath,
      new RecoveryPlanAssembler(),
    );
  }
}
