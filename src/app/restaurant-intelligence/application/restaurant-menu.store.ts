import { computed, inject, Injectable, signal } from '@angular/core';
import { TranslateStore } from '@ngx-translate/core';
import { DomainEventBus } from '../../shared/application/domain-event-bus';
import { RestaurantMealAnalyzed } from '../domain/events/restaurant-meal-analyzed.event';
import { CompatibleDishesRanked } from '../../shared/domain/compatible-dishes-ranked.event';
import { IamStore } from '../../iam/application/iam.store';
import { MealType } from '../../nutrition-tracking/domain/model/meal-type.enum';
import { MealRecord, MealRecordProps } from '../../nutrition-tracking/domain/model/meal-record.entity';
import { NutritionStore } from '../../nutrition-tracking/application/nutrition.store';
import { MenuAnalysis, RankedDish } from '../domain/model/menu-analysis.entity';
import { RawMenuScan, RestaurantMenuApi } from '../infrastructure/restaurant-menu-api';
import { MacroAlert, MacroKey } from '../../nutrition-tracking/application/plate-scan.store';

/** Active view state within the restaurant-menu flow. */
export type MenuView = 'idle' | 'analyzing' | 'result';

/**
 * Application store for the restaurant-menu scanning flow (Restaurant Intelligence context).
 *
 * Manages the ScanMenuPhoto → FilterRestrictedDishes → RankCompatibleDishes
 * command pipeline. Publishes {@link CompatibleDishesRanked} when ranking
 * completes so Smart Recommendation can surface the best dish suggestion.
 *
 * @author Del Aguila Del Aguila, Olenka Priscilla
 */
@Injectable({ providedIn: 'root' })
export class RestaurantMenuStore {
  private static readonly WARNING_THRESHOLD = 0.8;
  private static readonly DANGER_THRESHOLD  = 1.0;

  private restaurantMenuApi = inject(RestaurantMenuApi);
  private iamStore          = inject(IamStore);
  private nutritionStore    = inject(NutritionStore);
  private translateStore    = inject(TranslateStore);
  private domainEventBus    = inject(DomainEventBus);

  // ─── Private Signals ──────────────────────────────────────────────────────

  private _menuView        = signal<MenuView>('idle');
  private _rawMenuAnalysis = signal<MenuAnalysis | null>(null);
  private _loading         = signal<boolean>(false);
  private _error           = signal<string | null>(null);

  // ─── Public Read-only Signals ─────────────────────────────────────────────

  readonly menuView = this._menuView.asReadonly();
  readonly loading  = this._loading.asReadonly();
  readonly error    = this._error.asReadonly();

  /**
   * Reactively computed menu analysis filtered by the user's active restrictions.
   *
   * Delegates filtering to {@link MenuAnalysis.analyzeCompatibility} so restriction
   * changes propagate instantly without requiring a re-scan.
   */
  readonly menuAnalysis = computed<MenuAnalysis | null>(() => {
    const raw          = this._rawMenuAnalysis();
    const restrictions = this.iamStore.currentUser()?.restrictions ?? [];
    return raw?.analyzeCompatibility(restrictions) ?? null;
  });

  /** True when the user has a Premium subscription. */
  readonly canScanMenu = computed(() => this.iamStore.currentUser()?.plan === 'PREMIUM');

  /**
   * Projects the nutritional impact of logging each ranked dish from the current
   * menu analysis, keyed by dish rank.
   */
  readonly menuDishAlertsByRank = computed<Record<number, MacroAlert[]>>(() => {
    const user   = this.iamStore.currentUser();
    const totals = this.nutritionStore.dailyTotals();
    const dishes = this.menuAnalysis()?.rankedDishes ?? [];
    if (!user || dishes.length === 0) return {};

    const result: Record<number, MacroAlert[]> = {};
    for (const dish of dishes) {
      const alerts = this._projectNutritionalImpact(
        { calories: dish.calories, protein: dish.protein, carbs: dish.carbs, fat: dish.fat, fiber: 0 },
        totals,
        user,
      );
      if (alerts.length > 0) result[dish.rank] = alerts;
    }
    return result;
  });

