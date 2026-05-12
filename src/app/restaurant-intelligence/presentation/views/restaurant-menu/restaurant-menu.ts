import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { TranslatePipe } from '@ngx-translate/core';
import { IamStore } from '../../../../iam/application/iam.store';
import { SubscriptionPlan } from '../../../../iam/domain/model/subscription-plan.enum';
import { MealType } from '../../../../nutrition-tracking/domain/model/meal-type.enum';
import { MacroKey, PlateScanStore } from '../../../../nutrition-tracking/application/plate-scan.store';
import { RestaurantMenuStore } from '../../../application/restaurant-menu.store';
import { RankedDish } from '../../../domain/model/menu-analysis.entity';

/**
 * Smart Scan view — route `/smart-scan`.
 *
 * Orchestrates two domain stores from separate bounded contexts:
 * - {@link PlateScanStore} (Nutrition Tracking) — plate-photo logging flow.
 * - {@link RestaurantMenuStore} (Restaurant Intelligence) — menu analysis flow.
 *
 * The landing page presents both capabilities simultaneously. Interaction with
 * each drop-zone delegates exclusively to the responsible store.
 *
 * @author Del Aguila Del Aguila, Olenka Priscilla
 */
@Component({
  selector: 'app-restaurant-menu',
  imports: [
    TranslatePipe,
    FormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
    MatExpansionModule,
    MatChipsModule,
  ],
  templateUrl: './restaurant-menu.html',
  styleUrl: './restaurant-menu.css',
})
export class RestaurantMenu implements OnInit {
  protected iamStore           = inject(IamStore);
  protected plateScanStore     = inject(PlateScanStore);
  protected restaurantMenuStore = inject(RestaurantMenuStore);
  private   router             = inject(Router);

  protected readonly MealType = MealType;

  protected selectedMealType     = this._defaultMealType();
  protected selectedMenuMealType = this._defaultMealType();
  protected plateDragActive      = signal(false);
  protected menuDragActive       = signal(false);
  protected quantityErrors       = signal<Map<number, string>>(new Map());

  protected isBasic = computed(() => {
    const user = this.iamStore.currentUser();
    return user !== null && !user.isPro();
  });

  protected isPremium = computed(() => {
    const user = this.iamStore.currentUser();
    return user?.plan === SubscriptionPlan.PREMIUM;
  });

  /** True when neither scan flow is active — renders the landing card grid. */
  protected isLanding = computed(() =>
    this.plateScanStore.plateView() === 'idle' &&
    this.restaurantMenuStore.menuView() === 'idle',
  );

  protected isLoading = computed(() =>
    this.plateScanStore.loading() || this.restaurantMenuStore.loading(),
  );

  protected readonly availableMealTypes = computed(() => {
    const hour = new Date().getHours();
    const types = [{ value: MealType.BREAKFAST, labelKey: 'nutrition.breakfast' }];
    if (hour >= 11) types.push({ value: MealType.LUNCH, labelKey: 'nutrition.lunch' });
    types.push({ value: MealType.SNACK, labelKey: 'nutrition.snack' });
    if (hour >= 17) types.push({ value: MealType.DINNER, labelKey: 'nutrition.dinner' });
    return types;
  });

