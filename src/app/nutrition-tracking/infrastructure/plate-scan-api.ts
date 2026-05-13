import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { MealType } from '../domain/model/meal-type.enum';
import { MacronutrientDistribution } from '../domain/model/macronutrient-distribution.value-object';
import { ScanResult } from '../domain/model/scan-result.entity';
import { ScannedFoodItem } from '../domain/model/scanned-food-item.entity';

/**
 * Application-facing API façade for plate-photo scanning (ScanMealPhoto command).
 *
 * Lives in Nutrition Tracking because plate scanning is a mechanism for logging
 * food into DailyIntake, driven by the {@link ScanResult} aggregate.
 *
 * All methods return mock data while a real backend is not available.
 *
 * @author Del Aguila Del Aguila, Olenka Priscilla
 */
@Injectable({ providedIn: 'root' })
export class PlateScanApi extends BaseApi {
  private _http      = inject(HttpClient);
  private _translate = inject(TranslateService);

  constructor() { super(); }

  private _t(namespace: string, key: string | null, fallback: string): string {
    if (!key) return fallback;
    const resolved = this._translate.instant(`${namespace}.${key}`);
    return resolved !== `${namespace}.${key}` ? resolved : fallback;
  }

  /**
   * Submits a food-plate image for nutritional analysis (ScanMealPhoto command).
   *
   * @param imageBase64 - Base-64-encoded image data.
   * @returns Observable emitting a {@link ScanResult} with status 'success' or 'invalid'.
   */
  scanFoodPlate(imageBase64: string): Observable<ScanResult> {
    const mock = new ScanResult({
      id:     1,
      status: 'success',
      imageBase64,
      detectedItems: [
        new ScannedFoodItem({ id: 1, name: this._t('food_items', 'grilled_chicken_breast', 'Grilled chicken breast'), nameKey: 'grilled_chicken_breast', quantityGrams: 150, macros: new MacronutrientDistribution({ calories: 248, protein: 47, carbs: 0,  fat: 5, fiber: 0, sugar: 0 }), restrictions: [], isEdited: false }),
        new ScannedFoodItem({ id: 2, name: this._t('food_items', 'white_rice',             'White rice'),             nameKey: 'white_rice',             quantityGrams: 180, macros: new MacronutrientDistribution({ calories: 234, protein: 4,  carbs: 52, fat: 0, fiber: 0, sugar: 0 }), restrictions: [], isEdited: false }),
        new ScannedFoodItem({ id: 3, name: this._t('food_items', 'mixed_salad',            'Mixed salad'),            nameKey: 'mixed_salad',            quantityGrams: 80,  macros: new MacronutrientDistribution({ calories: 45,  protein: 2,  carbs: 8,  fat: 0, fiber: 0, sugar: 0 }), restrictions: [], isEdited: false }),
      ],
      mealType:  MealType.LUNCH,
      source:    'Google Cloud Vision API · Open Food Facts',
      scannedAt: new Date().toISOString(),
    });
    return of(mock);
  }

  /**
   * Persists the user-confirmed scan items as a meal log entry (ConfirmScanResult command).
   *
   * @param scanResult - The confirmed {@link ScanResult} aggregate.
   * @returns Observable that completes when the entry is saved.
   */
  confirmPlateScan(scanResult: ScanResult): Observable<void> {
    return of(void 0);
  }
}
