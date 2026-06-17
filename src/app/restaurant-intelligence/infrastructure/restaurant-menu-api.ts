import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { DietaryRestriction } from '../../iam/domain/model/dietary-restriction.enum';
import { environment } from '../../../environments/environment.development';

/** A single dish from the menu scan, including which restrictions it conflicts with. */
export interface RawMenuDish {
  rank: number;
  name: string;
  nameEs: string | null;
  nameKey: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  compatibilityScore: number;
  justification: string;
  justificationEs: string | null;
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

interface ScanMenuResponse {
  rankedDishes: Array<{
    rank: number;
    dishName: string;
    dishNameEs: string | null;
    nameKey: string | null;
    price: string | null;
    matchedFoodItemId: number | null;
    compatibilityScore: number;
    reason: string;
    reasonEn: string | null;
    estimatedCalories: number;
    estimatedProtein: number;
    estimatedCarbs: number;
    estimatedFat: number;
    conflictingRestrictions: string[];
  }>;
}

/**
 * Application-facing API façade for restaurant-menu scanning (ScanMenuPhoto command).
 *
 * Calls POST /api/v1/restaurant-intelligence/menu-scan with the imageBase64 payload
 * and maps the response to the {@link RawMenuScan} format consumed by the store.
 *
 * @author Del Aguila Del Aguila, Olenka Priscilla
 */
@Injectable({ providedIn: 'root' })
export class RestaurantMenuApi extends BaseApi {
  private _http      = inject(HttpClient);
  private _translate = inject(TranslateService);

  private readonly _menuUrl = environment.apiBaseUrl + '/restaurant-intelligence/menu-scan';

  constructor() { super(); }

  /**
   * Submits a restaurant-menu image for dish analysis via Gemini + DeepSeek.
   *
   * @param imageBase64 - Base-64-encoded image data (data URL accepted).
   * @returns Observable emitting a {@link RawMenuScan} with all dishes ranked.
   */
  scanMenuPhoto(imageBase64: string): Observable<RawMenuScan> {
    return this._http.post<ScanMenuResponse>(this._menuUrl, { imageBase64 }).pipe(
      map(response => this._toRawMenuScan(response)),
      catchError(() => of(this._emptyRawMenuScan())),
    );
  }

  /**
   * @deprecated Ranking is now performed server-side in the same scan call.
   */
  rankMenuDishes(_menuAnalysisId: number, _userRestrictions: DietaryRestriction[]): Observable<RawMenuScan> {
    return of(this._emptyRawMenuScan());
  }

  // ─── Mapping ──────────────────────────────────────────────────────────────

  private _toRawMenuScan(response: ScanMenuResponse): RawMenuScan {
    if (!response.rankedDishes || response.rankedDishes.length === 0) {
      return this._emptyRawMenuScan();
    }

    const allDishes: RawMenuDish[] = response.rankedDishes.map(d => ({
      rank:               d.rank,
      name:               d.dishName,
      nameEs:             d.dishNameEs ?? null,
      nameKey:            d.nameKey ?? null,
      calories:           d.estimatedCalories,
      protein:            d.estimatedProtein,
      carbs:              d.estimatedCarbs,
      fat:                d.estimatedFat,
      compatibilityScore: d.compatibilityScore,
      justification:      d.reasonEn ?? d.reason,
      justificationEs:    d.reason ?? null,
      justificationKey:   null,
      conflictingRestrictions: (d.conflictingRestrictions ?? []).map(r => r as DietaryRestriction),
    }));

    return {
      id:             1,
      scannedAt:      new Date().toISOString(),
      restaurantName: 'Restaurant',
      allDishes,
    };
  }

  private _emptyRawMenuScan(): RawMenuScan {
    return { id: 0, scannedAt: new Date().toISOString(), restaurantName: '', allDishes: [] };
  }
}
