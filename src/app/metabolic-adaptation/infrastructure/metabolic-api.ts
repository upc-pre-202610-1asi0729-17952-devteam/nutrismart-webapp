import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { BodyMetric } from '../domain/model/body-metric.entity';
import { BodyComposition } from '../domain/model/body-composition.entity';
import { NutritionPlan } from '../domain/model/nutrition-plan.entity';

/**
 * Application-facing API façade for the Metabolic Adaptation bounded context.
 *
 * All methods return mock data — a real implementation would replace the
 * `of(...)` calls with HTTP endpoint calls via concrete BaseApiEndpoint
 * subclasses. Provided in root so a single instance is shared across
 * the application.
 *
 * @author Espinoza Cruz, Angela Milagros
 */
@Injectable({ providedIn: 'root' })
export class MetabolicApi extends BaseApi {

  /**
   * Records a new weight entry for the authenticated user.
   *
   * @param userId   - The user's numeric ID.
   * @param weightKg - New weight in kilograms.
   * @param heightCm - Current height in centimetres.
   * @returns Observable emitting the created {@link BodyMetric}.
   */
  logWeight(userId: number, weightKg: number, heightCm: number): Observable<BodyMetric> {
    return of(new BodyMetric({
      id:        Date.now(),
      userId,
      weightKg,
      heightCm,
      loggedAt: new Date().toISOString(),
    }));
  }

  /**
   * Updates the user's height and triggers a BMI recalculation.
   *
   * @param userId   - The user's numeric ID.
   * @param heightCm - New height in centimetres.
   * @param weightKg - Current weight used for BMI recalculation.
   * @returns Observable emitting the updated {@link BodyMetric}.
   */
  updateHeight(userId: number, heightCm: number, weightKg: number): Observable<BodyMetric> {
    return of(new BodyMetric({
      id:       Date.now(),
      userId,
      weightKg,
      heightCm,
      loggedAt: new Date().toISOString(),
    }));
  }

  /**
   * Fetches the weight-entry history for the user.
   *
   * @param userId  - The user's numeric ID.
   * @param days    - Number of past days to include (7, 30, or 90).
   * @returns Observable emitting an array of {@link BodyMetric} entries
   *          ordered from oldest to most recent.
   */
  getMetricsHistory(userId: number, days: 7 | 30 | 90): Observable<BodyMetric[]> {
    const now    = new Date();
    const count  = days === 7 ? 6 : days === 30 ? 8 : 12;
    const step   = Math.floor(days / count);
    const base   = 70.5;

    const entries: BodyMetric[] = Array.from({ length: count }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (count - i - 1) * step);
      const weight = Math.round((base - i * 0.15) * 10) / 10;
      return new BodyMetric({
        id:       i + 1,
        userId,
        weightKg: weight,
        heightCm: 163,
        loggedAt: date.toISOString(),
      });
    });

    return of(entries);
  }

  /**
   * Sets the target weight for the user and returns the updated metric.
   *
   * @param userId         - The user's numeric ID.
   * @param targetWeightKg - Target weight in kilograms.
   * @returns Observable emitting the updated current {@link BodyMetric}.
   */
  setTargetWeight(userId: number, targetWeightKg: number): Observable<BodyMetric> {
    const metric = new BodyMetric({
      id: 1, userId,
      weightKg: 70.2, heightCm: 163,
      loggedAt: new Date().toISOString(),
      targetWeightKg,
    });
    // Use domain method: |currentWeight − target| / 0.25 kg/week
    metric.projectedAchievementDate = metric.calculateProjectedDate(targetWeightKg).toISOString();
    return of(metric);
  }

  /**
   * Returns the current metabolic targets (BMR, TDEE) for the user.
   *
   * @param userId - The user's numeric ID.
   * @returns Observable emitting the current {@link BodyMetric} with calculated targets.
   */
  getMetabolicTargets(userId: number): Observable<BodyMetric> {
    const metric = new BodyMetric({
      id: 1, userId,
      weightKg: 70.2, heightCm: 163,
      loggedAt: new Date().toISOString(),
      targetWeightKg: 65,
    });
    // Use domain method: (70.2 − 65) / 0.25 kg/week = 20.8 weeks ≈ 146 days
    metric.projectedAchievementDate = metric.calculateProjectedDate(65).toISOString();
    return of(metric);
  }

  /**
   * Saves a body composition measurement via direct cm input or a pre-calculated
   * body fat percentage override (pant-size or visual-range estimation).
   *
   * @param userId                  - The user's numeric ID.
   * @param weightKg                - Current weight in kilograms.
   * @param heightCm                - Height in centimetres.
   * @param waistCm                 - Waist circumference in cm (modes A and B).
   * @param overrideBodyFatPercent  - Direct body fat % estimate (mode C).
   * @returns Observable emitting the updated {@link BodyComposition}.
   */
  setComposition(
    userId:                 number,
    weightKg:               number,
    heightCm:               number,
    waistCm?:               number,
    overrideBodyFatPercent?: number,
  ): Observable<BodyComposition> {
    return of(new BodyComposition({
      id:                    Date.now(),
      userId,
      waistCm:               waistCm ?? 0,
      heightCm,
      weightKg,
      measuredAt:            new Date().toISOString(),
      overrideBodyFatPercent,
    }));
  }
}
