import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment.development';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { WearableConnection } from '../domain/model/wearable-connection.entity';
import { ActivityLog } from '../domain/model/activity-log.entity';
import { WearableConnectionAssembler, ActivityLogAssembler } from './wearable-assembler';
import {
  WearableConnectionResource, WearableConnectionResponse,
  ActivityLogResource, ActivityLogResponse,
} from './wearable-resource';

export class WearableConnectionEndpoint extends BaseApiEndpoint<
  WearableConnection, WearableConnectionResource, WearableConnectionResponse, WearableConnectionAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      environment.apiBaseUrl + environment.wearableConnectionsEndpointPath,
      new WearableConnectionAssembler(),
    );
  }

  getByUserId(userId: string | number): Observable<WearableConnection | null> {
    return this.http.get<WearableConnectionResource[]>(this.endpointUrl).pipe(
      map(resources => {
        const match = resources.find(r => String(r.user_id) === String(userId));
        return match ? this.assembler.toEntityFromResource(match) : null;
      }),
    );
  }
}

export class ActivityLogEndpoint extends BaseApiEndpoint<
  ActivityLog, ActivityLogResource, ActivityLogResponse, ActivityLogAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      environment.apiBaseUrl + environment.activityLogsEndpointPath,
      new ActivityLogAssembler(),
    );
  }

  getByUserId(userId: string | number): Observable<ActivityLog[]> {
    return this.http.get<ActivityLogResource[]>(this.endpointUrl).pipe(
      map(resources =>
        resources
          .filter(r => String(r.user_id) === String(userId))
          .map(r => this.assembler.toEntityFromResource(r)),
      ),
    );
  }
}
