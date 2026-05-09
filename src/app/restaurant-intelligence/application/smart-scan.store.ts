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

/** Macro dimension tracked in the nutritional impact projection. */
export type MacroKey = 'calories' | 'protein' | 'carbs' | 'fat' | 'fiber';

/** Result of projecting what happens to one macro after confirming the scan. */
export interface MacroAlert {
  macro:     MacroKey;
  target:    number;
  consumed:  number;
  scanTotal: number;
  projected: number;
  percent:   number;
  severity:  'warning' | 'danger';
}

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
  private static readonly WARNING_THRESHOLD = 0.8;
  private static readonly DANGER_THRESHOLD  = 1.0;
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

  /**
   * Projects the nutritional impact of confirming the current scan result
   * against the user's daily targets and consumed totals.
   *
   * Returns one {@link MacroAlert} per macro that would reach ≥ 80 % of its
   * daily target after adding the scanned items.
   */
  readonly macroAlerts = computed<MacroAlert[]>(() => {
    const user   = this.iamStore.currentUser();
    const result = this._scanResult();
    const totals = this.nutritionStore.dailyTotals();
    if (!user || !result) return [];

    const scanTotals = result.detectedItems.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        protein:  acc.protein  + item.protein,
        carbs:    acc.carbs    + item.carbs,
        fat:      acc.fat      + item.fat,
        fiber:    acc.fiber    + 0,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    );

    const macros: Array<{ key: MacroKey; consumed: number; scanTotal: number; target: number }> = [
      { key: 'calories', consumed: totals.calories, scanTotal: scanTotals.calories, target: user.dailyCalorieTarget },
      { key: 'protein',  consumed: totals.protein,  scanTotal: scanTotals.protein,  target: user.proteinTarget },
      { key: 'carbs',    consumed: totals.carbs,    scanTotal: scanTotals.carbs,    target: user.carbsTarget },
      { key: 'fat',      consumed: totals.fat,      scanTotal: scanTotals.fat,      target: user.fatTarget },
      { key: 'fiber',    consumed: totals.fiber,    scanTotal: scanTotals.fiber,    target: user.fiberTarget },
    ];

    return macros
      .filter(m => m.target > 0)
      .map(m => ({ ...m, projected: m.consumed + m.scanTotal, ratio: (m.consumed + m.scanTotal) / m.target }))
      .filter(m => m.ratio >= SmartScanStore.WARNING_THRESHOLD)
      .map(m => ({
        macro:     m.key,
        target:    m.target,
        consumed:  m.consumed,
        scanTotal: m.scanTotal,
        projected: m.projected,
        percent:   Math.round(m.ratio * 100),
        severity:  m.ratio >= SmartScanStore.DANGER_THRESHOLD ? 'danger' : 'warning',
      } as MacroAlert));
  });

  readonly hasMacroAlerts = computed(() => this.macroAlerts().length > 0);

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
