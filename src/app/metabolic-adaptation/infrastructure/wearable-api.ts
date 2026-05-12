import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { WearableConnection } from '../domain/model/wearable-connection.entity';
import { ActivityLog } from '../domain/model/activity-log.entity';
import { WearableStatus } from '../domain/model/wearable-status.enum';
import { WearableConnectionEndpoint, ActivityLogEndpoint } from './wearable-api-endpoint';

@Injectable({ providedIn: 'root' })
export class WearableApi extends BaseApi {
  private http         = inject(HttpClient);
  private connectionEp = new WearableConnectionEndpoint(this.http);
  private activityEp   = new ActivityLogEndpoint(this.http);

  getWearableConnection(userId: string | number): Observable<WearableConnection | null> {
    return this.connectionEp.getByUserId(userId).pipe(
      catchError(err => throwError(() => err)),
    );
  }

  connectGoogleFit(userId: string | number): Observable<WearableConnection> {
    const now = new Date().toISOString();
    const connection = new WearableConnection({
      id:           0,
      userId,
      provider:     'google_fit',
      status:       WearableStatus.CONNECTED,
      lastSyncedAt: now,
      authorizedAt: now,
    });
    return this.connectionEp.create(connection).pipe(
      retry(2),
      catchError(err => throwError(() => err)),
    );
  }

  disconnectWearable(connectionId: number): Observable<void> {
    return this.connectionEp.delete(connectionId).pipe(
      retry(2),
      catchError(err => throwError(() => err)),
    );
  }

  syncNow(connection: WearableConnection): Observable<WearableConnection> {
    const updated = new WearableConnection({
      id:           connection.id,
      userId:       connection.userId,
      provider:     connection.provider,
      status:       WearableStatus.CONNECTED,
      lastSyncedAt: new Date().toISOString(),
      authorizedAt: connection.authorizedAt,
    });
    return this.connectionEp.update(updated, connection.id).pipe(
      retry(2),
      catchError(err => throwError(() => err)),
    );
  }

  markSyncFailed(connection: WearableConnection): Observable<WearableConnection> {
    const updated = new WearableConnection({
      id:           connection.id,
      userId:       connection.userId,
      provider:     connection.provider,
      status:       WearableStatus.SYNC_FAILED,
      lastSyncedAt: connection.lastSyncedAt,
      authorizedAt: connection.authorizedAt,
    });
    return this.connectionEp.update(updated, connection.id).pipe(
      catchError(err => throwError(() => err)),
    );
  }

  logManualActivity(
    userId: string | number,
    activityType: string,
    durationMinutes: number,
    caloriesBurned: number,
  ): Observable<ActivityLog> {
    const log = new ActivityLog({
      id:              0,
      userId,
      activityType,
      durationMinutes,
      caloriesBurned,
      timestamp:       new Date().toISOString(),
    });
    return this.activityEp.create(log).pipe(
      retry(2),
      catchError(err => throwError(() => err)),
    );
  }

  getActivityLogs(userId: string | number): Observable<ActivityLog[]> {
    return this.activityEp.getByUserId(userId).pipe(
      map(logs => logs.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )),
      catchError(err => throwError(() => err)),
    );
  }
}
