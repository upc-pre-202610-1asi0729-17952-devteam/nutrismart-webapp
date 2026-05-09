import { computed, inject, Injectable, signal } from '@angular/core';
import { IamStore } from '../../iam/application/iam.store';
import { DietaryRestriction } from '../../iam/domain/model/dietary-restriction.enum';
import { MealType } from '../../nutrition-tracking/domain/model/meal-type.enum';
import { MealRecord, MealRecordProps } from '../../nutrition-tracking/domain/model/meal-record.entity';
import { NutritionStore } from '../../nutrition-tracking/application/nutrition.store';
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
  private smartScanApi   = inject(SmartScanApi);
  private iamStore       = inject(IamStore);
  private nutritionStore = inject(NutritionStore);

  // ─── Private Signals ──────────────────────────────────────────────────────

  private _view             = signal<SmartScanView>('landing');
  private _scanResult       = signal<ScanResult | null>(null);
  private _menuAnalysis     = signal<MenuAnalysis | null>(null);
  private _loading          = signal<boolean>(false);
  private _error            = signal<string | null>(null);
  private _uploadedImagePreview = signal<string | null>(null);

  // ─── Public Read-only Signals ─────────────────────────────────────────────

  readonly view                 = this._view.asReadonly();
  readonly scanResult           = this._scanResult.asReadonly();
  readonly menuAnalysis         = this._menuAnalysis.asReadonly();
  readonly loading              = this._loading.asReadonly();
  readonly error                = this._error.asReadonly();
  readonly uploadedImagePreview = this._uploadedImagePreview.asReadonly();

  // ─── Computed Signals ─────────────────────────────────────────────────────

  readonly canScanPlate = computed(() => this.iamStore.currentUser()?.isPro() ?? false);
  readonly canScanMenu  = computed(() => this.iamStore.currentUser()?.plan === 'PREMIUM');

  readonly totalEstimatedCalories = computed(() =>
    this._scanResult()?.totalCalories ?? 0,
  );

  readonly hasScanItems = computed(() =>
    this._scanResult()?.hasItems ?? false,
  );

  // ─── Actions ──────────────────────────────────────────────────────────────

  reset(): void {
    this._view.set('landing');
    this._scanResult.set(null);
    this._menuAnalysis.set(null);
    this._error.set(null);
    this._uploadedImagePreview.set(null);
  }

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
   * Confirms the scan and creates one MealRecord per detected item via
   * NutritionStore (ConfirmScanResult command → MealRecorded event).
   */
  async confirmPlateScan(mealType: MealType): Promise<void> {
    const result = this._scanResult();
    const user   = this.iamStore.currentUser();
    if (!result || !user) return;

    this._loading.set(true);
    this._error.set(null);

    const timestamp = new Date().toISOString();

    try {
      for (const item of result.detectedItems) {
        const props: MealRecordProps = {
          id:              0,
          foodItemId:      0,
          foodItemName:    item.name,
          mealType,
          quantity:        item.quantityGrams,
          unit:            'g',
          calories:        item.calories,
          protein:         item.protein,
          carbs:           item.carbs,
          fat:             item.fat,
          fiber:           0,
          sugar:           0,
          loggedAt:        timestamp,
          userId:          user.id,
        };
        await this.nutritionStore.addMealEntry(new MealRecord(props));
      }
      this._loading.set(false);
      this.reset();
    } catch {
      this._error.set('Failed to log meal from scan.');
      this._loading.set(false);
    }
  }

  /**
   * Updates the quantity of a detected item and rescales its macros.
   * Creates a new ScanResult instance so Angular signals detect the change.
   */
  updateScannedItemQuantity(itemId: number, newQuantity: number): void {
    const result = this._scanResult();
    if (!result) return;
    result.updateItemQuantity(itemId, newQuantity);
    this._scanResult.set(this._cloneScanResult(result));
  }

  /**
   * Removes a detected item from the scan result.
   * Creates a new ScanResult instance so Angular signals detect the change.
   */
  removeScannedItem(itemId: number): void {
    const result = this._scanResult();
    if (!result) return;
    result.removeItem(itemId);
    this._scanResult.set(this._cloneScanResult(result));
  }

  async rankAndFilterMenuDishes(menuAnalysisId: number): Promise<void> {
    const restrictions = (this.iamStore.currentUser()?.restrictions ?? []) as DietaryRestriction[];
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

  // ─── Private helpers ──────────────────────────────────────────────────────

  /**
   * Creates a new ScanResult from an existing one so that Angular signal
   * equality check (===) detects a change and triggers re-render.
   */
  private _cloneScanResult(source: ScanResult): ScanResult {
    return new ScanResult({
      id:            source.id,
      status:        source.status,
      imageBase64:   source.imageBase64,
      detectedItems: source.detectedItems,
      mealType:      source.mealType,
      source:        source.source,
      scannedAt:     source.scannedAt,
    });
  }
}
