import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

/**
 * API resource DTO for {@link BodyMetric}.
 *
 * @author Espinoza Cruz, Angela Milagros
 */
export interface BodyMetricResource extends BaseResource {
  userId: number | string;
  weightKg: number;
  heightCm: number;
  loggedAt: string;
  targetWeightKg?: number;
  projectedAchievementDate?: string;
}

/**
 * API resource DTO for {@link BodyComposition}.
 *
 * @author Espinoza Cruz, Angela Milagros
 */
export interface BodyCompositionResource extends BaseResource {
  userId: number | string;
  waistCm: number;
  neckCm?: number;
  heightCm: number;
  weightKg: number;
  measuredAt: string;
  previousBodyFatPercent?: number;
  overrideBodyFatPercent?: number;
  calculatedBodyFatPercent?: number;
}

/**
 * API resource DTO for {@link NutritionPlan}.
 *
 * @author Espinoza Cruz, Angela Milagros
 */
export interface NutritionPlanResource extends BaseResource {
  userId: number;
  daily_calorie_target: number;
  protein_target_g: number;
  carbs_target_g: number;
  fat_target_g: number;
  fiber_target_g: number;
  is_active: boolean;
  created_at: string;
}

/** Response envelope for body metrics list. */
export interface BodyMetricsResponse extends BaseResponse {
  metrics: BodyMetricResource[];
}

/** Response envelope for body composition. */
export interface BodyCompositionResponse extends BaseResponse {
  composition: BodyCompositionResource;
}

/** Response envelope for nutrition plan. */
export interface NutritionPlanResponse extends BaseResponse {
  plan: NutritionPlanResource;
}
