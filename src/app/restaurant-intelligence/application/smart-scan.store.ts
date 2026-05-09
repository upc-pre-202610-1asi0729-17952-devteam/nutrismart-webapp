import { computed, inject, Injectable, signal } from '@angular/core';
import { IamStore } from '../../iam/application/iam.store';
import { DietaryRestriction } from '../../iam/domain/model/dietary-restriction.enum';
import { MealType } from '../../nutrition-tracking/domain/model/meal-type.enum';
import { ScanResult } from '../domain/model/scan-result.entity';
import { MenuAnalysis } from '../domain/model/menu-analysis.entity';
import { SmartScanApi } from '../infrastructure/smart-scan-api';

/** Active view within the Smart Scan feature. */
export type SmartScanView = 'landing' | 'analyzing-plate' | 'plate-result' | 'plate-invalid' | 'analyzing-menu' | 'menu-result';

/**
 * Central state store for the Restaurant Intelligence bounded context.
 *
 * Manages the full Smart Scan session lifecycle — from image selection through
 * result confirmation — using Angular Signals.
 *
 * @author Del Aguila Del Aguila, Olenka Priscilla
 */
@Injectable({ providedIn: 'root' })
export class SmartScanStore {
  private smartScanApi = inject(SmartScanApi);
  private iamStore     = inject(IamStore);

  // ─── Private Signals ──────────────────────────────────────────────────────

  private _view        = signal<SmartScanView>('landing');
  private _scanResult  = signal<ScanResult | null>(null);
  private _menuAnalysis = signal<MenuAnalysis | null>(null);
  private _loading     = signal<boolean>(false);
  private _error       = signal<string | null>(null);
  private _uploadedImagePreview = signal<string | null>(null);

  // ─── Public Read-only Signals ─────────────────────────────────────────────

  readonly view               = this._view.asReadonly();
  readonly scanResult         = this._scanResult.asReadonly();
  readonly menuAnalysis       = this._menuAnalysis.asReadonly();
  readonly loading            = this._loading.asReadonly();
  readonly error              = this._error.asReadonly();
  readonly uploadedImagePreview = this._uploadedImagePreview.asReadonly();

  // ─── Computed Signals ─────────────────────────────────────────────────────

  /** Whether the current user's plan allows plate scanning (Pro or Premium). */
  readonly canScanPlate = computed(() => {
    const user = this.iamStore.currentUser();
    return user?.isPro() ?? false;
  });

  /** Whether the current user's plan allows menu scanning (Premium only). */
  readonly canScanMenu = computed(() => {
    const user = this.iamStore.currentUser();
    return user?.plan === 'PREMIUM';
  });

  /** Total estimated kcal for the current scan result. */
  readonly totalEstimatedCalories = computed(() =>
    this._scanResult()?.totalCalories ?? 0,
  );

  /** Whether the plate result has any detected items to display. */
  readonly hasScanItems = computed(() =>
    this._scanResult()?.hasItems ?? false,
  );

  // ─── Actions ──────────────────────────────────────────────────────────────

  /** Resets the store to the landing view, clearing any previous results. */
  reset(): void {
    this._view.set('landing');
    this._scanResult.set(null);
    this._menuAnalysis.set(null);
    this._error.set(null);
    this._uploadedImagePreview.set(null);
  }

  /**
   * Initiates a food-plate scan (ScanMealPhoto command).
   *
   * Transitions through analyzing → success or invalid states.
   *
   * @param imageBase64 - Base-64-encoded image data from file or camera.
   */
  async scanFoodPlate(imageBase64: string): Promise<void> {
    this._uploadedImagePreview.set(imageBase64);
    this._view.set('analyzing-plate');
    this._loading.set(true);
    this._error.set(null);

    return new Promise((resolve) => {
      this.smartScanApi.scanFoodPlate(imageBase64).subscribe({
        next: (result) => {
          this._scanResult.set(result);
          this._view.set(result.hasItems ? 'plate-result' : 'plate-invalid');
          this._loading.set(false);
          resolve();
        },
        error: () => {
          this._scanResult.set(null);
          this._view.set('plate-invalid');
          this._loading.set(false);
          resolve();
        },
      });
    });
  }

  /**
   * Initiates a restaurant-menu scan (ScanMenuPhoto command).
   *
   * @param imageBase64 - Base-64-encoded image data.
   */
  async scanMenuPhoto(imageBase64: string): Promise<void> {
    this._view.set('analyzing-menu');
    this._loading.set(true);
    this._error.set(null);

    return new Promise((resolve) => {
      this.smartScanApi.scanMenuPhoto(imageBase64).subscribe({
        next: (analysis) => {
          this._menuAnalysis.set(analysis);
          this._view.set('menu-result');
          this._loading.set(false);
          resolve();
        },
        error: () => {
          this._error.set('Failed to analyse menu photo.');
          this._view.set('landing');
          this._loading.set(false);
          resolve();
        },
      });
    });
  }

  /**
   * Confirms the scan result and logs it as a meal entry (ConfirmScanResult command).
   *
   * @param mealType - Meal window selected by the user before logging.
   */
  async confirmPlateScan(mealType: MealType): Promise<void> {
    const result = this._scanResult();
    if (!result) return;
    result.mealType = mealType;
    this._loading.set(true);

    return new Promise((resolve) => {
      this.smartScanApi.confirmPlateScan(result).subscribe({
        next: () => {
          this._loading.set(false);
          this.reset();
          resolve();
        },
        error: () => {
          this._error.set('Failed to log meal from scan.');
          this._loading.set(false);
          resolve();
        },
      });
    });
  }

  /**
   * Updates the quantity of a detected item and rescales its macros.
   *
   * @param itemId      - ID of the item to update.
   * @param newQuantity - New quantity in grams entered by the user.
   */
  updateScannedItemQuantity(itemId: number, newQuantity: number): void {
    const result = this._scanResult();
    if (!result) return;
    result.updateItemQuantity(itemId, newQuantity);
    this._scanResult.set(result);
  }

  /**
   * Removes a detected item from the current scan result.
   *
   * @param itemId - ID of the item to remove.
   */
  removeScannedItem(itemId: number): void {
    const result = this._scanResult();
    if (!result) return;
    result.removeItem(itemId);
    this._scanResult.set(result);
  }

  /**
   * Fetches ranked and filtered dishes for the loaded menu analysis.
   *
   * @param menuAnalysisId - ID of the menu analysis to re-rank.
   */
  async rankAndFilterMenuDishes(menuAnalysisId: number): Promise<void> {
    const user = this.iamStore.currentUser();
    const restrictions = (user?.restrictions ?? []) as DietaryRestriction[];
    this._loading.set(true);

    return new Promise((resolve) => {
      this.smartScanApi.rankMenuDishes(menuAnalysisId, restrictions).subscribe({
        next: (analysis) => {
          this._menuAnalysis.set(analysis);
          this._loading.set(false);
          resolve();
        },
        error: () => {
          this._error.set('Failed to rank menu dishes.');
          this._loading.set(false);
          resolve();
        },
      });
    });
  }
}
