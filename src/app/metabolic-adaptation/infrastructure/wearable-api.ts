import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { WearableConnection } from '../domain/model/wearable-connection.entity';
import { ActivityLog } from '../domain/model/activity-log.entity';
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

  /**
   * Connects Google Health via the server-side OAuth flow: sends the authorization
   * code obtained from Google's consent screen so the backend can exchange it for
   * tokens, persist the connection and import the first activity batch.
   */
  connectGoogleHealth(userId: string | number, oauthCode: string): Observable<WearableConnection> {
    return this.connectionEp.connect(userId, 'google_health', oauthCode).pipe(
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
    return this.connectionEp.sync(connection.id).pipe(
      retry(2),
      catchError(err => throwError(() => err)),
    );
  }

  /** Persists the auto-sync preference for a connection. */
  setAutoSync(connection: WearableConnection, enabled: boolean): Observable<WearableConnection> {
    return this.connectionEp.setAutoSync(connection.id, enabled).pipe(
      retry(2),
      catchError(err => throwError(() => err)),
    );
  }

  logManualActivity(
    userId: number,
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
