import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { WearableApi } from '../infrastructure/wearable-api';
import { IamStore } from '../../iam/application/iam.store';
import { DomainEventBus } from '../../shared/application/domain-event-bus';
import { WearableConnection } from '../domain/model/wearable-connection.entity';
import { ActivityLog } from '../domain/model/activity-log.entity';
import { ActivityType } from '../domain/model/activity-type.value-object';
import { WearableConnected } from '../domain/events/wearable-connected.event';
import { ManualActivityImported } from '../domain/events/manual-activity-imported.event';
import { CaloricTargetAdjusted } from '../domain/events/caloric-target-adjusted.event';
import { ActivityTrendDetected } from '../domain/events/activity-trend-detected.event';
import { ActivitySynced } from '../domain/events/activity-synced.event';
import { ActiveCaloriesCalculated } from '../domain/events/active-calories-calculated.event';

@Injectable({ providedIn: 'root' })
export class WearableStore {
  private api      = inject(WearableApi);
  private iamStore = inject(IamStore);
  private eventBus = inject(DomainEventBus);

  // ─── Private Signals ──────────────────────────────────────────────────────

  private _connection           = signal<WearableConnection | null>(null);
  private _activityLogs         = signal<ActivityLog[]>([]);
  private _estimatedCalories    = signal<number>(0);
  private _loading              = signal<boolean>(false);
  private _error                = signal<string | null>(null);
  private _lastTrendDetectedAt  = signal<string | null>(null);

  // ─── Public Read-only Signals ─────────────────────────────────────────────

  readonly connection        = this._connection.asReadonly();
  readonly activityLogs      = this._activityLogs.asReadonly();
  readonly estimatedCalories = this._estimatedCalories.asReadonly();
  readonly loading           = this._loading.asReadonly();
  readonly error             = this._error.asReadonly();

  // ─── Computed ─────────────────────────────────────────────────────────────

  readonly netCalorieAdjustment = computed(() =>
    this._activityLogs()
      .filter(l => l.isFromToday())
      .reduce((sum, l) => sum + l.toNetAdjustment(), 0),
  );

  readonly netDailyTarget = computed(() => {
    const plan = this.iamStore.currentUser();
    return (plan?.dailyCalorieTarget ?? 0) + this.netCalorieAdjustment();
  });

  readonly todayLogs = computed(() =>
    this._activityLogs().filter(l => l.isFromToday()),
  );

