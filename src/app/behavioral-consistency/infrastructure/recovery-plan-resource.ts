import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';
import { RecoveryActionProps } from '../domain/model/recovery-action.value-object';

/** API resource DTO for a {@link RecoveryPlan} as returned by the REST endpoint. */
export interface RecoveryPlanResource extends BaseResource {
  id:          number;
  userId:      number | string;
  trigger:     string;
  status:      string;
  actions:     RecoveryActionProps[];
  activatedAt: string;
  resolvedAt:  string | null;
}

/** Envelope for the `/recovery-plans` collection endpoint. */
export interface RecoveryPlanResponse extends BaseResponse {
  recoveryPlans: RecoveryPlanResource[];
}
