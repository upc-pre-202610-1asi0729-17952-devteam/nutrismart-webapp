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
 * API resource DTO for a plate-scan result ({@link ScanResult} aggregate).
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

/** Response envelope for plate-scan endpoints that return arrays. */
export interface ScanResultsResponse extends BaseResponse {
  results: ScanResultResource[];
}
