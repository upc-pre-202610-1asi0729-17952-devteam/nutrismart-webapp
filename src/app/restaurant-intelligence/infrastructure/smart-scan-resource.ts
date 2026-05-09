import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

/**
 * API resource DTO for a single scanned food item.
 *
 * @author Del Aguila Del Aguila, Olenka Priscilla
 */
export interface ScannedFoodItemResource extends BaseResource {
  name: string;
  name_key: string | null;
  quantity_grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  restrictions: string[];
  is_edited: boolean;
}

/**
 * API resource DTO for a plate-scan result (ScanResult aggregate).
 *
 * @author Del Aguila Del Aguila, Olenka Priscilla
 */
export interface ScanResultResource extends BaseResource {
  status: string;
  image_base64: string;
  detected_items: ScannedFoodItemResource[];
  meal_type: string;
  source: string;
  scanned_at: string;
}

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
 * API resource DTO for a menu analysis result (MenuAnalysis aggregate).
 *
 * @author Del Aguila Del Aguila, Olenka Priscilla
 */
export interface MenuAnalysisResource extends BaseResource {
  ranked_dishes: RankedDishResource[];
  restricted_dishes: RestrictedDishResource[];
  scanned_at: string;
  restaurant_name: string;
}

/** Response envelope for plate-scan endpoints that return arrays. */
export interface ScanResultsResponse extends BaseResponse {
  results: ScanResultResource[];
}

/** Response envelope for menu analysis endpoints that return arrays. */
export interface MenuAnalysisResponse extends BaseResponse {
  analyses: MenuAnalysisResource[];
}
