import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { WearableConnection } from '../domain/model/wearable-connection.entity';
import { ActivityLog } from '../domain/model/activity-log.entity';
import { WearableStatus } from '../domain/model/wearable-status.enum';
import {
  WearableConnectionResource, WearableConnectionResponse,
  ActivityLogResource, ActivityLogResponse,
} from './wearable-resource';

export class WearableConnectionAssembler
  implements BaseAssembler<WearableConnection, WearableConnectionResource, WearableConnectionResponse> {

  toEntityFromResource(r: WearableConnectionResource): WearableConnection {
    return new WearableConnection({
      id:           r.id,
      userId:       r.user_id,
      provider:     r.provider,
      status:       r.status as WearableStatus,
      lastSyncedAt: r.last_synced_at,
      authorizedAt: r.authorized_at,
    });
  }

  toResourceFromEntity(e: WearableConnection): WearableConnectionResource {
    return {
      id:             e.id,
      user_id:        e.userId,
      provider:       e.provider,
      status:         e.status,
      last_synced_at: e.lastSyncedAt,
      authorized_at:  e.authorizedAt,
    };
  }

  toEntitiesFromResponse(r: WearableConnectionResponse): WearableConnection[] {
    return [this.toEntityFromResource(r.connection)];
  }
}

export class ActivityLogAssembler
  implements BaseAssembler<ActivityLog, ActivityLogResource, ActivityLogResponse> {

  toEntityFromResource(r: ActivityLogResource): ActivityLog {
    return new ActivityLog({
      id:              r.id,
      userId:          r.user_id,
      activityType:    r.activity_type,
      durationMinutes: r.duration_minutes,
      caloriesBurned:  r.calories_burned,
      timestamp:       r.timestamp,
    });
  }

  toResourceFromEntity(e: ActivityLog): ActivityLogResource {
    return {
      id:               e.id,
      user_id:          e.userId,
      activity_type:    e.activityType,
      duration_minutes: e.durationMinutes,
      calories_burned:  e.caloriesBurned,
      timestamp:        e.timestamp,
    };
  }

  toEntitiesFromResponse(r: ActivityLogResponse): ActivityLog[] {
    return [this.toEntityFromResource(r.log)];
  }
}
