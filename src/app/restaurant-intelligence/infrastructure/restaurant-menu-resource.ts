import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

/**
 * API resource DTO for a single ranked dish within a menu analysis.
 *
 * @author Del Aguila Del Aguila, Olenka Priscilla
 */
export interface RankedDishResource {
  rank: number;
  name: string;
  name_key: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  compatibility_score: number;
  justification: string;
  justification_key: string | null;
}

/**
 * API resource DTO for a restricted dish entry.
 *
 * @author Del Aguila Del Aguila, Olenka Priscilla
 */
export interface RestrictedDishResource {
  name: string;
  name_key: string | null;
  restriction: string;
}

/**
 * API resource DTO for a menu analysis result ({@link MenuAnalysis} aggregate).
 *
 * @author Del Aguila Del Aguila, Olenka Priscilla
 */
export interface MenuAnalysisResource extends BaseResource {
  ranked_dishes: RankedDishResource[];
  restricted_dishes: RestrictedDishResource[];
  scanned_at: string;
  restaurant_name: string;
}

/** Response envelope for menu analysis endpoints that return arrays. */
export interface MenuAnalysisResponse extends BaseResponse {
  analyses: MenuAnalysisResource[];
}
