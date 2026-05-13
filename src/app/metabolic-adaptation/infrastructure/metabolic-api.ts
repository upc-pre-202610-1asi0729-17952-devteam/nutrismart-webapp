import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EMPTY, Observable, throwError } from 'rxjs';
import { catchError, map, retry, switchMap } from 'rxjs/operators';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { BodyMetric } from '../domain/model/body-metric.entity';
import { BodyComposition } from '../domain/model/body-composition.entity';
import { BodyMetricEndpoint, BodyCompositionEndpoint } from './metabolic-api-endpoint';

@Injectable({ providedIn: 'root' })
export class MetabolicApi extends BaseApi {
  private http          = inject(HttpClient);
  private metricEp      = new BodyMetricEndpoint(this.http);
  private compositionEp = new BodyCompositionEndpoint(this.http);

  logWeight(userId: number | string, weightKg: number, heightCm: number): Observable<BodyMetric> {
    return this.metricEp.create(new BodyMetric({
      id: 0, userId: userId as number, weightKg, heightCm,
      loggedAt: new Date().toISOString(),
    })).pipe(
      retry(2),
      catchError(err => throwError(() => err)),
    );
  }

  getMetricsHistory(
    userId: number | string,
    days: number,
    goalStartedAt?: string,
  ): Observable<BodyMetric[]> {
    const daysCutoff = new Date();
    daysCutoff.setDate(daysCutoff.getDate() - days);
    const goalCutoff   = goalStartedAt ? new Date(goalStartedAt) : null;
    const effectiveCutoff = goalCutoff && goalCutoff > daysCutoff ? goalCutoff : daysCutoff;
    return this.metricEp.getByUserId(userId).pipe(
      map(metrics =>
        metrics
          .filter(m => new Date(m.loggedAt) >= effectiveCutoff)
          .sort((a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime()),
      ),
      retry(2),
      catchError(err => throwError(() => err)),
    );
  }

  getMetabolicTargets(userId: number | string, goalStartedAt?: string): Observable<BodyMetric | null> {
    return this.metricEp.getByUserId(userId).pipe(
      map(metrics => {
        const scoped = goalStartedAt
          ? metrics.filter(m => new Date(m.loggedAt) >= new Date(goalStartedAt))
          : metrics;
        if (!scoped.length) return null;
        return [...scoped].sort(
          (a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime(),
        )[0];
      }),
      retry(2),
      catchError(err => throwError(() => err)),
    );
  }

  setTargetWeight(userId: number | string, targetWeightKg: number, goalStartedAt?: string): Observable<BodyMetric> {
    return this.metricEp.getByUserId(userId).pipe(
      switchMap(metrics => {
        const scoped = goalStartedAt
          ? metrics.filter(m => new Date(m.loggedAt) >= new Date(goalStartedAt))
          : metrics;
        const current = [...scoped].sort(
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
      catchError(err => throwError(() => err)),
    );
  }

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
      catchError(err => throwError(() => err)),
    );
  }

  getAllMetricsHistory(userId: number | string, goalStartedAt?: string): Observable<BodyMetric[]> {
    return this.metricEp.getByUserId(userId).pipe(
      map(metrics => {
        const scoped = goalStartedAt
          ? metrics.filter(m => new Date(m.loggedAt) >= new Date(goalStartedAt))
          : metrics;
        return scoped.sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime());
      }),
      retry(2),
      catchError(err => throwError(() => err)),
    );
  }

  getComposition(userId: number | string): Observable<BodyComposition | null> {
    return this.compositionEp.getLatestByUserId(userId).pipe(
      retry(2),
      catchError(err => throwError(() => err)),
    );
  }

  updateWeight(metric: BodyMetric, newWeightKg: number): Observable<BodyMetric> {
    const projectedDate = metric.targetWeightKg > 0
      ? new BodyMetric({
          id: 0, userId: metric.userId, weightKg: newWeightKg,
          heightCm: metric.heightCm, loggedAt: metric.loggedAt,
        }).calculateProjectedDate(metric.targetWeightKg).toISOString()
      : '';
    const updated = new BodyMetric({
      id:                       metric.id,
      userId:                   metric.userId,
      weightKg:                 newWeightKg,
      heightCm:                 metric.heightCm,
      loggedAt:                 metric.loggedAt,
      targetWeightKg:           metric.targetWeightKg,
      projectedAchievementDate: projectedDate,
    });
    return this.metricEp.update(updated, String(metric.id) as unknown as number).pipe(
      retry(2),
      catchError(err => throwError(() => err)),
    );
  }

}
