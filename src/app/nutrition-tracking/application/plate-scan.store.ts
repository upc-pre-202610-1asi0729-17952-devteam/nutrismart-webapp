import { computed, inject, Injectable, signal } from '@angular/core';
import { TranslateStore } from '@ngx-translate/core';
import { IamStore } from '../../iam/application/iam.store';
import { MealType } from '../domain/model/meal-type.enum';
import { MealRecord, MealRecordProps } from '../domain/model/meal-record.entity';
import { ScanResult } from '../domain/model/scan-result.entity';
import { NutritionStore } from './nutrition.store';
import { PlateScanApi } from '../infrastructure/plate-scan-api';

/** Active view state within the plate-scan flow. */
export type PlateView = 'idle' | 'analyzing' | 'result' | 'invalid';

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
 * Application store for the plate-scan flow within the Nutrition Tracking context.
 *
 * Manages the ScanMealPhoto command lifecycle: image upload → AI analysis →
 * user confirmation → MealRecord creation via {@link NutritionStore}.
 *
 * @author Del Aguila Del Aguila, Olenka Priscilla
 */
@Injectable({ providedIn: 'root' })
export class PlateScanStore {
  private static readonly WARNING_THRESHOLD = 0.8;
  private static readonly DANGER_THRESHOLD  = 1.0;

  private plateScanApi    = inject(PlateScanApi);
  private iamStore        = inject(IamStore);
  private nutritionStore  = inject(NutritionStore);
  private translateStore  = inject(TranslateStore);

  // ─── Private Signals ──────────────────────────────────────────────────────

  private _plateView            = signal<PlateView>('idle');
  private _scanResult           = signal<ScanResult | null>(null);
  private _loading              = signal<boolean>(false);
  private _error                = signal<string | null>(null);
  private _uploadedImagePreview = signal<string | null>(null);

  // ─── Public Read-only Signals ─────────────────────────────────────────────

  readonly plateView            = this._plateView.asReadonly();
  readonly scanResult           = this._scanResult.asReadonly();
  readonly loading              = this._loading.asReadonly();
  readonly error                = this._error.asReadonly();
  readonly uploadedImagePreview = this._uploadedImagePreview.asReadonly();

  // ─── Computed Signals ─────────────────────────────────────────────────────

  /** True when the user has at least a Pro subscription. */
  readonly canScanPlate = computed(() => this.iamStore.currentUser()?.isPro() ?? false);

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
   * Returns one {@link MacroAlert} per macro that would reach ≥ 80% of its
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

    return this._projectNutritionalImpact(scanTotals, totals, user);
  });

  readonly hasMacroAlerts = computed(() => this.macroAlerts().length > 0);

  // ─── Actions ──────────────────────────────────────────────────────────────

  reset(): void {
    this._plateView.set('idle');
    this._scanResult.set(null);
    this._error.set(null);
    this._uploadedImagePreview.set(null);
  }

  /** Fetches fresh daily meal records so macroAlerts reflects the current state. */
  async refreshDailyTotals(): Promise<void> {
    await this.nutritionStore.loadMealHistory();
  }

  async analyzePlatePhoto(imageBase64: string): Promise<void> {
    this._uploadedImagePreview.set(imageBase64);
    this._plateView.set('analyzing');
    this._loading.set(true);
    this._error.set(null);

    return new Promise((resolve) => {
      this.plateScanApi.scanFoodPlate(imageBase64).subscribe({
        next: (result) => {
          this._scanResult.set(result);
          this._plateView.set(result.hasItems ? 'result' : 'invalid');
          this._loading.set(false);
          resolve();
        },
        error: () => {
          this._scanResult.set(null);
          this._plateView.set('invalid');
          this._loading.set(false);
          resolve();
        },
      });
    });
  }

  /**
   * Confirms the scan and creates one MealRecord per detected item via
   * NutritionStore (ConfirmScanResult command → MealRecorded event).
   *
   * @param mealType - Meal slot to assign the records to.
   */
  async logScannedPlate(mealType: MealType): Promise<void> {
    const result = this._scanResult();
    const user   = this.iamStore.currentUser();
    if (!result || !user) return;

    this._loading.set(true);
    this._error.set(null);

    const timestamp = new Date().toISOString();

    try {
      for (const item of result.detectedItems) {
        const { foodItemName, foodItemNameEs } = this._resolveLocalizedNames(
          item.nameKey, 'food_items', item.name,
        );
        const props: MealRecordProps = {
          id:            0,
          foodItemId:    0,
          foodItemName,
          foodItemNameEs,
          mealType,
          quantity:      item.quantityGrams,
          unit:          'g',
          calories:      item.calories,
          protein:       item.protein,
          carbs:         item.carbs,
          fat:           item.fat,
          fiber:         0,
          sugar:         0,
          loggedAt:      timestamp,
          userId:        user.id,
        };
        await this.nutritionStore.recordMeal(new MealRecord(props));
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
   *
   * @param itemId      - ID of the item to update.
   * @param newQuantity - New quantity in grams.
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
   *
   * @param itemId - ID of the item to remove.
   */
  removeScannedItem(itemId: number): void {
    const result = this._scanResult();
    if (!result) return;
    result.removeItem(itemId);
    this._scanResult.set(this._cloneScanResult(result));
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private _projectNutritionalImpact(
    adding: { calories: number; protein: number; carbs: number; fat: number; fiber: number },
    consumed: { calories: number; protein: number; carbs: number; fat: number; fiber: number },
    user: { dailyCalorieTarget: number; proteinTarget: number; carbsTarget: number; fatTarget: number; fiberTarget: number },
  ): MacroAlert[] {
    const macros: Array<{ key: MacroKey; consumed: number; scanTotal: number; target: number }> = [
      { key: 'calories', consumed: consumed.calories, scanTotal: adding.calories, target: user.dailyCalorieTarget },
      { key: 'protein',  consumed: consumed.protein,  scanTotal: adding.protein,  target: user.proteinTarget },
      { key: 'carbs',    consumed: consumed.carbs,    scanTotal: adding.carbs,    target: user.carbsTarget },
      { key: 'fat',      consumed: consumed.fat,      scanTotal: adding.fat,      target: user.fatTarget },
      { key: 'fiber',    consumed: consumed.fiber,    scanTotal: adding.fiber,    target: user.fiberTarget },
    ];

    return macros
      .filter(m => m.target > 0)
      .map(m => ({ ...m, projected: m.consumed + m.scanTotal, ratio: (m.consumed + m.scanTotal) / m.target }))
      .filter(m => m.ratio >= PlateScanStore.WARNING_THRESHOLD)
      .map(m => ({
        macro:     m.key,
        target:    m.target,
        consumed:  m.consumed,
        scanTotal: m.scanTotal,
        projected: m.projected,
        percent:   Math.round(m.ratio * 100),
        severity:  m.ratio >= PlateScanStore.DANGER_THRESHOLD ? 'danger' : 'warning',
      } as MacroAlert));
  }

  private _resolveLocalizedNames(
    nameKey: string | null,
    namespace: string,
    fallback: string,
  ): { foodItemName: string; foodItemNameEs: string } {
    if (!nameKey) return { foodItemName: fallback, foodItemNameEs: fallback };
    const enMap = this.translateStore.getTranslations('en') as Record<string, Record<string, string>>;
    const esMap = this.translateStore.getTranslations('es') as Record<string, Record<string, string>>;
    const enName = enMap?.[namespace]?.[nameKey] ?? fallback;
    const esName = esMap?.[namespace]?.[nameKey] ?? fallback;
    return { foodItemName: enName, foodItemNameEs: esName };
  }

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
