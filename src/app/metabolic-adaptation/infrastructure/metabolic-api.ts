import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EMPTY, Observable } from 'rxjs';
import { map, retry, switchMap } from 'rxjs/operators';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { BodyMetric } from '../domain/model/body-metric.entity';
import { BodyComposition } from '../domain/model/body-composition.entity';
import { BodyMetricEndpoint, BodyCompositionEndpoint } from './metabolic-api-endpoint';

/**
 * Application-facing API façade for the Metabolic Adaptation bounded context.
 *
 * All methods delegate to concrete {@link BaseApiEndpoint} subclasses backed
 * by the json-server REST API. Provided in root so a single instance is shared
 * across the application.
 *
 * @author Espinoza Cruz, Angela Milagros
 */
@Injectable({ providedIn: 'root' })
export class MetabolicApi extends BaseApi {
  private http          = inject(HttpClient);
  private metricEp      = new BodyMetricEndpoint(this.http);
  private compositionEp = new BodyCompositionEndpoint(this.http);

  /**
   * Records a new weight entry for the authenticated user.
   */
  logWeight(userId: number | string, weightKg: number, heightCm: number): Observable<BodyMetric> {
    return this.metricEp.create(new BodyMetric({
      id: 0, userId: userId as number, weightKg, heightCm,
      loggedAt: new Date().toISOString(),
    })).pipe(retry(2));
  }

  /**
   * Updates the user's height by logging a new metric entry.
   */
  updateHeight(userId: number | string, heightCm: number, weightKg: number): Observable<BodyMetric> {
    return this.metricEp.create(new BodyMetric({
      id: 0, userId: userId as number, weightKg, heightCm,
      loggedAt: new Date().toISOString(),
    })).pipe(retry(2));
  }

  /**
   * Fetches weight-entry history for the user within the last `days` days,
   * ordered from oldest to most recent.
   */
  getMetricsHistory(userId: number | string, days: 7 | 30 | 90): Observable<BodyMetric[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return this.metricEp.getByUserId(userId).pipe(
      map(metrics =>
        metrics
          .filter(m => new Date(m.loggedAt) >= cutoff)
          .sort((a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime())
      ),
    );
  }

  /**
   * Returns the most recent body metric for the user, or `null` when no
   * entries exist yet.
   */
  getMetabolicTargets(userId: number | string): Observable<BodyMetric | null> {
    return this.metricEp.getByUserId(userId).pipe(
      map(metrics => {
        if (!metrics.length) return null;
        return [...metrics].sort(
          (a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime(),
        )[0];
      }),
    );
  }

  /**
   * Sets the target weight on the user's latest metric and persists the
   * updated projected achievement date.
   */
  setTargetWeight(userId: number | string, targetWeightKg: number): Observable<BodyMetric> {
    return this.metricEp.getByUserId(userId).pipe(
      switchMap(metrics => {
        const current = [...metrics].sort(
          (a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime(),
        )[0];
        if (!current) return EMPTY;
        const updated = new BodyMetric({
          id:                       current.id,
          userId:                   current.userId,
          weightKg:                 current.weightKg,
          heightCm:                 current.heightCm,
          loggedAt:                 current.loggedAt,
          targetWeightKg,
          projectedAchievementDate: current.calculateProjectedDate(targetWeightKg).toISOString(),
        });
        return this.metricEp.update(updated, String(current.id) as unknown as number).pipe(retry(2));
      }),
    );
  }

  /**
   * Saves a body composition measurement via direct cm input or a pre-calculated
   * body fat percentage override. Creates a new record when none exists for the
   * user; otherwise replaces the existing one.
   */
  setComposition(
    userId:                  number | string,
    weightKg:                number,
    heightCm:                number,
    waistCm?:                number,
    overrideBodyFatPercent?: number,
  ): Observable<BodyComposition> {
    return this.compositionEp.getLatestByUserId(userId).pipe(
      switchMap(existing => {
        const comp = new BodyComposition({
          id:                    (existing?.id ?? 0) as number,
          userId:                userId as number,
          waistCm:               waistCm ?? existing?.waistCm ?? 0,
          heightCm,
          weightKg,
          measuredAt:            new Date().toISOString(),
          overrideBodyFatPercent,
        });
        if (existing?.id) {
          return this.compositionEp.update(comp, String(existing.id) as unknown as number).pipe(retry(2));
        }
        return this.compositionEp.create(comp).pipe(retry(2));
      }),
    );
  }

  /**
   * Returns the most recent body composition for the user, or `null` when
   * none exists.
   */
  getComposition(userId: number | string): Observable<BodyComposition | null> {
    return this.compositionEp.getLatestByUserId(userId);
  }
}