  constructor() {
    this.router.events
      .pipe(
        filter(e => e instanceof NavigationEnd),
        filter(e => (e as NavigationEnd).urlAfterRedirects.startsWith('/smart-scan')),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this._resetAll();
        this.plateScanStore.refreshDailyTotals();
      });
  }

  ngOnInit(): void {
    this._resetAll();
    this.plateScanStore.refreshDailyTotals();
  }

  // ─── Plate drop zone ──────────────────────────────────────────────────────

  onPlateDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.plateDragActive.set(true);
  }

  onPlateDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.plateDragActive.set(false);
  }

  async onPlateDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    this.plateDragActive.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    await this._readAndScanPlate(file);
  }

  // ─── Menu drop zone (Premium only) ───────────────────────────────────────

  onMenuDragOver(event: DragEvent): void {
    event.preventDefault();
    if (!this.isPremium()) return;
    event.stopPropagation();
    this.menuDragActive.set(true);
  }

  onMenuDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.menuDragActive.set(false);
  }

  async onMenuDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    this.menuDragActive.set(false);
    if (!this.isPremium()) return;
    const file = event.dataTransfer?.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    await this._readAndScanMenu(file);
  }

  // ─── Upload / demo triggers ───────────────────────────────────────────────

  async onUploadPlate(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement)?.files?.[0];
    if (!file) return;
    await this._readAndScanPlate(file);
  }

  async onTakePhotoPlate(): Promise<void> {
    await this.plateScanStore.analyzePlatePhoto('demo-plate-base64');
  }

  async onUploadMenu(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement)?.files?.[0];
    if (!file) return;
    await this._readAndScanMenu(file);
  }

  async onTakePhotoMenu(): Promise<void> {
    await this.restaurantMenuStore.analyzeMenuPhoto('demo-menu-base64');
  }

  // ─── Plate result actions ─────────────────────────────────────────────────

  private static readonly MIN_QUANTITY = 1;
  private static readonly MAX_QUANTITY = 2000;

  onQuantityChange(itemId: number, event: Event): void {
    const raw   = (event.target as HTMLInputElement).value;
    const value = parseFloat(raw);
    const errors = new Map(this.quantityErrors());

    if (isNaN(value) || value < RestaurantMenu.MIN_QUANTITY) {
      errors.set(itemId, 'smart_scan.qty_error_min');
      this.quantityErrors.set(errors);
      return;
    }
    if (value > RestaurantMenu.MAX_QUANTITY) {
      errors.set(itemId, 'smart_scan.qty_error_max');
      this.quantityErrors.set(errors);
      return;
    }

    errors.delete(itemId);
    this.quantityErrors.set(errors);
    this.plateScanStore.updateScannedItemQuantity(itemId, value);
  }

  quantityError(itemId: number): string | null {
    return this.quantityErrors().get(itemId) ?? null;
  }

  onRemoveItem(itemId: number): void {
    this.plateScanStore.removeScannedItem(itemId);
  }

  async onConfirmLog(): Promise<void> {
    await this.plateScanStore.logScannedPlate(this.selectedMealType);
  }

  onCancel(): void {
    this._resetAll();
  }

  // ─── Menu result actions ──────────────────────────────────────────────────

  async onLogMenuDish(dish: RankedDish): Promise<void> {
    await this.restaurantMenuStore.logSelectedDish(dish, this.selectedMenuMealType);
  }

  // ─── i18n helper ──────────────────────────────────────────────────────────

  protected macroI18nKey(macro: MacroKey): string {
    const map: Record<MacroKey, string> = {
      calories: 'nutrition.calories',
      protein:  'nutrition.protein',
      carbs:    'nutrition.carbohydrates',
      fat:      'nutrition.fats',
      fiber:    'nutrition.fiber',
    };
    return map[macro];
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private _resetAll(): void {
    this.plateScanStore.reset();
    this.restaurantMenuStore.reset();
  }

  private _defaultMealType(): MealType {
    const hour = new Date().getHours();
    if (hour >= 17) return MealType.DINNER;
    if (hour >= 11) return MealType.LUNCH;
    return MealType.BREAKFAST;
  }

  private _readAndScanPlate(file: File): Promise<void> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async () => {
        await this.plateScanStore.analyzePlatePhoto(reader.result as string);
        resolve();
      };
      reader.readAsDataURL(file);
    });
  }

  private _readAndScanMenu(file: File): Promise<void> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async () => {
        await this.restaurantMenuStore.analyzeMenuPhoto(reader.result as string);
        resolve();
      };
      reader.readAsDataURL(file);
    });
  }
}
