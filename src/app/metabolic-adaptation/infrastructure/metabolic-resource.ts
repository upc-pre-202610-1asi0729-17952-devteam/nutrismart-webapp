import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

/**
 * API resource DTO for {@link BodyMetric}.
 *
 * @author Espinoza Cruz, Angela Milagros
 */
export interface BodyMetricResource extends BaseResource {
  user_id: number | string;
  weight_kg: number;
  height_cm: number;
  logged_at: string;
  target_weight_kg?: number;
  projected_achievement_date?: string;
}

/**
 * API resource DTO for {@link BodyComposition}.
 *
 * @author Espinoza Cruz, Angela Milagros
 */
export interface BodyCompositionResource extends BaseResource {
  user_id: number | string;
  waist_cm: number;
  neck_cm?: number;
  height_cm: number;
  weight_kg: number;
  measured_at: string;
  previous_body_fat_percent?: number;
  override_body_fat_percent?: number;
}

/**
 * API resource DTO for {@link NutritionPlan}.
 *
 * @author Espinoza Cruz, Angela Milagros
 */
export interface NutritionPlanResource extends BaseResource {
  user_id: number;
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
