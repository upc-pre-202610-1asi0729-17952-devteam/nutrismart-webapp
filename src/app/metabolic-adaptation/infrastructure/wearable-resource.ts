import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export interface WearableConnectionResource extends BaseResource {
  user_id: number | string;
  provider: string;
  status: string;
  last_synced_at: string;
  authorized_at: string;
}

export interface ActivityLogResource extends BaseResource {
  user_id: number | string;
  activity_type: string;
  duration_minutes: number;
  calories_burned: number;
  timestamp: string;
}

export interface WearableConnectionResponse extends BaseResponse {
  connection: WearableConnectionResource;
}

export interface ActivityLogResponse extends BaseResponse {
  log: ActivityLogResource;
}