  readonly weekLogs = computed(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    return this._activityLogs().filter(
      l => new Date(l.timestamp) >= cutoff,
    );
  });

  readonly activityTypeKeys = computed(() => ActivityType.allKeys());

  /** The 15 most recent activity logs, sorted newest-first. */
  readonly recentLogs = computed(() =>
    [...this._activityLogs()]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 15),
  );

  // ─── Load ─────────────────────────────────────────────────────────────────

  async load(): Promise<void> {
    const user = this.iamStore.currentUser();
    if (!user) return;
    this._loading.set(true);
    this._error.set(null);
    try {
      const [connection, logs] = await Promise.all([
        firstValueFrom(this.api.getWearableConnection(user.id)),
        firstValueFrom(this.api.getActivityLogs(user.id)),
      ]);
      this._connection.set(connection);
      this._activityLogs.set(logs);
    } catch {
      this._error.set('physical_activity.error_load');
    } finally {
      this._loading.set(false);
    }
  }

  // ─── Wearable Connection ──────────────────────────────────────────────────

  async connectGoogleFit(): Promise<void> {
    const user = this.iamStore.currentUser();
    if (!user) return;
    this._loading.set(true);
    this._error.set(null);
    try {
      const connection = await firstValueFrom(this.api.connectGoogleFit(user.id));
      this._connection.set(connection);
      this.eventBus.publish(new WearableConnected(user.id, 'google_fit', connection.authorizedAt));
    } catch {
      this._error.set('physical_activity.error_connect');
    } finally {
      this._loading.set(false);
    }
  }

  async disconnectWearable(): Promise<void> {
    const connection = this._connection();
    if (!connection) return;
    this._loading.set(true);
    this._error.set(null);
    try {
      await firstValueFrom(this.api.disconnectWearable(connection.id));
      this._connection.set(null);
    } catch {
      this._error.set('physical_activity.error_disconnect');
    } finally {
      this._loading.set(false);
    }
  }

  async syncNow(): Promise<void> {
    const connection = this._connection();
    const user       = this.iamStore.currentUser();
    if (!connection || !user) return;
    this._loading.set(true);
    this._error.set(null);
    try {
      const updated = await firstValueFrom(this.api.syncNow(connection));
      this._connection.set(updated);

      const logs = await firstValueFrom(this.api.getActivityLogs(user.id));
      this._activityLogs.set(logs);

      const caloriesBurned  = this.netCalorieAdjustment();
      const syncedAt        = new Date().toISOString();
      this.eventBus.publish(new ActivitySynced(user.id, caloriesBurned, syncedAt));

      if (caloriesBurned > 0) {
        const previousTarget = user.dailyCalorieTarget;
        this.eventBus.publish(new CaloricTargetAdjusted(
          user.id, previousTarget, previousTarget + caloriesBurned, caloriesBurned,
        ));
      }

      this.analyzeWeeklyTrend();
    } catch {
      this._error.set('physical_activity.error_sync');
    } finally {
      this._loading.set(false);
    }
  }

  // ─── Manual Activity ──────────────────────────────────────────────────────

  // ─── Trend Analysis ───────────────────────────────────────────────────────

  /**
   * Analyses the last 7 days of activity logs and publishes
   * {@link ActivityTrendDetected} when the daily average exceeds 300 kcal.
   *
   * A 24-hour cooldown prevents duplicate events when multiple activities
   * are logged on the same day.
   */
  private analyzeWeeklyTrend(): void {
    const user = this.iamStore.currentUser();
    if (!user) return;

    const lastDetected = this._lastTrendDetectedAt();
    if (lastDetected) {
      const hoursSinceLast = (Date.now() - new Date(lastDetected).getTime()) / 3_600_000;
      if (hoursSinceLast < 24) return;
    }

    const logs            = this.weekLogs();
    const totalBurned     = logs.reduce((sum, l) => sum + l.caloriesBurned, 0);
    const averagePerDay   = Math.round(totalBurned / 7);
    const TREND_THRESHOLD = 300;

    if (averagePerDay < TREND_THRESHOLD) return;

    const recommendedTdeeAdjustment = Math.round(averagePerDay * 0.5);
    const detectedAt                = new Date().toISOString();

    this.eventBus.publish(new ActivityTrendDetected(
      user.id,
      averagePerDay,
      recommendedTdeeAdjustment,
      detectedAt,
    ));
    this._lastTrendDetectedAt.set(detectedAt);
  }

  // ─── Manual Activity ──────────────────────────────────────────────────────

  previewCalories(activityKey: string, durationMinutes: number): void {
    const user = this.iamStore.currentUser();
    if (!user || !activityKey || durationMinutes <= 0) {
      this._estimatedCalories.set(0);
      return;
    }
    try {
      const type = ActivityType.from(activityKey);
      this._estimatedCalories.set(type.estimateCalories(user.weight, durationMinutes));
    } catch {
      this._estimatedCalories.set(0);
    }
  }

  async logManualActivity(activityKey: string, durationMinutes: number): Promise<void> {
    const user = this.iamStore.currentUser();
    if (!user) return;
    const calories = this._estimatedCalories();
    this._loading.set(true);
    this._error.set(null);
    try {
      const log = await firstValueFrom(
        this.api.logManualActivity(user.id, activityKey, durationMinutes, calories),
      );
      this._activityLogs.update(logs => [log, ...logs]);
      this.eventBus.publish(new ManualActivityImported(
        user.id, activityKey, durationMinutes, calories, log.timestamp,
      ));
      this.eventBus.publish(new ActiveCaloriesCalculated(
        user.id, calories, activityKey, durationMinutes,
      ));
      const previousTarget = user.dailyCalorieTarget;
      this.eventBus.publish(new CaloricTargetAdjusted(
        user.id, previousTarget, previousTarget + calories, calories,
      ));
      this._estimatedCalories.set(0);
      this.analyzeWeeklyTrend();
    } catch {
      this._error.set('physical_activity.error_log_activity');
    } finally {
      this._loading.set(false);
    }
  }
}
