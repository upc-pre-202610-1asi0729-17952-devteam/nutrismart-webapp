import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { MealType } from '../domain/model/meal-type.enum';
import { MacronutrientDistribution } from '../domain/model/macronutrient-distribution.value-object';
import { ScanResult } from '../domain/model/scan-result.entity';
import { ScannedFoodItem } from '../domain/model/scanned-food-item.entity';
import { environment } from '../../../environments/environment.development';

interface ConfirmPlateScanPayload {
  mealType: string;
  items: Array<{
    foodItemId: number | null;
    name: string;
    nameEs: string | null;
    quantityG: number;
    caloriesPer100g: number;
    proteinPer100g: number;
    carbsPer100g: number;
    fatPer100g: number;
    isEstimate: boolean;
  }>;
}

interface ScanPlateResponse {
  detectedItems: Array<{
    foodItemId: number | null;
    name: string;
    nameEs: string | null;
    estimatedQuantityG: number;
    caloriesPer100g: number;
    proteinPer100g: number;
    carbsPer100g: number;
    fatPer100g: number;
    isEstimate: boolean;
  }>;
}

/**
 * Application-facing API façade for plate-photo scanning (ScanMealPhoto command).
 *
 * Calls POST /api/v1/nutrition-log/smart-scan/plate with the imageBase64 payload
 * and maps the response to the {@link ScanResult} aggregate.
 *
 * @author Del Aguila Del Aguila, Olenka Priscilla
 */
@Injectable({ providedIn: 'root' })
export class PlateScanApi extends BaseApi {
  private _http = inject(HttpClient);

  private readonly _plateUrl = environment.apiBaseUrl + '/nutrition-log/smart-scan/plate';

  constructor() { super(); }

  /**
   * Submits a food-plate image for nutritional analysis via Gemini + DeepSeek.
   *
   * @param imageBase64 - Base-64-encoded image data (data URL accepted).
   * @returns Observable emitting a {@link ScanResult} with status 'success' or 'invalid'.
   */
  scanFoodPlate(imageBase64: string): Observable<ScanResult> {
    return this._http.post<ScanPlateResponse>(this._plateUrl, { imageBase64 }).pipe(
      map(response => this._toScanResult(response, imageBase64)),
      catchError(() => of(this._emptyScanResult(imageBase64))),
    );
  }

  /**
   * Persists the confirmed scan items via the backend confirm endpoint.
   * Estimated items are saved to the food DB if they don't already exist.
   */
  confirmPlateScan(scanResult: ScanResult, mealType: MealType): Observable<void> {
    const payload: ConfirmPlateScanPayload = {
      mealType: mealType.toString(),
      items: scanResult.detectedItems.map(item => ({
        foodItemId:      item.foodItemId,
        name:            item.name,
        nameEs:          item.nameEs,
        quantityG:       item.quantityGrams,
        caloriesPer100g: item.caloriesPer100g,
        proteinPer100g:  item.proteinPer100g,
        carbsPer100g:    item.carbsPer100g,
        fatPer100g:      item.fatPer100g,
        isEstimate:      item.isEstimate,
      })),
    };
    return this._http
      .post<void>(this._plateUrl + '/confirm', payload)
      .pipe(catchError(() => of(void 0)));
  }

  // ─── Mapping ──────────────────────────────────────────────────────────────

  private _toScanResult(response: ScanPlateResponse, imageBase64: string): ScanResult {
    if (!response.detectedItems || response.detectedItems.length === 0) {
      return this._emptyScanResult(imageBase64);
    }

    const detectedItems = response.detectedItems.map((item, idx) => {
      const qty       = item.estimatedQuantityG ?? 100;
      const calories  = ((item.caloriesPer100g ?? 0) * qty) / 100;
      const protein   = ((item.proteinPer100g  ?? 0) * qty) / 100;
      const carbs     = ((item.carbsPer100g    ?? 0) * qty) / 100;
      const fat       = ((item.fatPer100g      ?? 0) * qty) / 100;

      return new ScannedFoodItem({
        id:              item.foodItemId ?? idx + 1,
        foodItemId:      item.foodItemId ?? null,
        name:            item.name,
        nameEs:          item.nameEs ?? null,
        nameKey:         null,
        quantityGrams:   qty,
        macros: new MacronutrientDistribution({ calories, protein, carbs, fat, fiber: 0, sugar: 0 }),
        restrictions:    [],
        isEdited:        false,
        isEstimate:      item.isEstimate,
        caloriesPer100g: item.caloriesPer100g ?? 0,
        proteinPer100g:  item.proteinPer100g  ?? 0,
        carbsPer100g:    item.carbsPer100g    ?? 0,
        fatPer100g:      item.fatPer100g      ?? 0,
      });
    });

    return new ScanResult({
      id:            1,
      status:        'success',
      imageBase64,
      detectedItems,
      mealType:      MealType.LUNCH,
      source:        'Gemini AI · Smart Scan',
      scannedAt:     new Date().toISOString(),
    });
  }

  private _emptyScanResult(imageBase64: string): ScanResult {
    return new ScanResult({
      id: 0, status: 'invalid', imageBase64,
      detectedItems: [], mealType: MealType.LUNCH,
      source: 'Gemini AI · Smart Scan', scannedAt: new Date().toISOString(),
    });
  }
}
