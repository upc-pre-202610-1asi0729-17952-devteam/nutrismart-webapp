import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { DietaryRestriction } from '../../iam/domain/model/dietary-restriction.enum';

/** A single dish from the menu scan, including which restrictions it conflicts with. */
export interface RawMenuDish {
  rank: number;
  name: string;
  nameKey: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  compatibilityScore: number;
  justification: string;
  justificationKey: string | null;
  conflictingRestrictions: DietaryRestriction[];
}

/** Raw result of a menu scan before restriction filtering is applied. */
export interface RawMenuScan {
  id: number;
  scannedAt: string;
  restaurantName: string;
  allDishes: RawMenuDish[];
}

/**
 * Application-facing API façade for restaurant-menu scanning (ScanMenuPhoto command).
 *
 * Lives in Restaurant Intelligence because menu analysis drives the RestaurantMenu
 * aggregate: dish ranking, restriction filtering, and compatibility scoring.
 *
 * All methods return mock data while a real backend is not available.
 *
 * @author Del Aguila Del Aguila, Olenka Priscilla
 */
@Injectable({ providedIn: 'root' })
export class RestaurantMenuApi extends BaseApi {
  private _http      = inject(HttpClient);
  private _translate = inject(TranslateService);

  constructor() { super(); }

  private _t(namespace: string, key: string | null, fallback: string): string {
    if (!key) return fallback;
    const resolved = this._translate.instant(`${namespace}.${key}`);
    return resolved !== `${namespace}.${key}` ? resolved : fallback;
  }

  /**
   * Submits a restaurant-menu image for dish analysis (ScanMenuPhoto command).
   *
   * Returns all detected dishes with their restriction conflict metadata so the
   * store can apply the user's current restrictions reactively.
   *
   * @param imageBase64 - Base-64-encoded image data.
   * @returns Observable emitting a {@link RawMenuScan} with all dishes unfiltered.
   */
  scanMenuPhoto(imageBase64: string): Observable<RawMenuScan> {
    return of(this._buildRawMenuScan());
  }

  /**
   * Ranks all compatible dishes in a menu analysis (RankCompatibleDishes command).
   *
   * @param menuAnalysisId   - ID of the MenuAnalysis aggregate.
   * @param userRestrictions - Active dietary restrictions for filtering.
   * @returns Observable emitting the updated raw menu scan.
   */
  rankMenuDishes(menuAnalysisId: number, userRestrictions: DietaryRestriction[]): Observable<RawMenuScan> {
    return of(this._buildRawMenuScan());
  }

  // ─── Mock builder ─────────────────────────────────────────────────────────

  private _buildRawMenuScan(): RawMenuScan {
    return {
      id:             1,
      restaurantName: 'Local Restaurant',
      scannedAt:      new Date().toISOString(),
      allDishes: [
        {
          rank: 1, nameKey: 'hake_ceviche',
          name:          this._t('menu_dishes', 'hake_ceviche', 'Hake ceviche'),
          calories: 280, protein: 38, carbs: 12, fat: 8, compatibilityScore: 100,
          justification:    this._t('menu_dishes', 'hake_ceviche_justification', 'Covers 38g of your remaining protein target · Within your caloric budget · No restricted ingredients'),
          justificationKey: 'hake_ceviche_justification',
          conflictingRestrictions: [DietaryRestriction.SEAFOOD_FREE, DietaryRestriction.VEGAN],
        },
        {
          rank: 2, nameKey: 'chicken_cucumber_salad',
          name:          this._t('menu_dishes', 'chicken_cucumber_salad', 'Chicken and cucumber salad'),
          calories: 320, protein: 32, carbs: 14, fat: 10, compatibilityScore: 87,
          justification:    this._t('menu_dishes', 'chicken_cucumber_salad_justification', 'High protein content, within budget'),
          justificationKey: 'chicken_cucumber_salad_justification',
          conflictingRestrictions: [DietaryRestriction.VEGAN, DietaryRestriction.VEGETARIAN],
        },
        {
          rank: 3, nameKey: 'gazpacho_wholemeal_toast',
          name:          this._t('menu_dishes', 'gazpacho_wholemeal_toast', 'Gazpacho with wholemeal toast'),
          calories: 210, protein: 6, carbs: 38, fat: 5, compatibilityScore: 74,
          justification:    this._t('menu_dishes', 'gazpacho_wholemeal_toast_justification', 'Light option within caloric budget'),
          justificationKey: 'gazpacho_wholemeal_toast_justification',
          conflictingRestrictions: [DietaryRestriction.GLUTEN_FREE],
        },
        {
          rank: 4, nameKey: 'cheese_pizza',
          name:          this._t('menu_dishes', 'cheese_pizza', 'Cheese pizza'),
          calories: 520, protein: 20, carbs: 58, fat: 24, compatibilityScore: 55,
          justification: 'Moderate option', justificationKey: null,
          conflictingRestrictions: [DietaryRestriction.LACTOSE_FREE, DietaryRestriction.VEGAN],
        },
        {
          rank: 5, nameKey: 'seafood_paella',
          name:          this._t('menu_dishes', 'seafood_paella', 'Seafood paella'),
          calories: 480, protein: 28, carbs: 62, fat: 12, compatibilityScore: 48,
          justification: 'High carb option', justificationKey: null,
          conflictingRestrictions: [DietaryRestriction.SEAFOOD_FREE, DietaryRestriction.VEGAN],
        },
      ],
    };
  }
}
