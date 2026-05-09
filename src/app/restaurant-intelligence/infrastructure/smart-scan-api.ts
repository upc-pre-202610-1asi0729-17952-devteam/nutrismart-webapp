import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { MealType } from '../../nutrition-tracking/domain/model/meal-type.enum';
import { DietaryRestriction } from '../../iam/domain/model/dietary-restriction.enum';
import { ScanResult } from '../domain/model/scan-result.entity';
import { MenuAnalysis } from '../domain/model/menu-analysis.entity';
import { ScannedFoodItem } from '../domain/model/scanned-food-item.entity';

/**
 * Application-facing API façade for the Restaurant Intelligence bounded context.
 *
 * All methods return mock data while a real backend is not available.
 * Replace the `of(...)` calls with actual HTTP endpoint delegates when ready.
 *
 * @author Del Aguila Del Aguila, Olenka Priscilla
 */
@Injectable({ providedIn: 'root' })
export class SmartScanApi extends BaseApi {
  private _http: HttpClient;

  constructor() {
    super();
    this._http = inject(HttpClient);
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
        new ScannedFoodItem({ id: 1, name: 'Grilled chicken breast', nameKey: 'grilled_chicken_breast', quantityGrams: 150, calories: 248, protein: 47, carbs: 0, fat: 5, restrictions: [], isEdited: false }),
        new ScannedFoodItem({ id: 2, name: 'White rice',             nameKey: 'white_rice',             quantityGrams: 180, calories: 234, protein: 4,  carbs: 52, fat: 0, restrictions: [], isEdited: false }),
        new ScannedFoodItem({ id: 3, name: 'Mixed salad',            nameKey: 'mixed_salad',            quantityGrams: 80,  calories: 45,  protein: 2,  carbs: 8,  fat: 0, restrictions: [], isEdited: false }),
      ],
      mealType:  MealType.LUNCH,
      source:    'Google Cloud Vision API · Open Food Facts',
      scannedAt: new Date().toISOString(),
    });
    return of(mock);
  }

  /**
   * Submits a restaurant-menu image for dish analysis (ScanMenuPhoto command).
   *
   * @param imageBase64 - Base-64-encoded image data.
   * @returns Observable emitting a {@link MenuAnalysis} aggregate.
   */
  scanMenuPhoto(imageBase64: string): Observable<MenuAnalysis> {
    const mock = this._buildMockMenuAnalysis();
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

  /**
   * Ranks all compatible dishes in a menu analysis (RankCompatibleDishes command).
   *
   * @param menuAnalysisId - ID of the {@link MenuAnalysis} aggregate.
   * @param userRestrictions - Active dietary restrictions for filtering.
   * @returns Observable emitting the updated {@link MenuAnalysis}.
   */
  rankMenuDishes(menuAnalysisId: number, userRestrictions: DietaryRestriction[]): Observable<MenuAnalysis> {
    return of(this._buildMockMenuAnalysis());
  }

  /**
   * Flags dishes that conflict with the user's dietary restrictions (FilterRestrictedDishes command).
   *
   * @param menuAnalysisId - ID of the {@link MenuAnalysis} aggregate.
   * @param userRestrictions - Active dietary restrictions to check against.
   * @returns Observable emitting the updated {@link MenuAnalysis} with restricted dishes flagged.
   */
  filterRestrictedDishes(menuAnalysisId: number, userRestrictions: DietaryRestriction[]): Observable<MenuAnalysis> {
    return of(this._buildMockMenuAnalysis());
  }

  // ─── Mock builder ─────────────────────────────────────────────────────────

  private _buildMockMenuAnalysis(): MenuAnalysis {
    return new MenuAnalysis({
      id:             1,
      restaurantName: 'Local Restaurant',
      scannedAt:      new Date().toISOString(),
      rankedDishes: [
        {
          rank: 1, name: 'Hake ceviche', calories: 280,
          protein: 38, carbs: 12, fat: 8, compatibilityScore: 100,
          justification: 'Covers 38g of your remaining protein target · Within your caloric budget · No restricted ingredients',
        },
        {
          rank: 2, name: 'Chicken and cucumber salad', calories: 320,
          protein: 32, carbs: 14, fat: 10, compatibilityScore: 87,
          justification: 'High protein content, within budget',
        },
        {
          rank: 3, name: 'Gazpacho with wholemeal toast', calories: 210,
          protein: 6, carbs: 38, fat: 5, compatibilityScore: 74,
          justification: 'Light option within caloric budget',
        },
      ],
      restrictedDishes: [
        { name: 'Cheese pizza',   restriction: DietaryRestriction.LACTOSE_FREE },
        { name: 'Seafood paella', restriction: DietaryRestriction.SEAFOOD_FREE },
      ],
    });
  }
}
