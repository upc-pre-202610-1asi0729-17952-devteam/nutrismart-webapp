import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

/** API resource DTO for a {@link MetabolicAdaptationLog} as returned by the REST endpoint. */
export interface MetabolicAdaptationLogResource extends BaseResource {
  id:               number;
  userId:           number | string;
  triggeredBy:      string;
  previousCalories: number;
  newCalories:      number;
  previousProtein:  number;
  newProtein:       number;
  previousCarbs:    number;
  newCarbs:         number;
  previousFat:      number;
  newFat:           number;
  changedAt:        string;
}

/** Envelope for the `/metabolic-adaptation-logs` collection endpoint. */
export interface MetabolicAdaptationLogResponse extends BaseResponse {
  metabolicAdaptationLogs: MetabolicAdaptationLogResource[];
}
