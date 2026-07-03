import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export interface WearableConnectionResource extends BaseResource {
  userId: number | string;
  provider: string;
  status: string;
  lastSyncedAt: string;
  authorizedAt: string;
  autoSyncEnabled: boolean;
}

export interface ActivityLogResource extends BaseResource {
  userId: number | string;
  activityType: string;
  durationMinutes: number;
  caloriesBurned: number;
  timestamp: string;
}

export interface WearableConnectionResponse extends BaseResponse {
  connection: WearableConnectionResource;
}

export interface ActivityLogResponse extends BaseResponse {
  log: ActivityLogResource;
}