  // ─── Actions ──────────────────────────────────────────────────────────────

  reset(): void {
    this._menuView.set('idle');
    this._rawMenuAnalysis.set(null);
    this._error.set(null);
  }

  async analyzeMenuPhoto(imageBase64: string): Promise<void> {
    this._menuView.set('analyzing');
    this._loading.set(true);
    this._error.set(null);

    return new Promise((resolve) => {
      this.restaurantMenuApi.scanMenuPhoto(imageBase64).subscribe({
        next: (raw: RawMenuScan) => {
          const analysis = new MenuAnalysis({
            id:               raw.id,
            scannedAt:        raw.scannedAt,
            restaurantName:   raw.restaurantName,
            rankedDishes: raw.allDishes.map((d, i) => new RankedDish({
              rank: i + 1, name: d.name, nameKey: d.nameKey,
              calories: d.calories, protein: d.protein, carbs: d.carbs, fat: d.fat,
              compatibilityScore: d.compatibilityScore,
              justification: d.justification, justificationKey: d.justificationKey,
              conflictingRestrictions: d.conflictingRestrictions,
            })),
            restrictedDishes: [],
          });
          this._rawMenuAnalysis.set(analysis);
          this._menuView.set('result');
          this._loading.set(false);
          this._publishCompatibleDishesRanked(analysis);
          resolve();
        },
        error: () => {
          this._error.set('Failed to analyse menu photo.');
          this._menuView.set('idle');
          this._loading.set(false);
          resolve();
        },
      });
    });
  }

  /**
   * Logs a single menu dish as a meal record (ConfirmMenuDish command → MealRecorded event).
   *
   * @param dish     - The {@link RankedDish} the user chose to log.
   * @param mealType - Meal slot to assign the record to.
   */
  async logSelectedDish(dish: RankedDish, mealType: MealType): Promise<void> {
    const user = this.iamStore.currentUser();
    if (!user) return;

    this._loading.set(true);
    this._error.set(null);

    const { foodItemName, foodItemNameEs } = this._resolveLocalizedNames(
      dish.nameKey, 'menu_dishes', dish.name,
    );
    const props: MealRecordProps = {
      id:           0,
      foodItemId:   0,
      foodItemName,
      foodItemNameEs,
      mealType,
      quantity:     1,
      unit:         'serving',
      calories:     dish.calories,
      protein:      dish.protein,
      carbs:        dish.carbs,
      fat:          dish.fat,
      fiber:        0,
      sugar:        0,
      loggedAt:     new Date().toISOString(),
      userId:       user.id,
    };

    try {
      await this.nutritionStore.recordMeal(new MealRecord(props));
      this.domainEventBus.publish(new RestaurantMealAnalyzed(user.id, mealType, dish.calories));
      this._loading.set(false);
      this.reset();
    } catch {
      this._error.set('Failed to log menu dish.');
      this._loading.set(false);
    }
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private _publishCompatibleDishesRanked(analysis: MenuAnalysis): void {
    const user = this.iamStore.currentUser();
    if (!user) return;

    const restrictions = user.restrictions ?? [];
    const filtered     = analysis.analyzeCompatibility(restrictions);
    const best         = filtered.bestDish;
    if (!best) return;

    this.domainEventBus.publish(new CompatibleDishesRanked(
      user.id,
      best.name,
      best.nameKey,
      best.calories,
      best.protein,
      best.carbs,
      best.fat,
      filtered.rankedDishes.length,
    ));
  }

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
      .filter(m => m.ratio >= RestaurantMenuStore.WARNING_THRESHOLD)
      .map(m => ({
        macro:     m.key,
        target:    m.target,
        consumed:  m.consumed,
        scanTotal: m.scanTotal,
        projected: m.projected,
        percent:   Math.round(m.ratio * 100),
        severity:  m.ratio >= RestaurantMenuStore.DANGER_THRESHOLD ? 'danger' : 'warning',
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
}
